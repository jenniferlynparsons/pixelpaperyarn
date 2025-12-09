# Migration Scripts Documentation

This folder contains helper scripts for migrating your WordPress site to Astro.

## Overview

The migration process involves:

1. **Converting Posts**: `wxr-to-md.js` — Converts your WordPress WXR export to Markdown files
2. **Migrating Media**: `migrate-media.sh` — Handles media files (images, documents)
3. **Generating Redirects**: Mapping file for old WordPress URLs to new Astro routes

## Prerequisites

Before running the migration scripts, you'll need:

- **WordPress WXR Export**: Go to WordPress Admin > Tools > Export > Download Export File
- **Node.js ≥18**: For running the wxr-to-md.js script
- **Bash**: For running the migrate-media.sh script

### Install Script Dependencies

```bash
npm install xml2js js-yaml
```

## Step 1: Export WordPress Content

1. Log in to your WordPress admin panel
2. Go to **Tools** → **Export**
3. Choose **All content** (or specific post types)
4. Click **Download Export File**
5. Save the `export.xml` file to the project root or `scripts/` folder

## Step 2: Convert Posts (WXR → Markdown)

### Dry Run (Validate without Writing)

```bash
node scripts/wxr-to-md.js --dry-run export.xml
```

This will:
- Parse the WXR file
- Display a summary of posts, pages, media found
- Show any warnings about unsupported shortcodes or HTML
- Generate a mapping file (wp_id → new slug) for redirects
- **Not write any files**

### Full Import

```bash
node scripts/wxr-to-md.js export.xml
```

This will:
- Convert all posts to Markdown files in `src/content/posts/`
- Generate frontmatter with:
  - `title` — Post title
  - `date` — Publication date (ISO 8601)
  - `slug` — URL-friendly identifier
  - `excerpt` — Post excerpt
  - `categories` — Category tags
  - `tags` — Post tags
  - `wp_id` — Original WordPress post ID
  - `original_url` — Original WordPress URL
- Create a `mapping.json` file for redirect generation

### Example Output

```
✅ Conversion Complete
├── Posts processed: 42
├── Pages processed: 5
├── Media references: 127
├── Warnings: 3 (unsupported shortcodes in posts 5, 12, 38)
└── Output: src/content/posts/
```

## Step 3: Migrate Media

If your posts reference media files (images, PDFs, etc.), migrate them using:

### Copy from Local Directory

```bash
bash scripts/migrate-media.sh copy /path/to/old-wp-uploads public/assets/uploads
```

### Download from URLs

Create a file `media-urls.txt` with one URL per line:

```
https://old-site.com/wp-content/uploads/2023/01/image1.jpg
https://old-site.com/wp-content/uploads/2023/01/image2.png
...
```

Then run:

```bash
bash scripts/migrate-media.sh download media-urls.txt public/assets/uploads
```

### Sync from S3

```bash
bash scripts/migrate-media.sh s3 s3://old-bucket/uploads public/assets/uploads
```

*Requires AWS CLI configured with appropriate credentials.*

## Step 4: Review and Verify

After import, verify:

- [ ] Correct number of posts in `src/content/posts/`
- [ ] Frontmatter looks correct (dates, slugs, categories)
- [ ] Post content is readable (check for shortcode warnings)
- [ ] Media files are present in `public/assets/`
- [ ] No duplicate slugs (would cause routing conflicts)

### Check for Duplicates

```bash
ls src/content/posts/ | sort | uniq -d
```

Should return empty if no duplicates.

## Step 5: Generate Redirects

The `mapping.json` file generated during import maps old WordPress URLs to new Astro routes.

Update `netlify.toml` with redirects:

```toml
# Generated from mapping.json
[[redirects]]
  from = "/old-post-url/*"
  to = "/blog/new-post-slug"
  status = 301

[[redirects]]
  from = "/another-old-url/*"
  to = "/blog/another-slug"
  status = 301
```

## Step 6: Test Locally

```bash
npm run build
npm run preview
```

Visit http://localhost:3000/blog/your-post-slug to verify posts display correctly.

## Step 7: Commit and Deploy

```bash
git add src/content/posts public/assets netlify.toml
git commit -m "feat(content): import initial WordPress posts and media"
git push origin main
```

Netlify will automatically deploy the changes.

## Frontmatter Schema Reference

Each Markdown file in `src/content/posts/` should have YAML frontmatter:

```yaml
---
title: "Your Post Title"
date: 2025-01-15T10:30:00Z
slug: "your-post-slug"
excerpt: "A brief summary of your post"
categories: ["category1", "category2"]
tags: ["tag1", "tag2"]
wp_id: 12345
original_url: "https://old-site.com/your-post-slug/"
---
```

### Field Descriptions

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | ✅ | Post headline |
| date | string | ✅ | ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) |
| slug | string | ✅ | URL-friendly, must be unique |
| excerpt | string | ❌ | SEO description (160-180 chars recommended) |
| categories | string[] | ❌ | Primary content organization |
| tags | string[] | ❌ | Secondary keywords |
| wp_id | number | ✅ | Original WordPress post ID (for tracking) |
| original_url | string | ✅ | Original WordPress URL (for redirects) |

## Troubleshooting

### Issue: "Shortcodes not supported"

The importer detects shortcodes (e.g., `[gallery]`, `[contact-form]`) that don't have a direct Markdown equivalent.

**Solution:**
1. Note the post IDs with issues
2. Edit those posts manually in the Markdown files
3. Or, replace shortcodes with appropriate HTML/Markdown equivalents

### Issue: "Missing media files"

Some posts reference media that wasn't exported with the WXR.

**Solution:**
1. Manually download missing media to `public/assets/uploads/`
2. Update post content to point to the correct URLs

### Issue: "Duplicate slug errors"

Two or more posts have the same slug, causing routing conflicts.

**Solution:**
1. Find duplicates: `ls src/content/posts/ | sort | uniq -d`
2. Rename one of the files to use a unique slug
3. Update the frontmatter `slug:` field to match

### Issue: "Build fails on special characters"

Some posts may have characters that break the Markdown parser.

**Solution:**
1. Check the error log: `npm run build`
2. Edit the problematic post's frontmatter (quote strings, escape chars)
3. Or, convert HTML to proper Markdown syntax

## Advanced: Manual Post Creation

If you prefer not to use the importer, create posts manually:

```bash
touch src/content/posts/my-new-post.md
```

Add frontmatter and content:

```markdown
---
title: "My New Post"
date: 2025-01-20T14:00:00Z
slug: "my-new-post"
excerpt: "This is my new post"
categories: ["life"]
tags: ["writing", "astro"]
wp_id: 0
original_url: ""
---

# My New Post

Write your post content in Markdown...

- Bullet points
- Are supported
- As are headings, links, etc.

```

## Resources

- [Astro Content Collections Docs](https://docs.astro.build/en/guides/content-collections/)
- [Markdown Syntax Reference](https://www.markdownguide.org/)
- [WordPress WXR Format](https://wordpress.org/support/article/tools-export-screen/)
- [YAML Syntax](https://yaml.org/start.html)

---

**Questions?** Refer to `MIGRATION_PLAN.md` at the project root for the full migration strategy.
