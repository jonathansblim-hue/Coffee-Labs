export type OrderStatus = "pending" | "in_progress" | "completed";

export interface LineItem {
  name: string;
  category: "drink" | "pastry";
  size?: "small" | "large";
  temperature?: "hot" | "iced";
  milk?: string;
  modifiers?: string[];
  sweetness?: string;
  ice?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  items: LineItem[];
  status: OrderStatus;
  total: number;
  created_at: string;
  completed_at?: string | null;
}

export interface DbOrder {
  id: string;
  items: unknown;
  status: OrderStatus;
  total: number;
  created_at: string;
  completed_at: string | null;
}
