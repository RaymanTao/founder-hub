import Link from "next/link";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { navigation, socialLinks } from "@/data/site";
import { zhCN } from "@/locale/zh-cn";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-[#faf6ef]">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.9fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-[2rem] leading-none text-[var(--foreground)]">
            Founder Hub
          </p>
          <p className="mt-4 max-w-md text-sm leading-7 text-[var(--secondary)]">
            {zhCN.footer.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {zhCN.footer.navTitle}
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--secondary)]">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {zhCN.footer.legalTitle}
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--secondary)]">
              <Link href="/privacy" className="transition hover:text-[var(--foreground)]">
                {zhCN.footer.privacy}
              </Link>
              <Link href="/terms" className="transition hover:text-[var(--foreground)]">
                {zhCN.footer.terms}
              </Link>
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="transition hover:text-[var(--foreground)]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {zhCN.footer.newsletter}
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--secondary)]">
            {zhCN.footer.newsletterDescription}
          </p>
          <div className="mt-4">
            <NewsletterForm source="footer" compact />
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-4 py-5 text-center text-sm text-[var(--muted)] sm:px-6 lg:px-8">
        {zhCN.footer.copyright}
      </div>
    </footer>
  );
}
