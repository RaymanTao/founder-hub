import Link from "next/link";
import { ArticleCard } from "@/components/cards/article-card";
import { HomeHero } from "@/components/sections/home-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { products } from "@/data/products";
import { getPublicResources } from "@/lib/resources";
import { createMetadata } from "@/lib/seo";
import { getAllArticles } from "@/lib/writing";

export const metadata = createMetadata({
  title: "首页",
  description: "Founder Hub 是面向 AI 创业者的一人公司内容库、资源中心和产品实验室。"
});

export default async function HomePage() {
  const [articles, resources] = await Promise.all([
    getAllArticles(),
    getPublicResources()
  ]);
  const featuredArticle = articles.find((item) => item.featured) ?? articles[0];
  const latestArticles = articles
    .filter((item) => item.slug !== featuredArticle?.slug)
    .slice(0, 3);
  const featuredResources = resources.filter((item) => item.featured).slice(0, 2);
  const featuredProducts = products.filter((item) => item.featured).slice(0, 3);

  return (
    <>
      <HomeHero />

      {featuredArticle ? (
        <Section className="py-10 sm:py-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Featured
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                本周重点文章
              </h2>
            </div>
            <ButtonLink href="/writing" variant="ghost">
              进入内容库
            </ButtonLink>
          </div>

          <Link
            href={`/writing/${featuredArticle.slug}`}
            className="mt-7 block rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[rgba(138,106,82,0.32)] sm:p-8"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              <span>№ {String(featuredArticle.number).padStart(3, "0")}</span>
              <span>/</span>
              <span>{featuredArticle.category}</span>
              <span>/</span>
              <span>{featuredArticle.access === "Free" ? "免费" : "深度"}</span>
              {featuredArticle.verified ? <span>已核对</span> : null}
            </div>
            <h3 className="mt-5 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl">
              {featuredArticle.title}
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--secondary)]">
              {featuredArticle.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {featuredArticle.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.56)] px-3 py-1 text-xs text-[var(--secondary)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </Link>
        </Section>
      ) : null}

      <Section className="py-10 sm:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Latest
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              最新文章
            </h2>
          </div>
          <ButtonLink href="/writing" variant="ghost">
            查看全部
          </ButtonLink>
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {latestArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </Section>

      <Section className="py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Resources
            </p>
            <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              把文章里的方法沉淀成可复用资源
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--secondary)]">
              工具清单、Brief 模板和工作流会逐步从文章中抽离出来，方便你在自己的项目里直接复用。
            </p>
            <div className="mt-6">
              <ButtonLink href="/resources" variant="secondary">
                浏览资源
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-4">
            {featuredResources.map((resource) => (
              <Link
                key={resource.id}
                href={resource.href}
                className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5 transition hover:border-[rgba(138,106,82,0.32)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {resource.category} / {resource.status}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {resource.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--secondary)]">
                  {resource.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section className="pt-10 sm:pt-12">
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,252,247,0.76)] p-7 shadow-[var(--shadow-soft)] backdrop-blur-[8px] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Products & Services
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl">
            从内容库出发，继续沉淀产品、工具和轻量服务。
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={product.url}
                className="rounded-[1rem] border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.5)] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {product.category}
                </p>
                <h3 className="mt-2 font-semibold text-[var(--foreground)]">{product.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
                  {product.tagline}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/contact">发起合作咨询</ButtonLink>
            <ButtonLink href="/services" variant="secondary">
              查看服务
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
