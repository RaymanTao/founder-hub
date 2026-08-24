"use server";

import { redirect } from "next/navigation";
import { clearReaderSession } from "@/lib/reader-auth";

export async function logoutReader() {
  await clearReaderSession();
  redirect("/login");
}
