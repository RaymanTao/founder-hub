import { ProjectFilter } from "@/components/filters/project-filter";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { projects } from "@/data/projects";
import { zhCN } from "@/locale/zh-cn";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: zhCN.projects.metadataTitle,
  description: zhCN.projects.metadataDescription,
  path: "/projects"
});

export default function ProjectsPage() {
  return (
    <Section>
      <div className="max-w-3xl">
        <SectionHeader
          eyebrow={zhCN.projects.eyebrow}
          title={zhCN.projects.title}
          description={zhCN.projects.description}
        />
      </div>
      <ProjectFilter items={projects} />
    </Section>
  );
}
