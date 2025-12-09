# Pixel Paper Yarn — WordPress to Astro Migration Plan

**Project Goal:** Recreate the Pixel Paper Yarn WordPress site in Astro with Tailwind CSS and deploy to Netlify.

**Status:** Planning phase complete. Ready for implementation.

---

## Overview

This document outlines the full migration strategy, including:
- Project structure and file organization
- Essential dependencies and integrations
- Git commit checkpoints with clear messages
- Step-by-step implementation commands
- Migration workflow for WordPress WXR export
- Netlify deployment and CI/CD setup

---

## Key Decisions

- **Framework:** Astro (latest stable)
- **Styling:** Tailwind CSS 3+ with PostCSS
- **Hosting:** Netlify (with Netlify adapter for Astro)
- **Content:** Markdown/MDX in `src/content/posts/` and `src/content/pages/`
- **Media:** Hosted in `public/assets/` (or CDN post-migration)
- **Git Strategy:** Feature branches with merge commits at checkpoint milestones
- **Build Command:** `npm run build`
- **Publish Directory:** `dist/`

---

## Project File Structure

```
pixelpaperyarn/
├── package.json                    # Project metadata & npm scripts
├── astro.config.mjs                # Astro config with Netlify adapter
├── netlify.toml                    # Netlify build & redirect rules
├── postcss.config.cjs              # PostCSS (Tailwind + autoprefixer)
├── tailwind.config.cjs             # Tailwind theme & content globs
├── .gitignore                      # Git exclusions
├── README.md                       # Project overview & setup
├── MIGRATION_PLAN.md               # This file
│
├── public/
│   ├── assets/
│   │   └── (images, favicon, media placeholder)
│   └── robots.txt
│
├── src/
│   ├── pages/
│   │   ├── index.astro             # Home page (lists blog posts)
│   │   └── blog/
│   │       └── [slug].astro        # Dynamic blog post route
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro        # Site wrapper (header, footer, global styles)
│   │   └── PostLayout.astro        # Blog post template
│   │
│   ├── components/
│   │   ├── Header.astro            # Site header & navigation
│   │   ├── Footer.astro            # Site footer
│   │   └── PostCard.astro          # Reusable post preview card
│   │
│   ├── styles/
│   │   └── global.css              # Tailwind directives + global styles
│   │
│   └── content/
│       └── posts/
│           ├── .gitkeep
│           └── example-post.md     # Example post with frontmatter schema
│
├── scripts/
│   ├── wxr-to-md.js                # WXR → Markdown importer (placeholder)
│   ├── migrate-media.sh             # Media migration helper (placeholder)
│   └── README.md                   # Migration script documentation
│
└── types/ (optional)
    └── content.ts                  # TypeScript types for content schema
```

---

## Essential Dependencies

### Core
- `astro@latest` – Web framework
- `@astrojs/netlify` – Netlify adapter for SSR/static builds

### Styling
- `tailwindcss` – Utility-first CSS framework (dev)
- `postcss` – CSS processor (dev)
- `autoprefixer` – CSS vendor prefixing (dev)

### Optional Enhancements
- `@tailwindcss/typography` – Better default prose styling
- `@tailwindcss/forms` – Form element styling
- `netlify-cli` – Local Netlify-like dev environment (dev)

### Migration (later)
- `xml2js` or similar – Parse WXR XML
- `js-yaml` – YAML frontmatter generation

---

## Git Commit Checkpoints

Follow these checkpoints to maintain a clean, reviewable history. Each checkpoint is a logical unit of work.

### Checkpoint 1: Initial Astro Scaffold
**Message:** `chore: initial Astro scaffold`

**Contents:**
- `package.json` (with npm scripts: dev, build, preview)
- `astro.config.mjs` (minimal config, Netlify adapter imported but not yet active)
- `src/pages/index.astro` (basic welcome page)
- `src/layouts/BaseLayout.astro` (basic HTML wrapper)
- `src/components/Header.astro` (stub header)
- `src/components/Footer.astro` (stub footer)
- `.gitignore` (node_modules, dist, .netlify, .env, .DS_Store, etc.)
- `README.md` (project overview and environment requirements)
- `public/` directory (empty or with placeholder)

---

### Checkpoint 2: Add Tailwind CSS & Global Styles
**Message:** `feat: add Tailwind CSS and global styles`

**Contents:**
- `postcss.config.cjs` (Tailwind + Autoprefixer)
- `tailwind.config.cjs` (content globs, theme customizations)
- `src/styles/global.css` (Tailwind directives: @tailwind base/components/utilities)
- Updated `src/layouts/BaseLayout.astro` (import global CSS)
- Updated `package.json` (Tailwind dev deps added)
- Example components styled with Tailwind utilities

---

### Checkpoint 3: Add Netlify Adapter & Configuration
**Message:** `chore: add Netlify adapter and netlify.toml`

