export type ProjectStatus = "Building" | "Live" | "Growing" | "Archived";

export type Project = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  status: ProjectStatus;
  startDate: string;
  launchDate?: string;
  buildDays: number;
  users: string;
  revenue: string;
  mrr: string;
  techStack: string[];
  featured: boolean;
  problem?: string;
  hypothesis?: string;
  solution?: string;
  buildProcess?: string[];
  results?: string[];
  lessons?: string[];
};
