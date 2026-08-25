import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { getAllArticles } from "@/lib/writing";
import type { ArticleMeta } from "@/types/article";

export const metadata = createMetadata({
  title: "首页",
  description: "Founder Hub 聚合创业、一人公司、融资和案例资讯，面向 AI 创业者提供可信内容和资源。"
});

const sourceLine = "聚合创业公司 · 一人公司 · 融资动态 · 案例拆解 · AI 产品资讯";
const coverThemes = [
  "bg-[#887fc7]",
  "bg-[#eff7f1]",
  "bg-[#30081d]",
  "bg-[#19362f]",
  "bg-[#eee2d3]",
  "bg-[#171311]"
];

function formatNumber(number: number) {
  return `№ ${String(number || 1).padStart(4, "0")}`;
}

function MembershipBadge() {
  return (
    <span className="inline-flex items-center rounded-[5px] border border-white/15 bg-[#211b1c] px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
      🔒 会员
    </span>
  );
}

function StatusPill({
  children,
  tone = "dark"
}: {
  children: string;
  tone?: "dark" | "green";
}) {
  return (
    <span
      className={
        tone === "green"
          ? "inline-flex items-center rounded-full border border-[#81b99c]/45 bg-[#dbf3e4] px-3 py-1 text-xs font-semibold text-[#18724a]"
          : "inline-flex items-center rounded-full border border-white/24 bg-white/12 px-3 py-1 text-xs font-semibold text-white"
      }
    >
      {children}
    </span>
  );
}

function ArticleFooter({ article }: { article: ArticleMeta }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#8b8178]">
      <div className="flex flex-wrap gap-2">
        {article.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-[6px] border border-[#ded2c3] bg-[#fbf8f2] px-2.5 py-1 leading-none"
          >
            {tag}
          </span>
        ))}
      </div>
      <span>
        {formatDate(article.date)} · {article.readingTime}
      </span>
    </div>
  );
}

