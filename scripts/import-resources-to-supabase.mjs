import fs from "node:fs/promises";
import path from "node:path";

const resourcesPath = path.join(process.cwd(), "data", "resources.json");
const isDryRun = process.argv.includes("--dry-run");

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  };
}

function normalizeResource(resource) {
  return {
    id: String(resource.id ?? "").trim(),
    title: String(resource.title ?? "").trim(),
    description: String(resource.description ?? "").trim(),
    category: resource.category ?? "Toolkit",
    status: resource.status ?? "Free",
    format: String(resource.format ?? "").trim(),
    audience: String(resource.audience ?? "").trim(),
    href: String(resource.href ?? "").trim(),
    featured: resource.featured === true,
    archived: resource.archived === true,
    tags: Array.isArray(resource.tags) ? resource.tags.map(String) : []
  };
}

async function supabaseFetch(pathname, init = {}) {
  const config = getSupabaseConfig();

  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return fetch(`${config.url}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
}

async function readResources() {
  const raw = await fs.readFile(resourcesPath, "utf8");
  const resources = JSON.parse(raw).map(normalizeResource);

  for (const resource of resources) {
    if (!resource.id) {
      throw new Error(`Resource "${resource.title}" is missing id.`);
    }
  }

  return resources.sort((a, b) => a.id.localeCompare(b.id));
}

async function upsertResources(resources) {
  const response = await supabaseFetch("resources?on_conflict=id&select=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(resources)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resource import failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function main() {
  const resources = await readResources();

  if (isDryRun) {
    console.log(`Found ${resources.length} resources.`);
    for (const resource of resources) {
      console.log(
        `- ${resource.id}: ${resource.title} (${resource.status}${
          resource.archived ? ", archived" : ""
        })`
      );
    }
    return;
  }

  const rows = await upsertResources(resources);
  console.log(`Imported ${rows.length} resources into Supabase.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
