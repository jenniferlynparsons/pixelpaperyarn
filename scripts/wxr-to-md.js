#!/usr/bin/env node

/**
 * WordPress WXR to Markdown Converter
 * 
 * This script converts a WordPress export (WXR) file to Markdown/MDX posts
 * with YAML frontmatter for use in the Astro content collection.
 * 
 * Usage:
 *   node scripts/wxr-to-md.js [--dry-run] path/to/export.xml
 * 
 * Example:
 *   node scripts/wxr-to-md.js --dry-run export.xml
 *   node scripts/wxr-to-md.js export.xml
 */

const fs = require('fs');
const path = require('path');
// const xml2js = require('xml2js');
// const yaml = require('js-yaml');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const wxrFile = args[args.length - 1];

if (!wxrFile || wxrFile.startsWith('--')) {
  console.error('Usage: node wxr-to-md.js [--dry-run] path/to/export.xml');
  process.exit(1);
}

if (!fs.existsSync(wxrFile)) {
  console.error(`Error: File not found: ${wxrFile}`);
  process.exit(1);
}

console.log('📝 WordPress WXR to Markdown Converter');
console.log('=====================================\n');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No files will be written\n');
}

// TODO: Implement WXR parsing
// 1. Load and parse XML from WXR file
// 2. Extract posts, pages, media metadata
// 3. Map WP fields to Markdown frontmatter:
//    - wp:post_id → wp_id
//    - title → title
//    - wp:post_date → date (convert to ISO 8601)
//    - content:encoded → post body (convert shortcodes/HTML to Markdown)
//    - excerpt:encoded → excerpt
//    - category domain="post_tag" → tags
//    - category domain="category" → categories
//    - wp:post_name → slug (or generate from title)
// 4. Handle media: extract wp:attachment_url for migration
// 5. Generate mapping: wp_id → new slug for redirects
// 6. Write Markdown files to src/content/posts/
// 7. Output summary and warnings for manual review

console.log('\n✅ Placeholder script created.');
console.log('\nNext steps:');
console.log('1. Install dependencies: npm install xml2js js-yaml');
console.log('2. Place your WordPress WXR export in the project root or scripts/ folder');
console.log('3. Run: node scripts/wxr-to-md.js --dry-run export.xml');
console.log('4. Review the output, then run without --dry-run to import');
console.log('\nFor documentation, see scripts/README.md');
