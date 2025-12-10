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

import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Helper function to convert shortcodes to markdown
function stripShortcodes(text) {
  if (!text) return '';
  // Remove common WordPress shortcodes
  return text.replace(/\[\/?\w+[^\]]*\]/g, '');
}

// Helper function to convert HTML entities and basic HTML to markdown
function htmlToMarkdown(html) {
  if (!html) return '';
  
  let text = html;
  
  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Convert <br> tags to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove HTML comments
  text = text.replace(/<!--.*?-->/gs, '');
  
  // Convert <p> tags
  text = text.replace(/<\/?p>/gi, '\n');
  
  // Convert <strong> and <b> tags to markdown
  text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  
  // Convert <em> and <i> tags to markdown
  text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  
  // Convert <a> tags to markdown links
  text = text.replace(/<a\s+(?:.*?\s+)?href=["']([^"']*?)["'](?:.*?)?>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Remove any remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Clean up multiple newlines
  text = text.replace(/\n\n\n+/g, '\n\n');
  
  // Strip leading/trailing whitespace
  text = text.trim();
  
  return text;
}

// Helper function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Helper function to get first array element (xml2js returns arrays)
function getFirstElement(arr) {
  return Array.isArray(arr) ? arr[0] : arr;
}

// Main conversion function
async function convertWXR() {
  try {
    // Read and parse WXR file
    const wxrContent = fs.readFileSync(wxrFile, 'utf-8');
    const parsed = await parseStringPromise(wxrContent);
    
    const rss = parsed.rss;
    if (!rss || !rss.channel) {
      console.error('Error: Invalid WXR file format');
      process.exit(1);
    }
    
    const channel = rss.channel[0];
    const items = channel.item || [];
    
    // Create output directory if it doesn't exist
    const postsDir = path.join(process.cwd(), 'src', 'content', 'posts');
    if (!dryRun && !fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }
    
    let postsCount = 0;
    let pagesCount = 0;
    let mediaCount = 0;
    let warnings = [];
    const mapping = {};
    
    // Process each item
    for (const item of items) {
      const postType = getFirstElement(item['wp:post_type'] || ['post']);
      const postStatus = getFirstElement(item['wp:status'] || ['publish']);
      
      // Skip non-post items and non-published content
      if (postStatus !== 'publish' || (postType !== 'post' && postType !== 'page')) {
        continue;
      }
      
      const wpId = getFirstElement(item['wp:post_id'] || [0]);
      const title = getFirstElement(item.title || ['Untitled']);
      const slug = getFirstElement(item['wp:post_name'] || [generateSlug(title)]);
      const content = getFirstElement(item['content:encoded'] || ['']);
      const excerpt = getFirstElement(item['excerpt:encoded'] || ['']);
      const postDate = getFirstElement(item['wp:post_date'] || [new Date().toISOString()]);
      const link = getFirstElement(item.link || ['']);
      
      // Extract categories and tags
      const categories = [];
      const tags = [];
      
      if (item.category) {
        for (const cat of item.category) {
          const domain = cat.$.domain || 'category';
          const catName = getFirstElement(cat._);
          if (domain === 'category') {
            categories.push(catName);
          } else if (domain === 'post_tag') {
            tags.push(catName);
          }
        }
      }
      
      // Check for shortcodes and HTML issues
      if (content.includes('[') && content.includes(']')) {
        warnings.push(`Post "${title}" (ID: ${wpId}) contains shortcodes that may need manual review`);
      }
      
      // Convert content
      let markdownContent = htmlToMarkdown(content);
      markdownContent = stripShortcodes(markdownContent);
      
      // Convert excerpt
      let markdownExcerpt = htmlToMarkdown(excerpt);
      markdownExcerpt = stripShortcodes(markdownExcerpt);
      
      // Create frontmatter
      const frontmatter = {
        title,
        date: postDate,
        slug,
        excerpt: markdownExcerpt || undefined,
        categories: categories.length > 0 ? categories : undefined,
        tags: tags.length > 0 ? tags : undefined,
        wp_id: parseInt(wpId),
        original_url: link || '',
      };
      
      // Remove undefined fields
      Object.keys(frontmatter).forEach(key => 
        frontmatter[key] === undefined && delete frontmatter[key]
      );
      
      // Build markdown file content
      const yamlContent = yaml.dump(frontmatter, { 
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false 
      });
      const markdownFile = `---\n${yamlContent}---\n\n${markdownContent}`;
      
      // Create filename
      const filename = `${slug}.md`;
      const filepath = path.join(postsDir, filename);
      
      // Track mapping for redirects
      mapping[wpId] = slug;
      
      // Write file
      if (!dryRun) {
        fs.writeFileSync(filepath, markdownFile, 'utf-8');
      }
      
      if (postType === 'post') {
        postsCount++;
      } else if (postType === 'page') {
        pagesCount++;
      }
    }
    
    // Count media attachments
    for (const item of items) {
      if (getFirstElement(item['wp:post_type']) === 'attachment') {
        mediaCount++;
      }
    }
    
    // Write mapping file if not in dry-run mode
    if (!dryRun && Object.keys(mapping).length > 0) {
      const mappingFile = path.join(process.cwd(), 'mapping.json');
      fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2), 'utf-8');
    }
    
    // Output results
    console.log('✅ Conversion Complete\n');
    console.log(`Posts processed: ${postsCount}`);
    console.log(`Pages processed: ${pagesCount}`);
    console.log(`Media references: ${mediaCount}`);
    
    if (warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${warnings.length}`);
      warnings.slice(0, 5).forEach(w => console.log(`  - ${w}`));
      if (warnings.length > 5) {
        console.log(`  ... and ${warnings.length - 5} more`);
      }
    }
    
    if (!dryRun) {
      console.log(`\n📁 Output: ${postsDir}`);
      if (Object.keys(mapping).length > 0) {
        console.log(`📋 Mapping: mapping.json (for redirects)`);
      }
    } else {
      console.log(`\n💡 Run without --dry-run to write files to ${postsDir}`);
    }
    
  } catch (error) {
    console.error('Error converting WXR file:', error.message);
    process.exit(1);
  }
}

// Run conversion
convertWXR();
