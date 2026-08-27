# Infrastructure Setup

Founder Hub uses Supabase for structured data and Cloudflare R2 for media assets.

## Supabase

Set these environment variables in production:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

Run `supabase/schema.sql` in the Supabase SQL editor before enabling live forms.

Current tables:

- `articles`
- `article_revisions`
- `article_sources`
- `rss_items`
- `resources`
- `newsletter_subscribers`
- `resource_leads`
- `reader_favorites`
- `media_assets`

All tables use RLS and are managed through the service role from server-side routes.

`NEXT_PUBLIC_SUPABASE_URL` must be the HTTP Project URL from Supabase Project Settings
→ API, such as `https://your-project-ref.supabase.co`. Do not put a PostgreSQL
connection string beginning with `postgresql://` in this variable; that string belongs
only in database tools and cannot be used by the REST API.

### Supabase Auth

Email/password registration and login use Supabase Auth. Add the project's anon key as
`NEXT_PUBLIC_SUPABASE_ANON_KEY`; it is safe to expose as a public project identifier,
but `SUPABASE_SERVICE_ROLE_KEY` must remain server-only. Enable Email provider in
Supabase Authentication settings. For Google login, enable the Google provider, add
the Google Client ID and Secret, and add this callback URL to Supabase's allowed
redirect URLs:

```text
https://your-domain.com/auth/callback
```

Also set `NEXT_PUBLIC_SITE_URL` to the same production origin. Local development uses
`http://localhost:3000/auth/callback`.

Article content defaults to local MDX files. To read articles from Supabase, set:

```bash
ARTICLE_CONTENT_SOURCE=supabase
```

The Supabase article reader is designed as an opt-in migration path. Keep the value as
`mdx` until article rows have been imported and verified in production.

When `ARTICLE_CONTENT_SOURCE=supabase`, admin article create, import, edit, archive,
template completion, and AI draft actions write to Supabase instead of local MDX files.
Each save also creates an `article_revisions` row.

Article revision history is available at `/admin/articles/[slug]/revisions` after
Supabase article mode is enabled and at least one save has created a revision.
Revision detail pages can restore a previous version; restoring writes the selected
version back to the article and creates a new revision record.

Import local MDX articles into Supabase with:

```bash
npm run import:articles -- --dry-run
npm run import:articles
```

The import script upserts by `slug`, so it is safe to run again after editing local MDX
content. Source records are also deduplicated by `article_id` and `source_url`.

Resource content defaults to local `data/resources.json`. To read and write resources
from Supabase, set:

```bash
RESOURCE_CONTENT_SOURCE=supabase
```

Import local resources into Supabase with:

```bash
npm run import:resources -- --dry-run
npm run import:resources
```

The resource import script upserts by `id`, so it is safe to rerun.

## RSS Aggregation

RSS feed sources are configured in `data/rss-feeds.json`. Feed entries are disabled by
default. Add a feed URL and set `enabled` to `true`, then preview with:

```bash
npm run import:rss -- --dry-run
```

Import enabled feed items into the Supabase RSS candidate pool with:

```bash
npm run import:rss
```

Imported items are upserted into `rss_items` by canonical URL and shown at
`/admin/rss`. Review candidates there before turning them into Founder Hub articles.
This keeps the homepage fed by edited/published `articles`, not raw syndicated text.
The RSS candidate page supports selecting, rejecting, restoring, and generating an
unpublished article draft from a candidate.

If `DEEPSEEK_API_KEY` is configured, `npm run import:rss` also performs an AI
screening pass for each imported candidate. The pass writes `ai_summary`,
`founder_takeaway`, `ai_reason`, scores, duplicate risk, and suggested tags. Disable it
for a run with:

```bash
npm run import:rss -- --no-ai
```

Admins can also run AI screening for a single candidate from `/admin/rss`.

### Scheduled imports

Production deployments use Vercel Cron through `/api/cron/rss-import`. It runs every
day at 09:17 China Standard Time. Vercel Cron schedules use UTC, so the configured
schedule is `17 1 * * *`. Cron jobs run only on production deployments.

Add these GitHub repository secrets before enabling the workflow:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
```

These are optional and use the application defaults when omitted:

```text
DEEPSEEK_BASE_URL
DEEPSEEK_MODEL
CRON_SECRET
```

The scheduled job imports at most five items per enabled feed. A manual run can set a
different per-feed limit. If no feed in `data/rss-feeds.json` has both `enabled: true`
and a URL, the job exits successfully without importing anything.

`CRON_SECRET` should be a random string of at least 16 characters. The endpoint only
accepts requests carrying `Authorization: Bearer <CRON_SECRET>`.

The previous GitHub Actions workflow remains available as a backup/manual import path.

The admin RSS pages also support manual imports, feed connection tests, and recent run
history. The `rss_feed_runs` table is included in `supabase/schema.sql`.

For local-only fallback, import enabled feed items as unpublished MDX drafts with:

```bash
npm run import:rss:legacy
```

Legacy drafts are saved under `content/writing/` with source metadata, tags, and a
starter interpretation template.

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

When article URL import finds a remote `og:image` or `twitter:image` and R2 is
configured, the image is copied to the `crawled-images/` prefix. The article `cover`
uses the R2 public URL, and the original image URL is recorded in `media_assets.source_url`.
If the copy fails or the file is not an image, import continues with the original URL.

Resource downloads go through `/api/resources/download/[id]`. Free resources redirect
through this server endpoint, while member resources remain locked until membership
verification is implemented. Do not put private download URLs directly in public page
markup; use R2 signed URLs or a protected provider endpoint for member-only files.

Member-only downloads are checked against the `memberships` table by email. Until a
payment provider is connected, memberships can be granted manually in Supabase for
testing; payment webhooks should later create or update these rows.