**Contents:**
- `astro.config.mjs` updated (Netlify adapter active, build settings)
- `netlify.toml` (build command, publish directory, environment, redirect rules skeleton)
- `.env.example` (template for environment variables, if needed)
- Updated `README.md` (Netlify setup hints, required env vars, build settings)
- `package.json` updated (Netlify adapter dependency added)

---

### Checkpoint 4: Scaffold Content Structure & Migration Placeholders
**Message:** `chore: scaffold content collections and migration tooling`

**Contents:**
- `src/content/posts/` directory with `.gitkeep`
- `src/content/posts/example-post.md` (demonstrates frontmatter schema: title, date, slug, excerpt, categories, tags, wp_id, original_url)
- `src/pages/blog/[slug].astro` (dynamic route for blog posts, querying content collection)
- `scripts/wxr-to-md.js` (skeleton with TODO comments for WXR parsing, dry-run mode, mapping export)
- `scripts/migrate-media.sh` (skeleton with notes for media sync steps)
- `scripts/README.md` (instructions for running importer, expected WXR format, output descriptions)
- Updated `README.md` (migration workflow overview, how to add WXR and run scripts)

---

### Checkpoint 5: Initial Documentation & Validation
**Message:** `docs: finalize README and migration guide`

**Contents:**
- Expanded `README.md` with:
  - Local dev commands (npm run dev, build, preview)
  - Netlify setup steps (linking repo, setting env vars, deploying)
  - Migration flow (WXR → scripts/wxr-to-md.js → content/posts/*, media handling, redirects)
  - Required Node.js version and dev environment
  - Troubleshooting section
- `scripts/README.md` fully documented with examples

---

## Implementation Steps (Detailed)

### Phase 1: Initialize & Scaffold (Checkpoint 1)

```bash
# Create Astro project
npm create astro@latest -- --template basics

# Navigate into project
cd pixelpaperyarn

# Initialize Git
git init
git branch -M main
git add .
git commit -m "chore: initial Astro scaffold"
```

### Phase 2: Add Tailwind (Checkpoint 2)

```bash
# Install Tailwind dev dependencies
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind and PostCSS configs
npx tailwindcss init -p

# (Optional) Install Tailwind plugins for better typography
npm install -D @tailwindcss/typography @tailwindcss/forms

# Create global styles file
mkdir -p src/styles
echo '@tailwind base; @tailwind components; @tailwind utilities;' > src/styles/global.css

# Update BaseLayout to import global CSS (see template below)
# Update tailwind.config.cjs content globs (see config below)

git add .
git commit -m "feat: add Tailwind CSS and global styles"
```

### Phase 3: Add Netlify Adapter (Checkpoint 3)

```bash
# Install Netlify adapter
npm install @astrojs/netlify

# Create netlify.toml (see template below)
# Update astro.config.mjs to use Netlify adapter (see config below)

git add .
git commit -m "chore: add Netlify adapter and netlify.toml"
```

### Phase 4: Scaffold Content & Migration Tools (Checkpoint 4)

```bash
# Create content directories
mkdir -p src/content/posts
mkdir -p scripts
mkdir -p public/assets

# Create .gitkeep files to preserve empty directories
touch src/content/posts/.gitkeep
touch public/assets/.gitkeep

# Create example post and script placeholders (see templates below)
# Create content routes (src/pages/blog/[slug].astro)

git add .
git commit -m "chore: scaffold content collections and migration tooling"
```

### Phase 5: Finalize Documentation (Checkpoint 5)

```bash
# Update README.md with full setup and migration instructions
# Update scripts/README.md with importer documentation

git add .
git commit -m "docs: finalize README and migration guide"
```

### Phase 6: Push to GitHub & Connect to Netlify

```bash
# Add remote (replace with your actual repo URL)
git remote add origin git@github.com:YOUR_USERNAME/pixelpaperyarn.git

# Push to GitHub
git push -u origin main

# Connect Netlify to your repo via Netlify dashboard:
# 1. New site from Git
# 2. Select GitHub and authorize
# 3. Choose your repo
# 4. Confirm build settings (should auto-detect Astro)
# 5. Deploy

# (Optional) Link local project to Netlify site
netlify link

# (Optional) Deploy from CLI
netlify deploy --prod
```

---

## Configuration Templates

### `astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'static', // or 'hybrid' if you need SSR later
  adapter: netlify(),
  integrations: [
    // Future integrations: image optimization, sitemap, RSS
  ],
});
```

### `tailwind.config.cjs`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}',
    './src/content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      // Customize colors, fonts, spacing as needed
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
```

### `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18.17.0"  # Match your local Node version

[[redirects]]
  from = "/old-post/*"
  to = "/blog/:splat"
  status = 301

# Additional redirects for migrated posts will be added here
# Format: from = "/old-wordpress-url/", to = "/new-astro-path/", status = 301
```

### `src/layouts/BaseLayout.astro`

```astro
---
import '../styles/global.css';

interface Props {
  title?: string;
}

const { title = 'Pixel Paper Yarn' } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

### `src/content/posts/example-post.md`

```markdown
---
title: Example Post
date: 2025-01-01T10:00:00Z
slug: example-post
excerpt: This is an example blog post showing the frontmatter structure.
categories: [example]
tags: [astro, migration]
wp_id: 12345
original_url: https://pixelpaperyarn.com/example-post/
---

# Welcome to Your Blog

This is an example post. Replace this with your migrated WordPress content.

## Features

- Markdown support
- Tailwind styling
- Static generation

More content here...
```

---

## Migration Workflow (WXR Import — Later)

When you have the WordPress WXR export:

1. **Place WXR file** in project root or `scripts/` directory
2. **Run importer** (dry-run first to validate):
   ```bash
   node scripts/wxr-to-md.js --dry-run path/to/export.xml
   ```
3. **Review mapping** and any warnings about shortcodes or unsupported content
4. **Run full import:**
   ```bash
   node scripts/wxr-to-md.js path/to/export.xml
   ```
5. **Migrate media** (if not embedded in content):
   ```bash
   bash scripts/migrate-media.sh
   ```
6. **Generate redirects** from WP URLs → new Astro slugs and add to `netlify.toml`
7. **Validate locally:**
   ```bash
   npm run build && npm run preview
   ```
8. **Commit content batch:**
   ```bash
   git add src/content/ public/assets/
   git commit -m "feat(content): import initial WordPress posts and media"
   ```
9. **Deploy to Netlify** (automatic on push to main, or via CLI)

---

## Local Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# (Optional) Use Netlify CLI for local Netlify-like environment
netlify dev
```

---

## Netlify Setup

1. **Connect Repository:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"
   - Authorize GitHub and select `pixelpaperyarn` repo
   - Confirm build settings (auto-detect should work for Astro)

2. **Set Environment Variables:**
   - In Netlify site settings → "Build & deploy" → "Environment"
   - Add `NODE_VERSION` = (your local Node version, e.g., `18.17.0`)

3. **Deploy:**
   - Push to `main` branch on GitHub → automatic deploy
   - Or use CLI: `netlify deploy --prod`

4. **Enable Preview Deploys:**
   - Set branch deploy rules for PRs or feature branches
   - This lets you validate changes before merging to main

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Node version mismatch (local vs Netlify) | Pin `NODE_VERSION` in `netlify.toml` and `.nvmrc` |
| Tailwind classes purged from migrated content | Add content globs for `src/content/**/*.{md,mdx}` and safelist known dynamic classes |
| Large media volume slows build or deployment | Offload media to CDN (AWS S3, Cloudinary) during migration; rewrite URLs in importer |
| WP shortcodes don't convert to Markdown | Detect in dry-run; manually convert most-used ones; flag others for review |
| Permalinks break; inbound links lost | Generate redirect map from importer; add to `netlify.toml`; test subset before full switch |
| Background image (fixed) looks odd on mobile | Use `background-attachment: fixed` only on desktop (`@media`); prefer `<picture>`/`img` hero |

---

## Next Steps

1. ✅ **Plan complete** — This document
2. ⬜ **Run scaffold commands** (Phase 1–5)
3. ⬜ **Test locally** (npm run dev, npm run build)
4. ⬜ **Push to GitHub** and link to Netlify
5. ⬜ **Prepare WXR export** from WordPress
6. ⬜ **Run migration scripts** and validate
7. ⬜ **Add redirects** and test old URLs
8. ⬜ **Go live** — switch DNS or site URL to Netlify

---

## Appendix: Quick Reference

### Common Commands
```bash
npm run dev          # Local development server
npm run build        # Production build
npm run preview      # Preview production build
git add .            # Stage changes
git commit -m "..."  # Commit with message
git push -u origin main  # Push to GitHub
```

### File Editing Checklist
- [ ] `astro.config.mjs` — Add Netlify adapter
- [ ] `tailwind.config.cjs` — Set content globs, extend theme
- [ ] `netlify.toml` — Build settings, redirects
- [ ] `src/layouts/BaseLayout.astro` — Import global CSS
- [ ] `src/styles/global.css` — Tailwind directives
- [ ] `src/pages/index.astro` — Home page
- [ ] `src/pages/blog/[slug].astro` — Dynamic blog routes
- [ ] `README.md` — Full setup documentation

### Useful Links
- [Astro Docs](https://docs.astro.build)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Astro + Netlify Integration](https://docs.astro.build/en/guides/deploy/netlify/)

---

**Last Updated:** December 9, 2025  
**Status:** Ready for implementation
