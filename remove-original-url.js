#!/usr/bin/env node

/**
 * Remove original_url from frontmatter
 *
 * This script removes the original_url field from all posts and pages
 * since the old WordPress URLs are no longer needed.
 *
 * Usage:
 *   node remove-original-url.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDirs = [
  path.join(__dirname, 'src', 'content', 'posts'),
  path.join(__dirname, 'src', 'content', 'pages'),
];

console.log('🧹 Remove original_url from frontmatter');
console.log('=======================================\n');

let filesModified = 0;
let totalFiles = 0;

for (const dir of contentDirs) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory not found: ${dir}`);
    continue;
  }

  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(dir, file));

  console.log(`📁 Processing ${path.basename(dir)}/ (${files.length} files)`);

  for (const filePath of files) {
    totalFiles++;
    const content = fs.readFileSync(filePath, 'utf-8');

    // Remove the original_url line (including the newline)
    const newContent = content.replace(/^original_url: .*\n/m, '');

    // Check if anything was actually removed
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      filesModified++;
      console.log(`   ✓ ${path.basename(filePath)}`);
    }
  }
}

console.log(`\n✅ Completed! Modified ${filesModified} of ${totalFiles} files.`);
