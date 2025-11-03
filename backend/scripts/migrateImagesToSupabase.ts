/**
 * Migrate Local Images to Supabase Storage
 *
 * Uploads all images from backend/uploads/ to Supabase Storage
 * and optionally updates article content URLs.
 *
 * Usage:
 *   ts-node scripts/migrateImagesToSupabase.ts
 *
 * What it does:
 * 1. Uploads all files from backend/uploads/ to Supabase Storage
 * 2. Prints old → new URL mappings
 * 3. Optionally updates article content with new URLs
 */

import { supabase } from '../src/supabaseClient';
import fs from 'fs';
import path from 'path';
import Database from '../src/database';

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const BUCKET_NAME = 'article-images';

interface UploadResult {
  localFile: string;
  oldUrl: string;
  newUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Upload single file to Supabase Storage
 */
async function uploadFile(filename: string): Promise<UploadResult> {
  const localPath = path.join(UPLOADS_DIR, filename);
  const remotePath = `articles/${filename}`;
  const oldUrl = `/uploads/${filename}`;

  try {
    // Read file
    const fileBuffer = fs.readFileSync(localPath);
    const mimeType = getMimeType(filename);

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(remotePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false // Don't overwrite if exists
      });

    if (error) {
      // If file already exists, that's okay - get the URL anyway
      if (error.message.includes('already exists')) {
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(remotePath);

        return {
          localFile: filename,
          oldUrl,
          newUrl: publicUrlData.publicUrl,
          success: true,
          error: 'File already exists (using existing)'
        };
      }

      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(remotePath);

    return {
      localFile: filename,
      oldUrl,
      newUrl: publicUrlData.publicUrl,
      success: true
    };
  } catch (error: any) {
    return {
      localFile: filename,
      oldUrl,
      newUrl: '',
      success: false,
      error: error.message
    };
  }
}

/**
 * Update article content URLs
 */
async function updateArticleUrls(urlMappings: Map<string, string>): Promise<void> {
  const db = new Database();

  try {
    const articles = await db.getAllArticles();
    let updatedCount = 0;

    for (const article of articles) {
      let updatedContent = article.content;
      let hasChanges = false;

      // Replace each old URL with new URL
      for (const [oldUrl, newUrl] of urlMappings.entries()) {
        if (updatedContent.includes(oldUrl)) {
          updatedContent = updatedContent.split(oldUrl).join(newUrl);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await db.updateArticle(article.id, {
          content: updatedContent,
          updatedAt: new Date().toISOString()
        });
        updatedCount++;
        console.log(`  ✓ Updated article ${article.id}: "${article.title}"`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} articles with new image URLs`);
    db.close();
  } catch (error) {
    console.error('Error updating article URLs:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrateImages() {
  console.log('📦 Starting image migration to Supabase Storage...\n');

  // Check if uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('ℹ️  No uploads directory found. Nothing to migrate.');
    return;
  }

  // Get all files in uploads directory
  const files = fs.readdirSync(UPLOADS_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
  });

  if (files.length === 0) {
    console.log('ℹ️  No image files found in uploads directory.');
    return;
  }

  console.log(`Found ${files.length} images to migrate\n`);

  // Upload all files
  const results: UploadResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[${i + 1}/${files.length}] Uploading ${file}...`);
    const result = await uploadFile(file);
    results.push(result);

    if (result.success) {
      console.log(`  ✅ Success: ${result.newUrl}`);
      if (result.error) console.log(`     ${result.error}`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
  }

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n📊 Migration Summary:`);
  console.log(`  ✅ Successful: ${successful.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed uploads:');
    failed.forEach(f => console.log(`  - ${f.localFile}: ${f.error}`));
  }

  // Ask if user wants to update article URLs
  if (successful.length > 0) {
    console.log('\n📝 URL Mappings:');
    const urlMappings = new Map<string, string>();
    successful.forEach(r => {
      console.log(`  ${r.oldUrl} → ${r.newUrl}`);
      urlMappings.set(r.oldUrl, r.newUrl);
    });

    // Update article content
    console.log('\n🔄 Updating article content URLs...');
    await updateArticleUrls(urlMappings);

    console.log('\n✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Verify images load correctly in your articles');
    console.log('2. Test uploading new images via TinyMCE');
    console.log('3. Once confirmed, you can delete backend/uploads/ directory');
  }
}

// Run migration
migrateImages().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
