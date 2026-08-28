import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

export type NewsletterSubscriber = {
  id: string;
  email: string;
  source: string;
  status: "pending" | "active" | "unsubscribed";
  subscribed_at: string;
};

export type ResourceLead = {
  id: string;
  email: string;
  resource_id: string;
  resource_title: string;
  source: string;
  created_at: string;
};

export type ReaderFavorite = {
  id: string;
  email: string;
  article_slug: string;
  article_title: string;
  created_at: string;
};

async function getNewsletterSubscribers() {
  const response = await supabaseFetch(
    "newsletter_subscribers?select=id,email,source,status,subscribed_at&order=subscribed_at.desc&limit=200"
  );

  if (!response.ok) {
    throw new Error(`NEWSLETTER_LEADS_FAILED_${response.status}`);
  }

  return (await response.json()) as NewsletterSubscriber[];
}

async function getResourceLeads() {
  const response = await supabaseFetch(
    "resource_leads?select=id,email,resource_id,resource_title,source,created_at&order=created_at.desc&limit=200"
  );

  if (!response.ok) {
    throw new Error(`RESOURCE_LEADS_FAILED_${response.status}`);
  }

  return (await response.json()) as ResourceLead[];
}

async function getReaderFavorites() {
  const response = await supabaseFetch(
    "reader_favorites?select=id,email,article_slug,article_title,created_at&order=created_at.desc&limit=200"
  );

  if (!response.ok) {
    throw new Error(`READER_FAVORITES_FAILED_${response.status}`);
  }

  return (await response.json()) as ReaderFavorite[];
}

export async function getAdminLeads() {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      subscribers: [] as NewsletterSubscriber[],
      resourceLeads: [] as ResourceLead[],
      readerFavorites: [] as ReaderFavorite[]
    };
  }

  const [subscribers, resourceLeads, readerFavorites] = await Promise.all([
    getNewsletterSubscribers(),
    getResourceLeads(),
    getReaderFavorites()
  ]);

  return {
    configured: true,
    subscribers,
    resourceLeads,
    readerFavorites
  };
}
