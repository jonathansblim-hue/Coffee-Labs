/**
 * NYC Coffee menu — matches Coffee Menu.png
 * Prices in dollars. Sizes: small (12oz), large (16oz).
 */

export type Size = "small" | "large";
export type Temp = "hot" | "iced";
export type Milk =
  | "whole"
  | "skim"
  | "oat"
  | "almond";
export type Sweetness = "no_sugar" | "less_sugar" | "extra_sugar";
export type IceLevel = "no_ice" | "less_ice" | "extra_ice";

export const DRINK_TEMP_OPTIONS: Record<string, Temp[]> = {
  Americano: ["hot", "iced"],
  Latte: ["hot", "iced"],
  "Cold Brew": ["iced"],
  Mocha: ["hot", "iced"],
  "Coffee Frappuccino": ["iced"],
  "Black Tea": ["hot", "iced"],
  "Jasmine Tea": ["hot", "iced"],
  "Lemon Green Tea": ["hot", "iced"],
  "Matcha Latte": ["hot", "iced"],
};

export const MENU = {
  coffee: [
    { name: "Americano", small: 3, large: 4, temps: ["hot", "iced"] },
    { name: "Latte", small: 4, large: 5, temps: ["hot", "iced"] },
    { name: "Cold Brew", small: 4, large: 5, temps: ["iced"] },
    { name: "Mocha", small: 4.5, large: 5.5, temps: ["hot", "iced"] },
    { name: "Coffee Frappuccino", small: 5.5, large: 6, temps: ["iced"] },
  ],
  tea: [
    { name: "Black Tea", small: 3, large: 3.75, temps: ["hot", "iced"] },
    { name: "Jasmine Tea", small: 3, large: 3.75, temps: ["hot", "iced"] },
    { name: "Lemon Green Tea", small: 3.5, large: 4.25, temps: ["hot", "iced"] },
    { name: "Matcha Latte", small: 4.5, large: 5.25, temps: ["hot", "iced"] },
  ],
  addOns: [
    { name: "Whole Milk", price: 0 },
    { name: "Skim Milk", price: 0 },
    { name: "Oat Milk", price: 0.5 },
    { name: "Almond Milk", price: 0.75 },
    { name: "Extra Espresso Shot", price: 1.5 },
    { name: "Extra Matcha Shot", price: 1.5 },
    { name: "1 Pump Caramel Syrup", price: 0.5 },
    { name: "1 Pump Hazelnut Syrup", price: 0.5 },
  ],
  pastries: [
    { name: "Plain Croissant", price: 3.5 },
    { name: "Chocolate Croissant", price: 4 },
    { name: "Chocolate Chip Cookie", price: 2.5 },
    { name: "Banana Bread (Slice)", price: 3 },
  ],
} as const;

export const SWEETNESS_OPTIONS = ["No Sugar", "Less Sugar", "Extra Sugar"];
export const ICE_OPTIONS = ["No Ice", "Less Ice", "Extra Ice"];
export const MAX_ESPRESSO_SHOTS = 4;

export function getBasePrice(
  category: "coffee" | "tea",
  drinkName: string,
  size: Size
): number {
  const list = MENU[category];
  const item = list.find((i) => i.name === drinkName);
  if (!item) return 0;
  return size === "small" ? item.small : item.large;
}

export function getAddOnPrice(name: string): number {
  const addOn = MENU.addOns.find(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  );
  return addOn?.price ?? 0;
}

export function getPastryPrice(name: string): number {
  const p = MENU.pastries.find(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  );
  return p?.price ?? 0;
}
