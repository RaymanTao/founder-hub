import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { zhCN } from "@/locale/zh-cn";

export default function NotFoundPage() {
  return (
    <Section>
      <div className="mx-auto max-w-[760px] rounded-[2rem] border border-[var(--border)] bg-white p-10 text-center shadow-[var(--shadow-soft)] sm:p-12">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          {zhCN.notFound.title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--secondary)]">
          {zhCN.notFound.description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">{zhCN.notFound.primary}</ButtonLink>
          <ButtonLink href="/products" variant="secondary">
            {zhCN.notFound.secondary}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
