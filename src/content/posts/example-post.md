---
title: Welcome to Your Pixel Paper Yarn Blog
date: 2025-01-01T10:00:00Z
slug: welcome-to-pixel-paper-yarn
excerpt: An example blog post demonstrating the frontmatter schema for migrated WordPress content.
categories: [example, getting-started]
tags: [astro, migration, welcome]
wp_id: 1
original_url: https://pixelpaperyarn.com/welcome/
---

# Welcome to Your New Astro Site

This is an example post showing the frontmatter structure that will be used for your migrated WordPress content.

## What You'll Find Here

Once you import your WordPress WXR export, your blog posts will appear here with:

- **Title**: The post title
- **Date**: Publication date in ISO 8601 format
- **Excerpt**: A brief summary
- **Categories**: Organized by topic
- **Tags**: For tagging and filtering
- **Original WordPress ID**: For tracking migrations
- **Original URL**: For generating redirects

## Key Information

The example frontmatter fields are:

- `title` - Post headline
- `date` - Publication timestamp
- `slug` - URL-friendly identifier
- `excerpt` - SEO description and preview text
- `categories` - Primary content organization
- `tags` - Secondary keywords and topics
- `wp_id` - Original WordPress post ID (for migration tracking)
- `original_url` - Original WordPress URL (for generating redirects)

## Next Steps

1. Prepare your WordPress WXR export
2. Run the migration script: `node scripts/wxr-to-md.js path/to/export.xml`
3. Your posts will be converted to Markdown in `src/content/posts/`
4. Set up redirects from old URLs to new Astro routes
5. Deploy to Netlify

---

**Note:** This is a placeholder post. Replace it with your actual migrated content!
