import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { zhCN } from "@/locale/zh-cn";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">{product.category}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">
            {product.name}
          </h3>
        </div>
        <Tag value={product.status} />
      </div>
      <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
        {product.tagline}
      </p>
      <p className="mt-3 flex-1 text-sm leading-7 text-[var(--secondary)]">
        {product.description}
      </p>
      <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-5">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {product.price}
          </p>
          <p className="text-xs text-[var(--muted)]">{product.pricingType}</p>
        </div>
        <Link
          href={product.url}
          className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
        >
          查看详情
        </Link>
      </div>
    </Card>
  );
}
