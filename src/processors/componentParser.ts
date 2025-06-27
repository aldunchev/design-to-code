import { FigmaFileResponse, FigmaComponentsResponse } from '../services/figma-api';

export interface ComponentSpec {
  id: string;
  name: string;
  type: string;
  properties: { [key: string]: any };
  variants?: { [key: string]: any };
  description?: string;
}

export interface ComponentSpecs {
  components: ComponentSpec[];
  version: string;
  lastModified: string;
}

export class ComponentParser {
  parseComponents(fileData: FigmaFileResponse, componentsData: FigmaComponentsResponse): ComponentSpecs {
    const components = this.extractComponents(fileData, componentsData);

    return {
      components,
      version: fileData.version,
      lastModified: fileData.lastModified
    };
  }

  private extractComponents(fileData: FigmaFileResponse, componentsData: FigmaComponentsResponse): ComponentSpec[] {
    const extractedComponents: ComponentSpec[] = [];

    // PRIMARY: Extract components from file data (local components)
    if (fileData.components && typeof fileData.components === 'object') {
      const componentKeys = Object.keys(fileData.components);
      console.log(`🔧 Extracting ${componentKeys.length} components from file data...`);

      for (const componentId of componentKeys) {
        const component = fileData.components[componentId];
        const componentSpec = this.analyzeComponentFromFileData(componentId, component, fileData);
        if (componentSpec) {
          extractedComponents.push(componentSpec);
        }
      }
    }

    // Extract component sets (variants) from file data
    if (fileData.componentSets && typeof fileData.componentSets === 'object') {
      const componentSetKeys = Object.keys(fileData.componentSets);
      console.log(`📚 Extracting ${componentSetKeys.length} component sets with variants...`);

      for (const componentSetId of componentSetKeys) {
        const componentSet = fileData.componentSets[componentSetId];
        const componentSetSpec = this.analyzeComponentSetFromFileData(componentSetId, componentSet, fileData);
        if (componentSetSpec) {
          extractedComponents.push(componentSetSpec);
        }
      }
    }

    // SECONDARY: Extract components from published API data if available
    if (componentsData.meta.components && componentsData.meta.components.length > 0) {
      console.log(`📦 Adding ${componentsData.meta.components.length} published components from API...`);
      for (const component of componentsData.meta.components) {
        extractedComponents.push({
          id: component.key,
          name: component.name,
          type: 'published-component',
          properties: {
            nodeId: component.node_id,
            fileKey: component.file_key,
            thumbnailUrl: component.thumbnail_url,
            createdAt: component.created_at,
            updatedAt: component.updated_at
          },
          description: component.description || `Published component: ${component.name}`
        });
      }
    }

    // TERTIARY: Extract components from document tree if needed
    if (extractedComponents.length === 0 && fileData.document) {
      console.log(`🔍 Searching document tree for components...`);
      const documentComponents = this.extractComponentsFromDocument(fileData.document);
      extractedComponents.push(...documentComponents);
    }

    // FALLBACK: Sample data only if absolutely no components found
    if (extractedComponents.length === 0) {
      console.log(`⚠️  No components found, using sample data...`);
      extractedComponents.push(...this.getFallbackComponents());
    }

    console.log(`✅ Successfully extracted ${extractedComponents.length} total components`);
    return extractedComponents;
  }

