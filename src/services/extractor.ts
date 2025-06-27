import * as fs from 'fs/promises';
import * as path from 'path';
import { FigmaApiService, FigmaVariablesResponse } from './figma-api';
import { TokenParser, DesignTokens } from '../processors/tokenParser';
import { ComponentParser, ComponentSpecs } from '../processors/componentParser';

export class ExtractorService {
  private figmaApi: FigmaApiService;
  private tokenParser: TokenParser;
  private componentParser: ComponentParser;

  constructor() {
    this.figmaApi = new FigmaApiService();
    this.tokenParser = new TokenParser();
    this.componentParser = new ComponentParser();
  }

  async extractFromFigma(fileKey: string, outputDir: string = './output'): Promise<void> {
    try {
      console.log('🔄 Fetching Figma file data...');

      // Fetch data from Figma API
      const [fileData, stylesData] = await Promise.all([
        this.figmaApi.getFile(fileKey),
        this.figmaApi.getFileStyles(fileKey)
      ]);

      // Try to fetch file-specific components, but make it optional (may fail with 404 for some files)
      let componentsData;
      try {
        componentsData = await this.figmaApi.getFileComponents(fileKey);
      } catch (error) {
        console.log('⚠️  Could not fetch file components (using document components instead)');
        componentsData = { meta: { components: [] } };
      }

      // Try to fetch local variables
      let variablesData;
      try {
        variablesData = await this.figmaApi.getLocalVariables(fileKey);
        console.log(`🔧 Found ${Object.keys(variablesData.meta.variables || {}).length} local variables`);
        console.log(`📚 Found ${Object.keys(variablesData.meta.variableCollections || {}).length} variable collections`);
      } catch (error) {
        console.log('⚠️  Could not fetch local variables (may not be available)');
        variablesData = { meta: { variables: {}, variableCollections: {} } };
      }

      console.log('✅ Successfully fetched Figma data');
      console.log(`📄 File: ${fileData.name}`);
      console.log(`🎨 Styles found: ${stylesData.meta.styles.length}`);
      console.log(`🧩 Components found: ${componentsData.meta.components.length}`);

      // Debug: Let's see what data structure we have for variables
      console.log('🔍 Debugging file data structure...');
      console.log('Available top-level properties:', Object.keys(fileData));

      if (fileData.styles) {
        console.log('📋 Styles object keys:', Object.keys(fileData.styles));
      }

      // Check if there are any other properties that might contain variables
      ['variables', 'localVariables', 'variableCollections'].forEach(prop => {
        if ((fileData as any)[prop]) {
          console.log(`🔧 Found ${prop}:`, typeof (fileData as any)[prop], Object.keys((fileData as any)[prop] || {}));
        }
      });

      // Debug components data in file
      console.log('🧩 Debugging components in file data:');
      if (fileData.components && typeof fileData.components === 'object') {
        const componentKeys = Object.keys(fileData.components);
        console.log(`📦 Found ${componentKeys.length} components in file data:`, componentKeys);

        // Show first few components for debugging
        componentKeys.slice(0, 3).forEach(key => {
          const comp = fileData.components[key];
          console.log(`  - Component ${key}:`, {
            name: comp.name,
            type: comp.type,
            description: comp.description || 'No description'
          });
        });
      }

      if (fileData.componentSets && typeof fileData.componentSets === 'object') {
        const componentSetKeys = Object.keys(fileData.componentSets);
        console.log(`📚 Found ${componentSetKeys.length} component sets in file data:`, componentSetKeys);
      }

            // Parse design tokens
      console.log('🔄 Parsing design tokens...');
      const designTokens: DesignTokens = this.tokenParser.parseTokens(fileData, stylesData, variablesData);

      // Parse component specs
      console.log('🔄 Parsing component specifications...');
      const componentSpecs: ComponentSpecs = this.componentParser.parseComponents(fileData, componentsData);

      // Ensure output directory exists
      await this.ensureDirectoryExists(outputDir);

      // Write JSON files
      await this.writeJsonFile(path.join(outputDir, 'design-tokens.json'), designTokens);
      await this.writeJsonFile(path.join(outputDir, 'component-specs.json'), componentSpecs);

      console.log('✅ Successfully generated files:');
      console.log(`  📁 ${path.join(outputDir, 'design-tokens.json')}`);
      console.log(`  📁 ${path.join(outputDir, 'component-specs.json')}`);

    } catch (error) {
      console.error('❌ Error during extraction:', error);
      throw error;
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async writeJsonFile(filePath: string, data: any): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonContent, 'utf-8');
  }
}
