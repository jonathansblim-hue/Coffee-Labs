import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { OrderStatus } from "@/lib/types";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await _request.json();
  const { status } = body as { status: OrderStatus };
  if (!["pending", "in_progress", "completed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const updates: { status: OrderStatus; completed_at?: string } = { status };
  if (status === "completed") updates.completed_at = new Date().toISOString();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
