import resourcesData from "@/data/resources.json";
import { listSupabaseResources } from "@/lib/resource-db";
import type { Resource } from "@/types/resource";

function normalizeResource(resource: Resource) {
  return {
    ...resource,
    archived: resource.archived === true
  };
}

export function getStaticResources(options: { includeArchived?: boolean } = {}) {
  return (resourcesData as Resource[])
    .map(normalizeResource)
    .filter((resource) => options.includeArchived || !resource.archived);
}

export async function getPublicResources() {
  const databaseResources = await listSupabaseResources();
  return databaseResources ?? getStaticResources();
}

export async function getAllResources(options: { includeArchived?: boolean } = {}) {
  const databaseResources = await listSupabaseResources(options);
  return databaseResources ?? getStaticResources(options);
}
