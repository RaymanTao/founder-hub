"use client";

import { useState } from "react";
import { ProductCard } from "@/components/cards/product-card";
import { zhCN } from "@/locale/zh-cn";
import type { Product, ProductCategory } from "@/types/product";

const categories: Array<"All" | ProductCategory> = [
  "All",
  "Apps",
  "Skills",
  "Agents",
  "Templates",
  "Resources"
];

export function ProductFilter({ items }: { items: Product[] }) {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const visible =
    active === "All" ? items : items.filter((item) => item.category === active);

  return (
    <div className="space-y-8">
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Category
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={`min-h-11 rounded-full px-4 text-sm transition ${
                active === category
                  ? "bg-[var(--foreground)] text-white hover:text-white"
                  : "border border-[var(--border)] bg-white text-[var(--secondary)]"
              }`}
            >
              {category === "All"
                ? zhCN.filters.all
                : zhCN.filters.categories[
                    category as keyof typeof zhCN.filters.categories
                  ]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
