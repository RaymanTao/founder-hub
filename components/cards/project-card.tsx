import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import type { Project } from "@/types/project";

const statusMap = {
  Building: "Building",
  Live: "Live",
  Growing: "Growing",
  Archived: "Archived"
} as const;

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{project.name}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
            {project.summary}
          </p>
        </div>
        <Tag value={statusMap[project.status]} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-[var(--secondary)]">
        <div>
          <div className="text-[var(--muted)]">构建天数</div>
          <div className="mt-1 font-medium text-[var(--foreground)]">
            {project.buildDays}
          </div>
        </div>
        <div>
          <div className="text-[var(--muted)]">月经常性收入</div>
          <div className="mt-1 font-medium text-[var(--foreground)]">
            {project.mrr}
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {project.techStack.slice(0, 4).map((item) => (
          <Tag key={item} value={item} />
        ))}
      </div>
      <div className="mt-6 pt-2">
        <Link
          href={`/projects/${project.slug}`}
          className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
        >
          查看项目拆解
        </Link>
      </div>
    </Card>
  );
}