  private extractComponentsFromDocument(document: any): ComponentSpec[] {
    const components: ComponentSpec[] = [];

    // Recursively search for components in the document tree
    const searchForComponents = (node: any) => {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
          id: node.id,
          name: node.name,
          type: node.type.toLowerCase(),
          properties: {
            nodeType: node.type,
            visible: node.visible !== false,
            absoluteBoundingBox: node.absoluteBoundingBox
          },
          description: `Component extracted from file: ${node.name}`
        });
      }

      // Recursively search children
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          searchForComponents(child);
        }
      }
    };

    searchForComponents(document);
    return components;
  }

      private analyzeComponentFromFileData(componentId: string, component: any, fileData: FigmaFileResponse): ComponentSpec | null {
    try {
      console.log(`🔍 Analyzing component: ${component.name || componentId}`);

      // Find the actual component node in the document tree
      const componentNode = this.findComponentNodeInDocument(componentId, fileData.document);

      let properties: { [key: string]: any } = {};

      if (componentNode) {
        // Extract properties from the actual node in the document
        properties = this.extractPropertiesFromComponent(componentNode, fileData);
        console.log(`✓ Found component node for ${component.name}, extracted ${Object.keys(properties).length} properties`);
      } else {
        // Fallback to basic metadata
        properties = {
          componentKey: component.key,
          remote: component.remote,
          documentationLinks: component.documentationLinks || []
        };
        console.log(`⚠️  Component node not found for ${component.name}, using metadata only`);
      }

      return {
        id: componentId,
        name: component.name || `Component ${componentId}`,
        type: 'component',
        properties,
        description: component.description || `Local component: ${component.name || componentId}`
      };
    } catch (error) {
      console.log(`⚠️  Error analyzing component ${componentId}:`, error);
      return null;
    }
  }

    private analyzeComponentSetFromFileData(componentSetId: string, componentSet: any, fileData: FigmaFileResponse): ComponentSpec | null {
    try {
      console.log(`🔍 Analyzing component set: ${componentSet.name || componentSetId}`);

      // Find the actual component set node in the document tree
      const componentSetNode = this.findComponentNodeInDocument(componentSetId, fileData.document);

      let properties: { [key: string]: any } = {};
      let variants: { [key: string]: any } = {};

      if (componentSetNode) {
        // Extract properties from the actual node in the document
        properties = this.extractPropertiesFromComponent(componentSetNode, fileData);
        variants = this.extractVariantsFromComponentSet(componentSetNode, fileData);
        console.log(`✓ Found component set node for ${componentSet.name}, extracted ${Object.keys(properties).length} properties and ${Object.keys(variants).length} variants`);
      } else {
        // Fallback to basic metadata
        properties = {
          componentKey: componentSet.key,
          remote: componentSet.remote,
          documentationLinks: componentSet.documentationLinks || []
        };
        console.log(`⚠️  Component set node not found for ${componentSet.name}, using metadata only`);
      }

      return {
        id: componentSetId,
        name: componentSet.name || `ComponentSet ${componentSetId}`,
        type: 'component-set',
        properties,
        variants,
        description: componentSet.description || `Component set with variants: ${componentSet.name || componentSetId}`
      };
    } catch (error) {
      console.log(`⚠️  Error analyzing component set ${componentSetId}:`, error);
      return null;
    }
  }

  private extractPropertiesFromComponent(component: any, fileData: FigmaFileResponse): { [key: string]: any } {
    const properties: { [key: string]: any } = {};

    // Basic component metadata
    if (component.type) properties.nodeType = component.type;
    if (component.visible !== undefined) properties.visible = component.visible;
    if (component.absoluteBoundingBox) {
      properties.width = component.absoluteBoundingBox.width;
      properties.height = component.absoluteBoundingBox.height;
    }

    // Layout properties
    if (component.layoutMode) properties.layoutMode = component.layoutMode;
    if (component.primaryAxisSizingMode) properties.primaryAxisSizingMode = component.primaryAxisSizingMode;
    if (component.counterAxisSizingMode) properties.counterAxisSizingMode = component.counterAxisSizingMode;
    if (component.itemSpacing !== undefined) properties.itemSpacing = component.itemSpacing;

    // Padding
    if (component.paddingLeft !== undefined) properties.paddingLeft = component.paddingLeft;
    if (component.paddingRight !== undefined) properties.paddingRight = component.paddingRight;
    if (component.paddingTop !== undefined) properties.paddingTop = component.paddingTop;
    if (component.paddingBottom !== undefined) properties.paddingBottom = component.paddingBottom;

    // Border radius
    if (component.cornerRadius !== undefined) properties.cornerRadius = component.cornerRadius;
    if (component.rectangleCornerRadii) properties.cornerRadii = component.rectangleCornerRadii;

    // Fill and stroke
    if (component.fills && component.fills.length > 0) {
      properties.fills = component.fills.map((fill: any) => ({
        type: fill.type,
        color: fill.color ? this.rgbToHex(fill.color) : undefined,
        opacity: fill.opacity
      }));
    }

    if (component.strokes && component.strokes.length > 0) {
      properties.strokes = component.strokes.map((stroke: any) => ({
        type: stroke.type,
        color: stroke.color ? this.rgbToHex(stroke.color) : undefined,
        opacity: stroke.opacity
      }));
    }

    if (component.strokeWeight !== undefined) properties.strokeWeight = component.strokeWeight;

    // Effects
    if (component.effects && component.effects.length > 0) {
      properties.effects = component.effects.map((effect: any) => ({
        type: effect.type,
        visible: effect.visible,
        radius: effect.radius,
        color: effect.color ? this.rgbaToString(effect.color) : undefined,
        offset: effect.offset
      }));
    }

    // Text properties (if it's a text component)
    if (component.style) {
      properties.textStyle = {
        fontFamily: component.style.fontFamily,
        fontSize: component.style.fontSize,
        fontWeight: component.style.fontWeight,
        lineHeight: component.style.lineHeightPx || component.style.lineHeightPercent,
        letterSpacing: component.style.letterSpacing,
        textCase: component.style.textCase
      };
    }

    return properties;
  }

  private extractVariantsFromComponentSet(componentSet: any, fileData: FigmaFileResponse): { [key: string]: any } {
    const variants: { [key: string]: any } = {};

    // Extract variant properties from component set
    if (componentSet.componentPropertyDefinitions) {
      Object.entries(componentSet.componentPropertyDefinitions).forEach(([propName, propDef]: [string, any]) => {
        variants[propName] = {
          type: propDef.type,
          defaultValue: propDef.defaultValue,
          variantOptions: propDef.variantOptions || []
        };
      });
    }

    return variants;
  }

  private rgbToHex(color: { r: number; g: number; b: number }): string {
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
  }

  private rgbaToString(color: { r: number; g: number; b: number; a?: number }): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color.a !== undefined ? color.a : 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  private getFallbackComponents(): ComponentSpec[] {
    return [
      {
        id: 'button-component',
        name: 'Button',
        type: 'component',
        properties: {
          variant: ['primary', 'secondary', 'outline'],
          size: ['sm', 'md', 'lg'],
          disabled: 'boolean',
          text: 'string'
        },
        description: 'Primary button component with multiple variants'
      },
      {
        id: 'input-component',
        name: 'Input',
        type: 'component',
        properties: {
          type: ['text', 'email', 'password'],
          placeholder: 'string',
          disabled: 'boolean',
          required: 'boolean'
        },
        description: 'Input field component'
      },
      {
        id: 'card-component',
        name: 'Card',
        type: 'component',
        properties: {
          elevation: ['none', 'sm', 'md', 'lg'],
          padding: ['sm', 'md', 'lg'],
          rounded: 'boolean'
        },
        description: 'Card container component'
      }
    ];
  }

    private findComponentNodeInDocument(componentId: string, document: any): any | null {
    // Recursively search for a node with the matching ID
    const searchForNode = (node: any): any | null => {
      if (node.id === componentId) {
        return node;
      }

      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const found = searchForNode(child);
          if (found) return found;
        }
      }

      return null;
    };

    return searchForNode(document);
  }

  private analyzeComponentNode(node: any): ComponentSpec | null {
    // This method is kept for document tree analysis if needed
    return null;
  }

  private extractVariants(node: any): { [key: string]: any } {
    // This method is kept for backward compatibility
    return {};
  }

  private extractProperties(node: any): { [key: string]: any } {
    // This method is kept for backward compatibility
    return {};
  }
}
