import { notFound } from "next/navigation";
import { Metric } from "@/components/ui/metric";
import { Section } from "@/components/ui/section";
import { projects } from "@/data/projects";
import { zhCN } from "@/locale/zh-cn";
import { createMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return createMetadata({
      title: zhCN.projectDetail.notFoundTitle,
      description: zhCN.projectDetail.notFoundDescription
    });
  }

  return createMetadata({
    title: project.name,
    description: project.summary,
    path: `/projects/${project.slug}`
  });
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <Section>
      <div className="mx-auto max-w-[980px]">
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
            {zhCN.projectDetail.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {project.name}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--secondary)]">
            {project.summary}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label={zhCN.projectDetail.status} value={project.status} />
          <Metric
            label={zhCN.projectDetail.buildDays}
            value={`${project.buildDays}`}
          />
          <Metric label={zhCN.projectDetail.users} value={project.users} />
          <Metric label={zhCN.projectDetail.mrr} value={project.mrr} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {project.problem ? (
            <DetailBlock title={zhCN.projectDetail.problem} content={project.problem} />
          ) : null}
          {project.hypothesis ? (
            <DetailBlock
              title={zhCN.projectDetail.hypothesis}
              content={project.hypothesis}
            />
          ) : null}
          {project.solution ? (
            <DetailBlock title={zhCN.projectDetail.solution} content={project.solution} />
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {project.buildProcess?.length ? (
            <ListBlock
              title={zhCN.projectDetail.buildProcess}
              items={project.buildProcess}
            />
          ) : null}
          {project.results?.length ? (
            <ListBlock title={zhCN.projectDetail.results} items={project.results} />
          ) : null}
          {project.lessons?.length ? (
            <ListBlock title={zhCN.projectDetail.lessons} items={project.lessons} />
          ) : null}
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
            {zhCN.projectDetail.techStack}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {project.techStack.map((item) => (
              <span
                key={item}
                className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-sm text-[var(--secondary)]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function DetailBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[var(--secondary)]">{content}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-alt)] p-6">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--secondary)]">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
