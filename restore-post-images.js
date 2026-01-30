#!/usr/bin/env node

/**
 * Restore Images to Blog Posts
 *
 * This script parses the WordPress WXR export to find image references
 * that were lost during migration, downloads any missing images,
 * and updates the markdown files with proper image syntax.
 *
 * Usage:
 *   node restore-post-images.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const WXR_FILE = path.join(__dirname, 'scripts', 'export.xml');
const POSTS_DIR = path.join(__dirname, 'src', 'content', 'posts');
const UPLOADS_DIR = path.join(__dirname, 'public', 'assets', 'uploads');

console.log('🖼️  Restore Post Images');
console.log('=======================\n');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No files will be modified\n');
}

// Helper function to get first array element (xml2js returns arrays)
function getFirstElement(arr) {
  return Array.isArray(arr) ? arr[0] : arr;
}

// Extract filename from WordPress URL
function getFilenameFromUrl(url) {
  const urlPath = new URL(url).pathname;
  return path.basename(urlPath);
}

// Check if we have the image locally (with or without size suffix)
// Returns the actual local filename if found, null otherwise
function findLocalImage(url) {
  const filename = getFilenameFromUrl(url);
  // Remove size suffixes like -768x1024
  const baseFilename = filename.replace(/-\d+x\d+(\.[^.]+)$/, '$1');
  // Get the name without extension for fuzzy matching
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(baseFilename, ext);

  // Try exact match first
  if (fs.existsSync(path.join(UPLOADS_DIR, filename))) {
    return filename;
  }
  // Try base filename (without size suffix)
  if (fs.existsSync(path.join(UPLOADS_DIR, baseFilename))) {
    return baseFilename;
  }
  // Try with -scaled suffix (WordPress uses this for large images)
  const scaledFilename = `${nameWithoutExt}-scaled${ext}`;
  if (fs.existsSync(path.join(UPLOADS_DIR, scaledFilename))) {
    return scaledFilename;
  }
  // Try fuzzy match - look for files starting with the base name
  const files = fs.readdirSync(UPLOADS_DIR);
  const match = files.find(f => f.startsWith(nameWithoutExt) && f.endsWith(ext));
  if (match) {
    return match;
  }
  return null;
}

// Map WordPress URL to local path, using the actual local filename if found
function wpUrlToLocalPath(url) {
  // First check if we have the file locally (possibly with different suffix)
  const localFilename = findLocalImage(url);
  if (localFilename) {
    return `/assets/uploads/${localFilename}`;
  }
  // Fall back to stripping size suffix
  const filename = getFilenameFromUrl(url);
  const baseFilename = filename.replace(/-\d+x\d+(\.[^.]+)$/, '$1');
  return `/assets/uploads/${baseFilename}`;
}

// Download a file from URL
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

// Convert HTML content to Markdown with proper image handling
function htmlToMarkdownWithImages(html) {
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

  // Handle WordPress audio shortcode
  text = text.replace(/\[audio\s+m4a="([^"]+)"\]\[\/audio\]/gi, (match, url) => {
    const localPath = wpUrlToLocalPath(url);
    return `<audio controls src="${localPath}"></audio>`;
  });

  // Handle linked images: <a href="..."><img src="..." /></a>
  text = text.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>\s*<img\s+[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*\/?>\s*<\/a>/gi,
    (match, linkUrl, imgSrc, alt) => {
      const localImgPath = wpUrlToLocalPath(imgSrc);
      // If the link points to a larger version of the image, link to local version
      if (linkUrl.includes('wp-content/uploads')) {
        const localLinkPath = wpUrlToLocalPath(linkUrl);
        return `[![${alt || ''}](${localImgPath})](${localLinkPath})`;
      }
      return `[![${alt || ''}](${localImgPath})](${linkUrl})`;
    });

  // Handle standalone images: <img src="..." />
  text = text.replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*\/?>/gi,
    (match, src, alt) => {
      const localPath = wpUrlToLocalPath(src);
      return `![${alt || ''}](${localPath})`;
    });

  // Also handle img tags where alt comes before src
  text = text.replace(/<img\s+[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*\/?>/gi,
    (match, alt, src) => {
      const localPath = wpUrlToLocalPath(src);
      return `![${alt || ''}](${localPath})`;
    });

  // Convert <p> tags
  text = text.replace(/<\/?p>/gi, '\n');

  // Convert <strong> and <b> tags to markdown
  text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');

  // Convert <em> and <i> tags to markdown
  text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i>(.*?)<\/i>/gi, '*$1*');

  // Convert <a> tags to markdown links (that aren't already converted)
  text = text.replace(/<a\s+(?:.*?\s+)?href=["']([^"']*?)["'](?:.*?)?>(.*?)<\/a>/gi, '[$2]($1)');

  // Convert headers
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');

  // Convert lists
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // Convert blockquotes
  text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
    return content.split('\n').map(line => `> ${line}`).join('\n');
  });

  // Convert code blocks
  text = text.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```');
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Remove any remaining HTML tags EXCEPT audio tags (which we want to keep)
  text = text.replace(/<(?!\/?audio\b)[^>]+>/g, '');

  // Clean up multiple newlines
  text = text.replace(/\n\n\n+/g, '\n\n');

  // Strip leading/trailing whitespace
  text = text.trim();

  return text;
}

// Extract all image URLs from HTML content
function extractImageUrls(html) {
  const urls = new Set();

  // Match img src attributes
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1].includes('wp-content/uploads')) {
      urls.add(match[1]);
    }
  }

  // Match linked images (the link href for full-size images)
  const linkImgRegex = /<a[^>]+href=["']([^"']+wp-content\/uploads[^"']+)["'][^>]*>\s*<img/gi;
  while ((match = linkImgRegex.exec(html)) !== null) {
    urls.add(match[1]);
  }

  // Match audio shortcode URLs
  const audioRegex = /\[audio\s+m4a="([^"]+)"\]/gi;
  while ((match = audioRegex.exec(html)) !== null) {
    urls.add(match[1]);
  }

  return Array.from(urls);
}

async function main() {
  // Check if WXR file exists
  if (!fs.existsSync(WXR_FILE)) {
    console.error(`Error: WXR file not found at ${WXR_FILE}`);
    process.exit(1);
  }

  // Parse WXR file
  console.log('📖 Parsing WXR export file...\n');
  const wxrContent = fs.readFileSync(WXR_FILE, 'utf-8');
  const parsed = await parseStringPromise(wxrContent);

  const channel = parsed.rss.channel[0];
  const items = channel.item || [];

  // Track statistics
  let postsProcessed = 0;
  let postsWithImages = 0;
  let imagesDownloaded = 0;
  let imagesSkipped = 0;
  const missingImages = [];

  // Process each post
  for (const item of items) {
    const postType = getFirstElement(item['wp:post_type'] || ['post']);
    const postStatus = getFirstElement(item['wp:status'] || ['publish']);

    // Only process published posts and pages
    if (postStatus !== 'publish' || (postType !== 'post' && postType !== 'page')) {
      continue;
    }

    const slug = getFirstElement(item['wp:post_name'] || ['']);
    const title = getFirstElement(item.title || ['Untitled']);
    const content = getFirstElement(item['content:encoded'] || ['']);

    // Skip if no content or no images
    if (!content || !content.includes('<img') && !content.includes('[audio')) {
      continue;
    }

    postsWithImages++;

    // Find the corresponding markdown file
    const mdFile = path.join(POSTS_DIR, `${slug}.md`);
    if (!fs.existsSync(mdFile)) {
      console.log(`⚠️  Markdown file not found for: ${slug}`);
      continue;
    }

    console.log(`\n📝 Processing: ${title}`);
    console.log(`   Slug: ${slug}`);

    // Extract image URLs from content
    const imageUrls = extractImageUrls(content);
    console.log(`   Found ${imageUrls.length} media file(s)`);

    // Download missing images
    for (const url of imageUrls) {
      const localFilename = findLocalImage(url);

      if (localFilename) {
        console.log(`   ✓ Already have: ${localFilename}`);
        imagesSkipped++;
      } else {
        const filename = getFilenameFromUrl(url);
        const destPath = path.join(UPLOADS_DIR, filename);

        if (dryRun) {
          console.log(`   📥 Would download: ${filename}`);
          imagesDownloaded++;
        } else {
          console.log(`   📥 Downloading: ${filename}`);
          try {
            await downloadFile(url, destPath);
            imagesDownloaded++;
          } catch (err) {
            console.log(`   ❌ Failed to download: ${filename} (${err.message})`);
            missingImages.push({ url, error: err.message });
          }
        }
      }
    }

    // Read current markdown file
    const mdContent = fs.readFileSync(mdFile, 'utf-8');

    // Split frontmatter and content
    const frontmatterMatch = mdContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      console.log(`   ⚠️  Could not parse frontmatter in ${slug}.md`);
      continue;
    }

    const frontmatter = frontmatterMatch[1];

    // Convert original HTML content to markdown with images
    const newContent = htmlToMarkdownWithImages(content);

    // Rebuild the file
    const newMdContent = `---\n${frontmatter}\n---\n\n${newContent}`;

    if (dryRun) {
      console.log(`   📄 Would update: ${slug}.md`);
      // Show a preview of the changes
      if (newContent.includes('![') || newContent.includes('<audio')) {
        console.log(`   Preview of media in content:`);
        const mediaLines = newContent.split('\n').filter(line =>
          line.includes('![') || line.includes('<audio')
        );
        mediaLines.forEach(line => console.log(`     ${line.substring(0, 80)}...`));
      }
    } else {
      fs.writeFileSync(mdFile, newMdContent, 'utf-8');
      console.log(`   ✓ Updated: ${slug}.md`);
    }

    postsProcessed++;
  }

  // Summary
  console.log('\n=============================');
  console.log('📊 Summary');
  console.log('=============================');
  console.log(`Posts with images: ${postsWithImages}`);
  console.log(`Posts processed: ${postsProcessed}`);
  console.log(`Images downloaded: ${imagesDownloaded}`);
  console.log(`Images already present: ${imagesSkipped}`);

  if (missingImages.length > 0) {
    console.log(`\n⚠️  Failed to download ${missingImages.length} image(s):`);
    missingImages.forEach(({ url, error }) => {
      console.log(`   - ${url}: ${error}`);
    });
  }

  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ Done!');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
