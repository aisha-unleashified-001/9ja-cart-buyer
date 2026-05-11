import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Smartphone,
  ShoppingCart,
  Heart,
  Shirt,
  Wrench,
  Phone,
  Receipt,
  Home,
  Package,
  Gamepad2,
  Utensils,
  Sparkles,
  Monitor,
  Zap,
} from "lucide-react";

/** Maps category id / name to the same icons used in Shop by Category (CategoryShowcase). */
export function getCategoryIcon(
  categoryName: string,
  categoryId?: string
): LucideIcon {
  const name = categoryName.toLowerCase();

  const idIconMap: Record<string, LucideIcon> = {
    services: Wrench,
    "mobile-topup": Phone,
    bills: Receipt,
  };

  if (categoryId && idIconMap[categoryId]) {
    return idIconMap[categoryId];
  }

  const nameIconMap: Record<string, LucideIcon> = {
    toys: Gamepad2,
    games: Gamepad2,
    gaming: Gamepad2,
    home: Home,
    kitchen: Utensils,
    health: Heart,
    beauty: Sparkles,
    electronics: Monitor,
    gadgets: Smartphone,
    devices: Smartphone,
    men: Shirt,
    wear: Shirt,
    fashion: Shirt,
    clothing: Shirt,
    appliances: Zap,
    baby: Baby,
    groceries: ShoppingCart,
    food: ShoppingCart,
  };

  for (const [keyword, IconComponent] of Object.entries(nameIconMap)) {
    if (name.includes(keyword)) {
      return IconComponent;
    }
  }

  return Package;
}
