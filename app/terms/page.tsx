import { Section } from "@/components/ui/section";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms",
  description: "Founder Hub 使用条款。",
  path: "/terms"
});

export default function TermsPage() {
  return (
    <Section>
      <article className="prose-content mx-auto max-w-[760px] rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
        <h1>服务条款</h1>
        <p>
          访问和使用本站即表示你同意以合法方式使用本站内容、资源和表单功能。
        </p>
        <h2>内容使用</h2>
        <p>
          文章、资源与产品介绍默认受版权保护；转载或二次发布前，请先获得授权。
        </p>
        <h2>服务说明</h2>
        <p>
          咨询提交不代表自动建立合作关系，具体范围、时间和费用以双方确认的方案为准。
        </p>
      </article>
    </Section>
  );
}
