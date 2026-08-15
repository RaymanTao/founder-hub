import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import type { Service } from "@/types/service";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="flex h-full flex-col">
      <h3 className="text-xl font-semibold tracking-tight">{service.name}</h3>
      <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
        {service.summary}
      </p>
      <p className="mt-3 flex-1 text-sm leading-7 text-[var(--secondary)]">
        {service.description}
      </p>
      <ul className="mt-6 space-y-2 text-sm text-[var(--secondary)]">
        {service.deliverables.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-5">
        <div className="text-sm font-semibold text-[var(--foreground)]">
          {service.startingPrice}
        </div>
        <ButtonLink href="/contact" variant="secondary">
          发起咨询
        </ButtonLink>
      </div>
    </Card>
  );
}
