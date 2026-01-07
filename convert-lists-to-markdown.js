#!/usr/bin/env node

/**
 * Convert indented lists to markdown format
 *
 * This script converts indented lists (using tabs or spaces) in markdown files
 * to proper markdown list format using "- " prefix. Handles multi-line items,
 * preserves markdown links and HTML entities.
 *
 * Usage:
 *   node convert-lists-to-markdown.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, 'src', 'content', 'posts');

const TARGET_FILES = [
  'preparing-for-2022-a-new-system.md',
  'yeah-its-possible-but-would-i-like-it.md',
  'comic-books.md',
  'sort-process-collate-enjoy.md',
  'input-output.md',
  'goodbye-2019-hello-2020.md',
  'my-2020-tech-job-search-play-by-play.md',
];

console.log('📝 Convert indented lists to markdown format');
console.log('===========================================\n');

let filesProcessed = 0;
let filesModified = 0;
let totalItemsConverted = 0;
const results = [];

/**
 * Extract frontmatter from markdown content
 * Returns { frontmatter, body, lineEnding }
 */
function extractFrontmatter(content) {
  // Detect line ending type
  const hasWindowsLineEnding = content.includes('\r\n');
  const lineEnding = hasWindowsLineEnding ? '\r\n' : '\n';

  const lines = content.split(/\r?\n/);

  if (lines[0] !== '---') {
    return { frontmatter: '', body: content, lineEnding };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: '', body: content, lineEnding };
  }

  const frontmatter = lines.slice(0, endIndex + 1).join(lineEnding);
  const body = lines.slice(endIndex + 1).join(lineEnding);

  return { frontmatter, body, lineEnding };
}

/**
 * Detect indentation type in body content
 * Returns 'TABS', 'SPACES_4', 'SPACE_TAB', or null if no indentation found
 */
function detectIndentationType(bodyLines) {
  for (const line of bodyLines) {
    // Check space+tab first (more specific pattern from WordPress exports)
    if (line.startsWith(' \t')) {
      return 'SPACE_TAB';
    }
    if (line.startsWith('\t')) {
      return 'TABS';
    }
    if (line.startsWith('    ')) {
      return 'SPACES_4';
    }
  }
  return null;
}

/**
 * Check if a line is indented (starts with tabs, spaces, or space+tab combo)
 */
function isIndented(line) {
  // Check for tab, 4+ spaces, or space+tab (WordPress export pattern)
  return line.startsWith('\t') || line.startsWith('    ') || line.startsWith(' \t');
}

/**
 * Get the indentation string from a line
 */
function getIndentation(line) {
  let indent = '';
  for (const char of line) {
    if (char === '\t' || char === ' ') {
      indent += char;
    } else {
      break;
    }
  }
  return indent;
}

/**
 * Convert indented list blocks to markdown format
 */
function convertListsInContent(body, indentationType) {
  const lines = body.split(/\r?\n/);
  const result = [];
  let currentBlock = [];
  let itemsConverted = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isIndented(line)) {
      currentBlock.push(line);
    } else {
      // End of indented block - process it
      if (currentBlock.length > 0) {
        const { converted, count } = convertBlock(currentBlock);
        result.push(...converted);
        itemsConverted += count;
        currentBlock = [];
      }
      result.push(line);
    }
  }

  // Handle remaining block at end of file
  if (currentBlock.length > 0) {
    const { converted, count } = convertBlock(currentBlock);
    result.push(...converted);
    itemsConverted += count;
  }

  return { converted: result, itemsConverted };
}

/**
 * Convert a single block of indented lines to a list
 * Each non-blank indented line becomes a separate list item
 */
function convertBlock(blockLines) {
  if (blockLines.length === 0) return { converted: [], count: 0 };

  const result = [];
  let itemsConverted = 0;

  for (let i = 0; i < blockLines.length; i++) {
    const line = blockLines[i];
    const trimmedLine = line.trimStart();
    const isBlank = trimmedLine.length === 0;

    if (isBlank) {
      // Preserve blank lines within the block
      result.push('');
    } else {
      // Each non-blank line becomes a list item
      result.push('- ' + trimmedLine);
      itemsConverted++;
    }
  }

  return { converted: result, count: itemsConverted };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body, lineEnding } = extractFrontmatter(content);
    const bodyLines = body.split(/\r?\n/);
    const indentationType = detectIndentationType(bodyLines);

    if (!indentationType) {
      return { modified: false, itemsConverted: 0 };
    }

    const { converted, itemsConverted } = convertListsInContent(body, indentationType);
    const newBody = converted.join(lineEnding);

    const newContent = frontmatter
      ? frontmatter + lineEnding + newBody
      : newBody;

    // Only write if content changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      return { modified: true, itemsConverted };
    }

    return { modified: false, itemsConverted: 0 };
  } catch (error) {
    console.error(`❌ Error processing ${path.basename(filePath)}: ${error.message}`);
    return { modified: false, itemsConverted: 0, error: true };
  }
}

// Main execution
if (!fs.existsSync(POSTS_DIR)) {
  console.error(`❌ Posts directory not found: ${POSTS_DIR}`);
  process.exit(1);
}

console.log(`📁 Processing ${TARGET_FILES.length} files\n`);

for (const filename of TARGET_FILES) {
  const filePath = path.join(POSTS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filename} - file not found`);
    continue;
  }

  filesProcessed++;
  const result = processFile(filePath);

  if (result.error) {
    // Error already logged
  } else if (result.modified) {
    filesModified++;
    totalItemsConverted += result.itemsConverted;
    console.log(`   ✓ ${filename} (${result.itemsConverted} items)`);
  } else {
    console.log(`   - ${filename} (no changes)`);
  }

  results.push({ filename, ...result });
}

console.log(`\n✅ Completed!`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Items converted: ${totalItemsConverted}`);