function CoverArt({
  article,
  index
}: {
  article: ArticleMeta;
  index: number;
}) {
  if (article.cover) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${article.cover})` }}
      />
    );
  }

  if (index % 3 === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#8b82c9]">
        <div className="relative h-24 w-32">
          <div className="absolute left-0 top-2 h-20 w-16 rotate-[-1deg] border-[5px] border-[#211b28] bg-[#faf8f1]" />
          <div className="absolute right-0 top-2 h-20 w-16 rotate-[1deg] border-[5px] border-[#211b28] bg-[#faf8f1]" />
          <div className="absolute left-1/2 top-0 h-24 w-[5px] -translate-x-1/2 bg-[#211b28]" />
          <div className="absolute bottom-[-28px] left-7 h-14 w-20 border-b-[5px] border-l-[5px] border-r-[5px] border-[#211b28]" />
        </div>
      </div>
    );
  }

  if (index % 3 === 1) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#edf6ef]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(34,119,78,0.16)_1px,transparent_0)] bg-[length:14px_14px]" />
        <div className="absolute bottom-7 left-4 text-5xl font-black tracking-[0.08em] text-[#b9d8ca]">
          DEEP DIVE
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#12020b]">
      <div className="absolute -right-16 top-8 h-28 w-[130%] rotate-[-12deg] bg-[linear-gradient(90deg,transparent,rgba(239,61,43,0.3),rgba(84,174,255,0.58),rgba(255,255,255,0.82),rgba(236,46,78,0.56),transparent)] blur-[2px]" />
      <div className="absolute -right-20 top-16 h-20 w-[120%] rotate-[-8deg] bg-[linear-gradient(90deg,transparent,rgba(255,22,91,0.62),rgba(255,174,205,0.86),transparent)] blur-[7px]" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-black" />
    </div>
  );
}

function FeaturedCard({ article }: { article: ArticleMeta }) {
  return (
    <Link
      href={`/writing/${article.slug}`}
      className="relative block overflow-hidden rounded-[18px] bg-[#14251f] px-9 py-10 text-white shadow-[0_22px_42px_rgba(23,19,17,0.18)] transition hover:-translate-y-0.5 sm:px-10 sm:py-10"
    >
      <div className="absolute right-8 top-5 hidden text-[72px] font-black tracking-[0.08em] text-white/7 sm:block">
        DEEP DIVE
      </div>
      <div className="relative z-10 flex flex-wrap items-center gap-2 text-sm text-white/66">
        <StatusPill>{article.access === "Deep Dive" ? "深度" : "快讯"}</StatusPill>
        {article.verified ? <span className="font-semibold text-[#bce7cf]">✓ 已核对</span> : null}
        <StatusPill tone="green">{article.access === "Deep Dive" ? "会员" : "免费"}</StatusPill>
        <span>{formatNumber(article.number)} · {article.source}</span>
      </div>
      <h2 className="relative z-10 mt-5 max-w-3xl font-[var(--font-cjk)] text-3xl font-black leading-tight tracking-normal text-white sm:text-4xl lg:text-[40px]">
        {article.title}
      </h2>
      <p className="relative z-10 mt-4 max-w-2xl text-base font-semibold leading-7 text-white/74">
        {article.description}
      </p>
      <p className="relative z-10 mt-5 text-sm text-white/55">
        {formatDate(article.date)} · {article.readingTime}
      </p>
    </Link>
  );
}

function ArticleCard({
  article,
  index
}: {
  article: ArticleMeta;
  index: number;
}) {
  return (
    <Link
      href={`/writing/${article.slug}`}
      className="group overflow-hidden rounded-[14px] border border-[#e0d4c5] bg-[#fffdf8] shadow-[0_16px_34px_rgba(23,19,17,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(23,19,17,0.12)]"
    >
      <div className={`relative h-52 ${coverThemes[index % coverThemes.length]}`}>
        <CoverArt article={article} index={index} />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          {article.access === "Deep Dive" ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-[#18724a]">
              <span className="h-2 w-2 rounded-[2px] bg-[#18724a]" />
              深度
            </span>
          ) : null}
        </div>
        <div className="absolute right-3 top-3">
          <MembershipBadge />
        </div>
        <span className="absolute right-4 top-10 text-[11px] text-[#8b8178]">
          {formatNumber(article.number)}
        </span>
      </div>

      <div className="grid min-h-[216px] gap-4 p-5">
        <div>
          <h3 className="font-[var(--font-cjk)] text-[19px] font-black leading-7 tracking-normal text-[#1d1815]">
            {article.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-[15px] leading-7 text-[#635b52]">
            {article.description}
          </p>
        </div>
        <ArticleFooter article={article} />
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const articles = await getAllArticles();
  const featuredArticle = articles.find((item) => item.featured) ?? articles[0];
  const latestArticles = articles
    .filter((item) => item.slug !== featuredArticle?.slug)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#F3ECE2] px-3 pb-12 pt-11 text-[#171311] sm:px-4">
      <div className="mx-auto w-full max-w-[1156px]">
        <section>
          <h1 className="font-[var(--font-cjk)] text-[44px] font-black leading-none tracking-normal sm:text-[56px]">
            创业情报，<span className="text-[#ee4f34]">讲到你懂</span>。
          </h1>
          <p className="mt-5 text-[15px] leading-6 tracking-[0.1em] text-[#7b7167]">
            {sourceLine}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-[15px] font-semibold tracking-[0.18em] text-[#746a60]">
            今日精选
          </h2>
          {featuredArticle ? (
            <FeaturedCard article={featuredArticle} />
          ) : (
            <div className="rounded-[18px] bg-[#14251f] px-9 py-10 text-white">
              RSS 聚合开启后，这里会显示今日精选。
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-[15px] font-semibold tracking-[0.18em] text-[#746a60]">
              最新解读
            </h2>
            <Link
              href="/writing"
              className="text-sm font-semibold text-[#f05a3e] transition hover:text-[#c93924]"
            >
              全部 →
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {latestArticles.map((article, index) => (
              <ArticleCard key={article.slug} article={article} index={index} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
