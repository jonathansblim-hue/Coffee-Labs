import { NextResponse } from "next/server";
import OpenAI from "openai";
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

export async function POST(request: Request) {
  const { messages } = (await request.json()) as {
    messages: { role: "user" | "assistant" | "system"; content: string }[];
  };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });
  const fullMessages = [
    { role: "system" as const, content: CASHIER_SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: fullMessages,
    temperature: 0.6,
  });

  const content = completion.choices[0]?.message?.content?.trim() ?? "";
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
