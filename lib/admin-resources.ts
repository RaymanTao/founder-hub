import fs from "node:fs/promises";
import path from "node:path";
import { Resource } from "@/types/resource";

const resourcesPath = path.join(process.cwd(), "data", "resources.json");

export type ResourceInput = Omit<Resource, "id">;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export async function getAdminResources() {
  const raw = await fs.readFile(resourcesPath, "utf8");
  return (JSON.parse(raw) as Resource[]).map((resource) => ({
    ...resource,
    archived: resource.archived === true
  }));
}

async function writeResources(resources: Resource[]) {
  await fs.writeFile(resourcesPath, `${JSON.stringify(resources, null, 2)}\n`, "utf8");
}

function ensureUniqueId(resources: Resource[], title: string) {
  const base = slugify(title) || `resource-${Date.now()}`;
  const ids = new Set(resources.map((resource) => resource.id));
  let id = base;
  let index = 2;

  while (ids.has(id)) {
    id = `${base}-${index}`;
    index += 1;
  }

  return id;
}

export async function getAdminResourceById(id: string) {
  const resources = await getAdminResources();
  return resources.find((resource) => resource.id === id) ?? null;
}

export async function createResource(input: ResourceInput) {
  const resources = await getAdminResources();
  const id = ensureUniqueId(resources, input.title);
  await writeResources([{ id, ...input }, ...resources]);
  return id;
}

export async function updateResource(id: string, input: ResourceInput) {
  const resources = await getAdminResources();
  const exists = resources.some((resource) => resource.id === id);
  if (!exists) return false;

  await writeResources(
    resources.map((resource) => (resource.id === id ? { id, ...input } : resource))
  );
  return true;
}

export async function setResourceArchived(id: string, archived: boolean) {
  const resources = await getAdminResources();
  const exists = resources.some((resource) => resource.id === id);
  if (!exists) return false;

  await writeResources(
    resources.map((resource) =>
      resource.id === id ? { ...resource, archived } : resource
    )
  );
  return true;
}
