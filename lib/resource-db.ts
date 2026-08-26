import type { Resource } from "@/types/resource";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

type ResourceRow = {
  id: string;
  title: string;
  description: string;
  category: Resource["category"];
  status: Resource["status"];
  access: Resource["access"];
  format: string;
  audience: string;
  href: string;
  featured: boolean;
  archived: boolean;
  tags: string[] | null;
};

export type ResourceWriteInput = Omit<Resource, "id">;

const resourceFields = [
  "id",
  "title",
  "description",
  "category",
  "status",
  "access",
  "format",
  "audience",
  "href",
  "featured",
  "archived",
  "tags"
].join(",");

export function shouldReadResourcesFromSupabase() {
  return isSupabaseConfigured() && process.env.RESOURCE_CONTENT_SOURCE === "supabase";
}

export function shouldWriteResourcesToSupabase() {
  return shouldReadResourcesFromSupabase();
}

function mapResourceRow(row: ResourceRow): Resource {
  return {
    ...row,
    archived: row.archived === true,
    tags: row.tags ?? []
  };
}

export async function listSupabaseResources(options: { includeArchived?: boolean } = {}) {
  if (!shouldReadResourcesFromSupabase()) return null;

  const archivedFilter = options.includeArchived ? "" : "&archived=eq.false";
  const response = await supabaseFetch(
    `resources?select=${resourceFields}${archivedFilter}&order=featured.desc,title.asc`
  );

  if (!response.ok) {
    throw new Error(`RESOURCES_LIST_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as ResourceRow[];
  return rows.map(mapResourceRow);
}

export async function getSupabaseResourceById(id: string) {
  if (!shouldReadResourcesFromSupabase()) return null;

  const response = await supabaseFetch(
    `resources?id=eq.${encodeURIComponent(id)}&select=${resourceFields}&limit=1`
  );

  if (!response.ok) {
    throw new Error(`RESOURCE_FIND_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as ResourceRow[];
  return rows[0] ? mapResourceRow(rows[0]) : null;
}

export async function findSupabaseResourceId(id: string) {
  if (!shouldWriteResourcesToSupabase()) return null;

  const response = await supabaseFetch(
    `resources?id=eq.${encodeURIComponent(id)}&select=id&limit=1`
  );

  if (!response.ok) {
    throw new Error(`RESOURCE_ID_FIND_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

export async function upsertSupabaseResource(id: string, input: ResourceWriteInput) {
  if (!shouldWriteResourcesToSupabase()) return null;

  const response = await supabaseFetch("resources?on_conflict=id&select=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      id,
      title: input.title,
      description: input.description,
      category: input.category,
      status: input.status,
      access: input.access,
      format: input.format,
      audience: input.audience,
      href: input.href,
      featured: input.featured,
      archived: input.archived,
      tags: input.tags
    })
  });

  if (!response.ok) {
    throw new Error(`RESOURCE_UPSERT_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0] ?? null;
}

export async function patchSupabaseResourceArchived(id: string, archived: boolean) {
  if (!shouldWriteResourcesToSupabase()) return null;

  const response = await supabaseFetch(`resources?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({ archived })
  });

  if (!response.ok) {
    throw new Error(`RESOURCE_ARCHIVE_FAILED_${response.status}`);
  }

  return true;
}
