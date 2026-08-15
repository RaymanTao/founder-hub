"use client";

import { useState } from "react";
import { ProjectCard } from "@/components/cards/project-card";
import { zhCN } from "@/locale/zh-cn";
import type { Project, ProjectStatus } from "@/types/project";

const statuses: Array<"All" | ProjectStatus> = [
  "All",
  "Building",
  "Live",
  "Growing",
  "Archived"
];

export function ProjectFilter({ items }: { items: Project[] }) {
  const [active, setActive] = useState<(typeof statuses)[number]>("All");
  const visible =
    active === "All" ? items : items.filter((item) => item.status === active);

  return (
    <div className="space-y-8">
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Status
        </div>
        <div className="flex flex-wrap gap-3">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActive(status)}
              className={`min-h-11 rounded-full px-4 text-sm transition ${
                active === status
                  ? "bg-[var(--foreground)] text-white hover:text-white"
                  : "border border-[var(--border)] bg-white text-[var(--secondary)]"
              }`}
            >
              {status === "All"
                ? zhCN.filters.all
                : zhCN.filters.projectStatus[
                    status as keyof typeof zhCN.filters.projectStatus
                  ]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
