import { ContactForm } from "@/components/forms/contact-form";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { createMetadata } from "@/lib/seo";
import { zhCN } from "@/locale/zh-cn";

export const metadata = createMetadata({
  title: zhCN.contact.metadataTitle,
  description: zhCN.contact.metadataDescription,
  path: "/contact"
});

export default function ContactPage() {
  return (
    <Section>
      <div className="mx-auto grid max-w-[980px] gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeader
            eyebrow={zhCN.contact.heroEyebrow}
            title={zhCN.contact.heroTitle}
            description={zhCN.contact.heroDescription}
          />
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-alt)] p-6">
            <p className="text-sm leading-7 text-[var(--secondary)]">
              {zhCN.contact.note}
            </p>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-[6px] sm:p-8">
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}
