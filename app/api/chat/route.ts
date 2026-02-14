import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { CASHIER_SYSTEM_PROMPT } from "@/lib/prompt";
import { getSupabase } from "@/lib/supabase";
import type { LineItem } from "@/lib/types";

function extractOrderJson(text: string): { items: LineItem[]; total: number } | null {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim()) as {
      items: LineItem[];
      total: number;
    };
    if (Array.isArray(parsed.items) && typeof parsed.total === "number") return parsed;
  } catch {
    // ignore
  }
  return null;
}

/** GET /api/chat — debug: see what env vars Railway actually provides. */
export async function GET() {
  const key =
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  const hasKey = !!key;
  const relevantEnvKeys = Object.keys(process.env).filter(
    (k) =>
      k.includes("GEMINI") ||
      k.includes("GOOGLE") ||
      k.includes("GENAI")
  );
  // All env var names (no values) so we can see if the key is there under another name
  const allEnvKeys = Object.keys(process.env).sort();
  return NextResponse.json({
    ok: true,
    geminiConfigured: hasKey,
    keyLength: hasKey ? key.length : 0,
    relevantEnvKeys,
    allEnvKeys,
    hint: hasKey
      ? "Key is set. If chat still fails, the key may be invalid or the model unavailable."
      : `No Gemini key found. Check allEnvKeys for typos. Add GOOGLE_GENAI_API_KEY on the SERVICE (not project) → Variables → Redeploy.`,
  });
}

export async function POST(request: Request) {
  const { messages } = (await request.json()) as {
    messages: { role: "user" | "assistant" | "system"; content: string }[];
  };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }
  const apiKey =
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Gemini API key not set. Add GOOGLE_GENAI_API_KEY in Railway → your service → Variables.",
      },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const preferredModel = process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash";
  const fallbackModel = "gemini-1.5-flash";

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: m.content }],
    }));
  // Gemini expects conversation to start with user; drop leading model messages
  while (contents.length > 0 && contents[0].role !== "user") {
    contents.shift();
  }
  if (contents.length === 0) {
    return NextResponse.json(
      { error: "No user message in conversation" },
      { status: 400 }
    );
  }

  let content: string;
  const tryModel = async (model: string) => {
    const response = await ai.models.generateContent({
      model,
      config: {
        systemInstruction: CASHIER_SYSTEM_PROMPT,
        temperature: 0.5,
      },
      contents,
    });
    return (response.text ?? "").trim();
  };
  try {
    content = await tryModel(preferredModel);
  } catch (err) {
    if (preferredModel !== fallbackModel) {
      try {
        content = await tryModel(fallbackModel);
      } catch {
        const msg = err instanceof Error ? err.message : "Gemini request failed";
        return NextResponse.json(
          { error: msg },
          { status: 502 }
        );
      }
    } else {
      const msg = err instanceof Error ? err.message : "Gemini request failed";
      return NextResponse.json(
        { error: msg },
        { status: 502 }
      );
    }
  }

  const orderPayload = extractOrderJson(content);

  if (orderPayload) {
    const supabase = getSupabase();
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        items: orderPayload.items,
        total: Math.round(orderPayload.total * 100) / 100,
        status: "pending",
      })
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save order", detail: error.message },
        { status: 500 }
      );
    }

    const receiptLines = orderPayload.items.map(
      (i) =>
        `• ${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""}${i.temperature ? ` ${i.temperature}` : ""}${i.milk ? `, ${i.milk} milk` : ""}${i.modifiers?.length ? `, ${i.modifiers.join(", ")}` : ""} — $${i.lineTotal.toFixed(2)}`
    );
    const receipt = `Order placed! Receipt #${order.id.slice(0, 8)}\n\n${receiptLines.join("\n")}\n\n**Total: $${orderPayload.total.toFixed(2)}**\n\nPay at the counter when you pick up.`;
    return NextResponse.json({
      message: receipt,
      orderId: order.id,
      orderCreatedAt: order.created_at,
    });
  }

  return NextResponse.json({ message: content });
}
