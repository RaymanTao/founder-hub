import { NextResponse } from "next/server";
import { getReaderEmail } from "@/lib/reader-auth";

export async function GET() {
  const email = await getReaderEmail();

  return NextResponse.json({
    email
  });
}
