import { resources } from "@/data/resources";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

type ClaimResourceInput = {
  email: string;
  resourceId: string;
  source: string;
};

async function findLead(email: string, resourceId: string) {
  const response = await supabaseFetch(
    `resource_leads?email=eq.${encodeURIComponent(email)}&resource_id=eq.${encodeURIComponent(resourceId)}&select=id`
  );

  if (!response.ok) {
    throw new Error(`RESOURCE_LEAD_FIND_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0] ?? null;
}

async function createLead(input: {
  email: string;
  resourceId: string;
  resourceTitle: string;
  source: string;
}) {
  const response = await supabaseFetch("resource_leads", {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      email: input.email,
      resource_id: input.resourceId,
      resource_title: input.resourceTitle,
      source: input.source
    })
  });

  if (!response.ok) {
    throw new Error(`RESOURCE_LEAD_INSERT_FAILED_${response.status}`);
  }
}

export async function claimResource(input: ClaimResourceInput) {
  const resource = resources.find((item) => item.id === input.resourceId);

  if (!resource) {
    return {
      ok: false,
      status: 404,
      message: "资源不存在。"
    };
  }

  await subscribeToNewsletter({
    email: input.email,
    source: `resource:${resource.id}`
  });

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      status: 200,
      href: resource.href,
      message: "领取成功。当前为本地演示模式；配置 Supabase 后会记录领取信息。"
    };
  }

  const existing = await findLead(input.email, resource.id);

  if (!existing) {
    await createLead({
      email: input.email,
      resourceId: resource.id,
      resourceTitle: resource.title,
      source: input.source
    });
  }

  return {
    ok: true,
    status: 200,
    href: resource.href,
    message: existing ? "你已经领取过这个资源。" : "领取成功，资源链接已解锁。"
  };
}
