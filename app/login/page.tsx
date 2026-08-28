import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "登录 | Founder Hub"
};

export default function LoginPage() {
  redirect("/");
}
