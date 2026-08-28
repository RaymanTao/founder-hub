import { NextResponse } from "next/server";
import { getReaderEmail } from "@/lib/reader-auth";
import { getReaderProfile } from "@/lib/profiles";

export async function GET() {
  const email = await getReaderEmail();
  const profile = email ? await getReaderProfile(email) : null;

  return NextResponse.json({
    email,
    profile
  });
}
