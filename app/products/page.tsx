import { ProductFilter } from "@/components/filters/product-filter";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { products } from "@/data/products";
import { zhCN } from "@/locale/zh-cn";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: zhCN.products.metadataTitle,
  description: zhCN.products.metadataDescription,
  path: "/products"
});

export default function ProductsPage() {
  return (
    <Section>
      <div className="max-w-3xl">
        <SectionHeader
          eyebrow={zhCN.products.eyebrow}
          title={zhCN.products.title}
          description={zhCN.products.description}
        />
      </div>
      <ProductFilter items={products} />
    </Section>
  );
}
