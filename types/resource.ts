export type Resource = {
  id: string;
  title: string;
  description: string;
  category: "Toolkit" | "Template" | "Workflow" | "Checklist";
  status: "Free" | "Coming Soon";
  format: string;
  audience: string;
  href: string;
  featured: boolean;
  archived: boolean;
  tags: string[];
};
