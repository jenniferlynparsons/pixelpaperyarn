# Pixel Paper Yarn — Astro Site

A modern recreation of the Pixel Paper Yarn WordPress site in Astro, with Tailwind CSS and Netlify deployment.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org/))
- npm (comes with Node)
- Git

### Installation

```bash
# Clone the repository (if you haven't already)
git clone <your-repo-url>
cd pixelpaperyarn

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser. The site will auto-update as you make changes.

### Build & Deploy

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Netlify (after linking repository)
# See "Netlify Setup" section below
```

## 📁 Project Structure

```
pixelpaperyarn/
├── public/              # Static assets (images, favicon, robots.txt)
│   └── assets/          # Images and media
├── src/
│   ├── pages/           # Website routes
│   │   ├── index.astro  # Home page
│   │   └── blog/
│   │       └── [slug].astro  # Dynamic blog post route
│   ├── layouts/         # Reusable page templates
│   │   ├── BaseLayout.astro  # Main site wrapper
│   │   └── PostLayout.astro  # Blog post template
│   ├── components/      # Reusable UI components
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── styles/          # Global CSS and Tailwind
│   │   └── global.css
│   └── content/         # Blog posts and pages (Markdown)
│       └── posts/
│           └── example-post.md
├── scripts/             # Migration utilities
│   ├── wxr-to-md.js     # WordPress export converter
│   ├── migrate-media.sh  # Media migration helper
│   └── README.md        # Migration documentation
├── MIGRATION_PLAN.md    # Detailed implementation plan
├── package.json         # Dependencies & scripts
├── astro.config.mjs     # Astro configuration
├── tailwind.config.cjs  # Tailwind CSS configuration
└── netlify.toml         # Netlify build settings
```

## 🎨 Tech Stack

- **Framework:** [Astro](https://astro.build/) — Static site generator
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) — Utility-first CSS
- **Hosting:** [Netlify](https://netlify.com/) — Modern web deployment
- **Content:** Markdown/MDX in `src/content/posts/`
- **Build Tool:** Vite (built into Astro)

## 📝 Content Management

### Adding Blog Posts

Blog posts are Markdown files in `src/content/posts/`. Create a new file with frontmatter:

```markdown
---
title: "Your Post Title"
date: 2025-01-20T10:00:00Z
slug: "your-post-slug"
excerpt: "A brief summary for SEO and previews"
categories: ["category1"]
tags: ["tag1", "tag2"]
wp_id: 0
original_url: ""
---

# Your Post Title

Your content here in Markdown format...
```

Posts are automatically available at `/blog/your-post-slug/`.

### Importing from WordPress

1. **Export from WordPress:**
   - Go to WordPress Admin → Tools → Export
   - Download the XML (WXR) file

2. **Convert to Markdown:**
   ```bash
   node scripts/wxr-to-md.js --dry-run export.xml  # Preview
   node scripts/wxr-to-md.js export.xml             # Import
   ```

3. **Migrate Media:**
   ```bash
   bash scripts/migrate-media.sh copy /path/to/uploads public/assets/uploads
   ```

4. **Generate Redirects:**
   - Update `netlify.toml` with old → new URL mappings
   - Preserve old WordPress URLs for SEO

See `scripts/README.md` for detailed migration instructions.

## 🌐 Netlify Setup

### Connect to Netlify

1. Push your repository to GitHub
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click **"New site from Git"**
4. Select your GitHub repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** `18.17.0` (or your current version)

### Environment Variables

Set in Netlify site settings under **Build & deploy** → **Environment**:

```
NODE_VERSION=18.17.0
```

### Deploy from CLI (Optional)

```bash
npm install -g netlify-cli
netlify link                 # Link to your Netlify site
netlify deploy --prod        # Deploy to production
```

## 🚨 Styling Notes

### Fixed Background Images

The original WordPress site uses `background-attachment: fixed` for a parallax effect. In Astro with Tailwind:

```astro
<!-- Only use on desktop; causes performance issues on mobile -->
<div class="hidden md:block" style="background-attachment: fixed;">
  <!-- Mobile uses scroll attachment by default -->
</div>
```

### Tailwind Configuration

Tailwind is pre-configured in `tailwind.config.cjs` with:
- Content globs for Astro components and Markdown posts
- Theme extensions for custom colors/spacing
- Plugins: `@tailwindcss/typography` (for prose content)

Customize by editing `tailwind.config.cjs` and `src/styles/global.css`.

## 🔍 Development Tips

### Hot Module Reload (HMR)

Changes to `.astro`, `.css`, or Markdown files auto-refresh without full page reload.

### Build Commands

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build static site to dist/
npm run preview          # Preview production build locally
npm run astro -- --help  # Astro CLI help
```

### Debugging

- Check **Console** in browser DevTools for errors
- View build output: `npm run build` (shows warnings/errors)
- Netlify deploy logs: Dashboard → Deploys → Build log

## 🔄 Git Workflow

We use feature branches with commit checkpoints:

```bash
# Create a feature branch
git checkout -b feat/your-feature

# Make changes, commit locally
git add .
git commit -m "feat: description of change"

# Push to GitHub
git push -u origin feat/your-feature

# Open a Pull Request for review

# After merge, deploy automatically to Netlify
```

**Commit Checkpoints:**
1. ✅ `chore: initial Astro scaffold`
2. ✅ `feat: add Tailwind CSS and global styles`
3. ✅ `chore: add Netlify adapter and netlify.toml`
4. ✅ `chore: scaffold content collections and migration tooling`
5. ⬜ `feat(content): import initial WordPress posts and media`

## 📚 Resources

- [Astro Documentation](https://docs.astro.build/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Markdown Guide](https://www.markdownguide.org/)
- [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) — Detailed implementation plan
- [scripts/README.md](./scripts/README.md) — Migration utilities guide

## 🤔 Troubleshooting

### Build fails with "Unexpected token"
- Ensure Node version matches `netlify.toml` (e.g., 18.17.0)
- Run `npm install` to update dependencies

### Posts not showing in blog
- Check `src/content/posts/` for `.md` files
- Verify frontmatter YAML is valid (no quotes issues)
- Ensure `slug` field is unique

### Tailwind styles not applied
- Rebuild: `npm run build`
- Check if component is in `tailwind.config.cjs` content globs
- Make sure `.cjs` files use CommonJS syntax, not ES modules

### Deploy to Netlify failed
- Check build logs in Netlify Dashboard
- Verify `NODE_VERSION` matches local (`node -v`)
- Ensure `npm run build` works locally first

## 📞 Contact & Support

For questions about migration or deployment, refer to:
- `MIGRATION_PLAN.md` — Full implementation roadmap
- `scripts/README.md` — Content import guide
- [Astro Discord](https://astro.build/chat) — Community support

---

**Next Step:** See `MIGRATION_PLAN.md` for detailed migration workflow and commit strategy.
