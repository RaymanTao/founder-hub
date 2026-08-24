type SubscribeInput = {
  email: string;
  source: string;
};

type SubscribeResult = {
  configured: boolean;
  alreadySubscribed: boolean;
};

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  };
}

function getResendConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.NEWSLETTER_FROM_EMAIL ?? "",
    ownerEmail: process.env.OWNER_EMAIL ?? ""
  };
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.serviceRoleKey);
}

function isResendConfigured() {
  const config = getResendConfig();
  return Boolean(config.apiKey && config.from);
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const config = getSupabaseConfig();

  return fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
}

async function findSubscriber(email: string) {
  const response = await supabaseFetch(
    `newsletter_subscribers?email=eq.${encodeURIComponent(email)}&select=id,email,status`
  );

  if (!response.ok) {
    throw new Error(`SUPABASE_FIND_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as Array<{
    id: string;
    email: string;
    status: string;
  }>;

  return rows[0] ?? null;
}

async function createSubscriber(input: SubscribeInput) {
  const response = await supabaseFetch("newsletter_subscribers", {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      email: input.email,
      source: input.source,
      status: "active",
      subscribed_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`SUPABASE_INSERT_FAILED_${response.status}`);
  }
}

async function reactivateSubscriber(input: SubscribeInput) {
  const response = await supabaseFetch(
    `newsletter_subscribers?email=eq.${encodeURIComponent(input.email)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        source: input.source,
        status: "active",
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null
      })
    }
  );

  if (!response.ok) {
    throw new Error(`SUPABASE_UPDATE_FAILED_${response.status}`);
  }
}

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const config = getResendConfig();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.from,
      to: input.to,
      subject: input.subject,
      html: input.html
    })
  });

  if (!response.ok) {
    throw new Error(`RESEND_FAILED_${response.status}`);
  }
}

async function sendWelcomeEmail(email: string) {
  if (!isResendConfigured()) return;

  await sendEmail({
    to: email,
    subject: "欢迎订阅 Founder Hub",
    html: [
      "<p>你好，欢迎订阅 Founder Hub。</p>",
      "<p>之后我会把 AI 产品、Agent 自动化、增长系统和一人公司相关的新文章与资源整理后发给你。</p>",
      "<p>如果你不想继续收到邮件，直接回复这封邮件即可。</p>"
    ].join("")
  });
}

async function notifyOwner(input: SubscribeInput) {
  const config = getResendConfig();
  if (!isResendConfigured() || !config.ownerEmail) return;

  await sendEmail({
    to: config.ownerEmail,
    subject: "Founder Hub 新订阅",
    html: `<p>新订阅：${input.email}</p><p>来源：${input.source}</p>`
  });
}

export async function subscribeToNewsletter(
  input: SubscribeInput
): Promise<SubscribeResult> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      alreadySubscribed: false
    };
  }

  const existing = await findSubscriber(input.email);

  if (existing?.status === "active") {
    return {
      configured: true,
      alreadySubscribed: true
    };
  }

  if (existing) {
    await reactivateSubscriber(input);
  } else {
    await createSubscriber(input);
  }

  await Promise.allSettled([sendWelcomeEmail(input.email), notifyOwner(input)]);

  return {
    configured: true,
    alreadySubscribed: false
  };
}
