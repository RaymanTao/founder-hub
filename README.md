# Founder Hub

基于 `Next.js App Router + TypeScript + Tailwind CSS` 的 Founder Hub 网站实现。

## 开发

```bash
pnpm install
pnpm dev
```

## 环境变量

复制 `.env.example` 并按需填写：

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEWSLETTER_FROM_EMAIL`
- `OWNER_EMAIL`
- `POSTHOG_KEY`
- `POSTHOG_HOST`

## 当前范围

- 首页、产品、项目、文章、服务、关于、联系、隐私、条款、404
- 数据驱动卡片与筛选
- Markdown/MDX 风格文章内容读取
- Newsletter / Contact API 占位接入
- 基础 SEO、Sitemap、Robots
