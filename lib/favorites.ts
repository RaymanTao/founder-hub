import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

export type Favorite = {
  id: string;
  email: string;
  article_slug: string;
  article_title: string;
  created_at: string;
};

export async function getFavorite(email: string, slug: string) {
  if (!isSupabaseConfigured()) return null;

  const response = await supabaseFetch(
    `reader_favorites?email=eq.${encodeURIComponent(email)}&article_slug=eq.${encodeURIComponent(slug)}&select=id`
  );

  if (!response.ok) {
    throw new Error(`FAVORITE_FIND_FAILED_${response.status}`);
  }

  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0] ?? null;
}

export async function listFavorites(email: string) {
  if (!isSupabaseConfigured()) return [];

  const response = await supabaseFetch(
    `reader_favorites?email=eq.${encodeURIComponent(email)}&select=id,email,article_slug,article_title,created_at&order=created_at.desc&limit=100`
  );

  if (!response.ok) {
    throw new Error(`FAVORITE_LIST_FAILED_${response.status}`);
  }

  return (await response.json()) as Favorite[];
}

export async function addFavorite(input: {
  email: string;
  slug: string;
  title: string;
}) {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      favorited: false
    };
  }

  const existing = await getFavorite(input.email, input.slug);
  if (existing) {
    return {
      configured: true,
      favorited: true
    };
  }

  const response = await supabaseFetch("reader_favorites", {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      email: input.email,
      article_slug: input.slug,
      article_title: input.title
    })
  });

  if (!response.ok) {
    throw new Error(`FAVORITE_INSERT_FAILED_${response.status}`);
  }

  return {
    configured: true,
    favorited: true
  };
}

export async function removeFavorite(email: string, slug: string) {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      favorited: false
    };
  }

  const response = await supabaseFetch(
    `reader_favorites?email=eq.${encodeURIComponent(email)}&article_slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`FAVORITE_DELETE_FAILED_${response.status}`);
  }

  return {
    configured: true,
    favorited: false
  };
}
