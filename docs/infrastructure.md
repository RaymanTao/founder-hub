# Infrastructure Setup

Founder Hub uses Supabase for structured data and Cloudflare R2 for media assets.

## Supabase

Set these environment variables in production:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Run `supabase/schema.sql` in the Supabase SQL editor before enabling live forms.

Current tables:

- `articles`
- `article_revisions`
- `article_sources`
- `newsletter_subscribers`
- `resource_leads`
- `reader_favorites`
- `media_assets`

All tables use RLS and are managed through the service role from server-side routes.

Article content defaults to local MDX files. To read articles from Supabase, set:

```bash
ARTICLE_CONTENT_SOURCE=supabase
```

The Supabase article reader is designed as an opt-in migration path. Keep the value as
`mdx` until article rows have been imported and verified in production.

Import local MDX articles into Supabase with:

```bash
npm run import:articles -- --dry-run
npm run import:articles
```

The import script upserts by `slug`, so it is safe to run again after editing local MDX
content. Source records are also deduplicated by `article_id` and `source_url`.

## Cloudflare R2

Set these environment variables in production:

```bash
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
```

`CLOUDFLARE_R2_PUBLIC_BASE_URL` should be the public bucket URL or a custom domain,
without a trailing slash.

The admin media library uploads images directly from the browser through a short-lived
presigned PUT URL. Configure CORS on the R2 bucket for local development and production:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Uploaded media files are stored in R2, while metadata is recorded in Supabase
`media_assets`.
