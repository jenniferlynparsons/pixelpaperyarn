#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, 'src', 'content', 'posts');

// Read all markdown files in the posts directory
const files = fs.readdirSync(postsDir)
  .filter(file => file.endsWith('.md'))
  .map(file => path.join(postsDir, file));

console.log(`Found ${files.length} markdown files`);

let filesModified = 0;

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Remove the wp_id line (including the newline)
  const newContent = content.replace(/^wp_id: .*\n/m, '');

  // Check if anything was actually removed
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    filesModified++;
    console.log(`✓ Removed wp_id from ${path.basename(filePath)}`);
  }
});

console.log(`\nCompleted! Modified ${filesModified} files.`);
