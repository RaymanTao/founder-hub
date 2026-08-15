import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "请输入姓名"),
  email: z.email("请输入有效邮箱"),
  company: z.string().optional(),
  serviceType: z.string().min(1, "请选择服务类型"),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  message: z.string().min(10, "请提供更完整的项目说明"),
  website: z.string().max(0, "Spam detected").optional()
});

export async function POST(request: Request) {
  const payload = await request.json();
  const result = contactSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? "提交失败" },
      { status: 400 }
    );
  }

  if (result.data.website) {
    return NextResponse.json({ message: "提交成功。" });
  }

  return NextResponse.json({
    message:
      "咨询已收到。当前为本地演示模式；接入 Supabase / Resend 后可启用真实线索存储与邮件通知。"
  });
}
