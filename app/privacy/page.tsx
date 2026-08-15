import { Section } from "@/components/ui/section";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Privacy",
  description: "Founder Hub 隐私政策。",
  path: "/privacy"
});

export default function PrivacyPage() {
  return (
    <Section>
      <article className="prose-content mx-auto max-w-[760px] rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
        <h1>隐私政策</h1>
        <p>
          本站会处理 Newsletter、Contact Form、基础 Analytics 和必要的 Cookies
          信息，用于内容订阅、业务咨询和产品改进。
        </p>
        <h2>我们收集什么</h2>
        <ul>
          <li>邮箱、姓名、公司及咨询内容</li>
          <li>站点访问、点击与表单提交等匿名事件</li>
        </ul>
        <h2>用途</h2>
        <p>
          这些数据仅用于发送订阅更新、跟进咨询、分析内容与产品表现，不会出售给第三方。
        </p>
      </article>
    </Section>
  );
}
