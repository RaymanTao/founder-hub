import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase";

export type Membership = {
  email: string;
  plan: string;
  status: "active" | "cancelled" | "expired";
  expiresAt: string | null;
};

type MembershipRow = {
  email: string;
  plan: string;
  status: Membership["status"];
  expires_at: string | null;
};

export async function getMembershipByEmail(email: string): Promise<Membership | null> {
  if (!isSupabaseConfigured()) return null;
  const response = await supabaseFetch(`memberships?email=eq.${encodeURIComponent(email.toLowerCase())}&status=eq.active&select=email,plan,status,expires_at&limit=1`);
  if (!response.ok) return null;
  const row = ((await response.json()) as MembershipRow[])[0];
  if (!row || (row.expires_at && new Date(row.expires_at).getTime() < Date.now())) return null;
  return { email: row.email, plan: row.plan, status: row.status, expiresAt: row.expires_at };
}

export async function hasActiveMembership(email: string) {
  return Boolean(await getMembershipByEmail(email));
}
