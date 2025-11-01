#!/usr/bin/env node

// Quick script to check if Sanity is configured correctly

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking Sanity Setup...\n');

// Check for .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasProjectId = envContent.includes('NEXT_PUBLIC_SANITY_PROJECT_ID');
  const hasDataset = envContent.includes('NEXT_PUBLIC_SANITY_DATASET');
  
  if (hasProjectId && hasDataset) {
    const projectIdMatch = envContent.match(/NEXT_PUBLIC_SANITY_PROJECT_ID=(.+)/);
    const projectId = projectIdMatch ? projectIdMatch[1].trim() : 'not found';
    
    console.log('✅ .env.local file found');
    if (projectId !== 'not found' && projectId !== '') {
      console.log(`✅ Project ID is set: ${projectId.substring(0, 8)}...`);
    } else {
      console.log('❌ Project ID not set or empty');
    }
  } else {
    console.log('❌ .env.local exists but missing required variables');
  }
} else {
  console.log('❌ .env.local file not found');
  console.log('\n📝 Create .env.local with:');
  console.log('   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id');
  console.log('   NEXT_PUBLIC_SANITY_DATASET=production');
}

// Check schema files
const schemaPath = path.join(process.cwd(), 'sanity', 'schema', 'article.ts');
if (fs.existsSync(schemaPath)) {
  console.log('✅ Article schema file found');
} else {
  console.log('❌ Article schema file not found');
}

console.log('\n📖 See SANITY_SETUP_GUIDE.md for detailed instructions');
console.log('\nNext steps:');
console.log('1. Create a Sanity project at https://sanity.io/manage');
console.log('2. Copy your Project ID');
console.log('3. Create .env.local with your Project ID');
console.log('4. Run: sanity login && sanity init (if using CLI)');
console.log('5. Deploy schema: sanity schema deploy');

