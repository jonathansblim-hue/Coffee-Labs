import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { LineItem, OrderStatus } from "@/lib/types";

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { items, total } = body as { items: LineItem[]; total: number };
  if (!Array.isArray(items) || typeof total !== "number") {
    return NextResponse.json(
      { error: "items (array) and total (number) required" },
      { status: 400 }
    );
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .insert({ items, total, status: "pending" })
    .select("id, items, status, total, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
