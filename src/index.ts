#!/usr/bin/env node

import { validateConfig } from './config';
import { ExtractorService } from './services/extractor';

async function main() {
  try {
    // Validate configuration
    validateConfig();

    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.log('🚀 Figma Design Token & Component Extractor');
      console.log('');
      console.log('Usage:');
      console.log('  npm run dev <figma-file-key> [output-directory]');
      console.log('');
      console.log('Examples:');
      console.log('  npm run dev abc123def456');
      console.log('  npm run dev abc123def456 ./my-tokens');
      console.log('');
      console.log('Environment variables required:');
      console.log('  FIGMA_API_TOKEN - Your Figma API token');
      console.log('');
      console.log('Get your Figma API token from:');
      console.log('  https://www.figma.com/developers/api#access-tokens');
      return;
    }

    const fileKey = args[0];
    const outputDir = args[1] || './output';

    if (!fileKey) {
      console.error('❌ Error: Figma file key is required');
      console.log('Usage: npm run dev <figma-file-key> [output-directory]');
      process.exit(1);
    }

    console.log('🚀 Starting Figma extraction...');
    console.log(`📄 File Key: ${fileKey}`);
    console.log(`📁 Output Directory: ${outputDir}`);
    console.log('');

    // Initialize and run extractor
    const extractor = new ExtractorService();
    await extractor.extractFromFigma(fileKey, outputDir);

    console.log('');
    console.log('🎉 Extraction completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main();
}
