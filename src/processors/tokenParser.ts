import { FigmaFileResponse, FigmaStylesResponse, FigmaVariablesResponse } from '../services/figma-api';

export interface DesignTokens {
  color: { [key: string]: string };
  typography: { [key: string]: any };
  spacing: { [key: string]: number };
  effects: { [key: string]: any };
  borderRadius: { [key: string]: number };
  strokeWeight: { [key: string]: number };
}

export class TokenParser {
      parseTokens(fileData: FigmaFileResponse, stylesData: FigmaStylesResponse, variablesData: FigmaVariablesResponse): DesignTokens {
    console.log('🎨 Extracting design tokens from published styles and variables...');

    const tokens: DesignTokens = {
      color: this.extractColorsFromVariables(variablesData, fileData, stylesData),
      typography: this.extractTypographyFromVariables(variablesData, fileData, stylesData),
      spacing: this.extractSpacingFromVariables(variablesData),
      effects: this.extractEffectsFromStyles(fileData, stylesData),
      borderRadius: this.extractBorderRadiusFromVariables(variablesData),
      strokeWeight: this.extractStrokeWeightsFromVariables(variablesData)
    };

    console.log('✅ Design system extraction complete');
    return tokens;
  }

  private extractColorsFromStyles(fileData: FigmaFileResponse, stylesData: FigmaStylesResponse): { [key: string]: string } {
    const colors: { [key: string]: string } = {};

    // Extract colors from published fill styles (primary source of truth)
    const fillStyles = stylesData.meta.styles.filter(style => style.style_type === 'FILL');

    if (fillStyles.length > 0) {
      console.log(`🎨 Found ${fillStyles.length} published color styles`);

      for (const style of fillStyles) {
        const hierarchicalName = this.preserveDesignHierarchy(style.name);
        const colorValue = this.extractColorFromStyle(style, fileData);

        if (colorValue) {
          colors[hierarchicalName] = colorValue;
        }
      }
    }

    // Extract colors from Variables (if available in file)
    // This is handled by the main extractColorsFromVariables method now
    // const variableColors = this.extractColorsFromVariables(fileData);
    // Object.assign(colors, variableColors);

    console.log(`📊 Extracted ${Object.keys(colors).length} color tokens from design system`);
    return Object.keys(colors).length > 0 ? colors : this.getFallbackColors();
  }

    private extractColorsFromVariables(variablesData: FigmaVariablesResponse, fileData: FigmaFileResponse, stylesData: FigmaStylesResponse): { [key: string]: string } {
    const colors: { [key: string]: string } = {};

    // Extract colors from Variables API (primary source of truth)
    if (variablesData.meta.variables) {
      console.log(`🎨 Processing ${Object.keys(variablesData.meta.variables).length} variables for colors...`);

      Object.entries(variablesData.meta.variables).forEach(([variableId, variable]) => {
        if (variable.resolvedType === 'COLOR') {
          const hierarchicalName = this.preserveDesignHierarchy(variable.name);
          const colorValue = this.extractColorFromVariable(variable, variablesData);

          if (colorValue) {
            colors[hierarchicalName] = colorValue;
            console.log(`✓ Found color variable: ${variable.name} = ${colorValue}`);
          }
        }
      });
    }

    // Fallback to published styles if no variables found
    if (Object.keys(colors).length === 0) {
      console.log('📎 No color variables found, falling back to published styles...');
      const fallbackColors = this.extractColorsFromStyles(fileData, stylesData);
      return Object.keys(fallbackColors).length > 0 ? fallbackColors : this.getFallbackColors();
    }

    console.log(`📊 Extracted ${Object.keys(colors).length} color tokens from variables`);
    return colors;
  }

  private extractColorFromVariable(variable: any, variablesData: FigmaVariablesResponse): string | null {
    try {
      // Get the default mode from the variable collection
      const collection = variablesData.meta.variableCollections[variable.variableCollectionId];
      if (!collection) return null;

      const defaultModeId = collection.defaultModeId;
      const colorValue = variable.valuesByMode[defaultModeId];

      if (colorValue && typeof colorValue === 'object') {
        // Convert RGB values to hex
        if (colorValue.r !== undefined && colorValue.g !== undefined && colorValue.b !== undefined) {
          return this.rgbToHex({
            r: colorValue.r,
            g: colorValue.g,
            b: colorValue.b
          });
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not extract color from variable ${variable.name}`);
    }
    return null;
  }

  private extractColorFromStyle(style: any, fileData: FigmaFileResponse): string | null {
    // Try to find the actual color value from the styles object in fileData
    if (fileData.styles && fileData.styles[style.key]) {
      const styleData = fileData.styles[style.key];
      return this.extractColorValueFromStyleData(styleData);
    }

    // Fallback: try to infer from style name or return null
    return null;
  }

  private extractColorValueFromStyleData(styleData: any): string | null {
    try {
      if (styleData.fills && styleData.fills.length > 0) {
        const fill = styleData.fills[0];
        if (fill.type === 'SOLID' && fill.color) {
          return this.rgbToHex(fill.color);
        }
      }
    } catch (error) {
      // Silent fail for now
    }
    return null;
  }

  private preserveDesignHierarchy(styleName: string): string {
    // Preserve the designer's hierarchical naming
    return styleName
      .split('/')  // Handle "Primary/Blue/500" format
      .map(part => part.trim())
      .map(part => this.sanitizeTokenName(part))
      .join('-')
      .toLowerCase();
  }

  private traverseNodesForColors(node: any, colorCounts: { [color: string]: number }) {
    if (!node) return;

    // Extract fill colors
    if (node.fills && Array.isArray(node.fills)) {
      node.fills.forEach((fill: any) => {
        if (fill.type === 'SOLID' && fill.color) {
          const hexColor = this.rgbToHex(fill.color);
          colorCounts[hexColor] = (colorCounts[hexColor] || 0) + 1;
        }
      });
    }

    // Extract stroke colors
    if (node.strokes && Array.isArray(node.strokes)) {
      node.strokes.forEach((stroke: any) => {
        if (stroke.type === 'SOLID' && stroke.color) {
          const hexColor = this.rgbToHex(stroke.color);
          colorCounts[hexColor] = (colorCounts[hexColor] || 0) + 1;
        }
      });
    }

    // Recursively traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        this.traverseNodesForColors(child, colorCounts);
      });
    }
  }

  private rgbToHex(color: { r: number; g: number; b: number }): string {
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
  }

  private generateColorTokenName(color: string, index: number, count: number): string {
    // Try to generate semantic names based on color analysis
    const colorAnalysis = this.analyzeColor(color);
    if (colorAnalysis.name) {
      return colorAnalysis.name;
    }
    return `color-${index + 1}`;
  }

  private analyzeColor(hex: string): { name?: string; category: string } {
    const color = hex.toLowerCase();

    // Simple color categorization
    if (color.includes('ff0000') || color.includes('f00') || color.startsWith('#e') || color.startsWith('#d')) {
      return { name: 'red', category: 'error' };
    }
    if (color.includes('00ff00') || color.includes('0f0') || color.includes('green')) {
      return { name: 'green', category: 'success' };
    }
    if (color.includes('0000ff') || color.includes('00f') || color.includes('blue')) {
      return { name: 'blue', category: 'primary' };
    }
    if (color.includes('ffffff') || color === '#fff') {
      return { name: 'white', category: 'background' };
    }
    if (color.includes('000000') || color === '#000') {
      return { name: 'black', category: 'text' };
    }

    return { category: 'neutral' };
  }

  private getFallbackColors(): { [key: string]: string } {
    return {
      primary: '#007AFF',
      secondary: '#5AC8FA',
      accent: '#F43F5E',
      neutral: '#8E8E93'
    };
  }

  private extractTypographyFromStyles(fileData: FigmaFileResponse, stylesData: FigmaStylesResponse): { [key: string]: any } {
    const typography: { [key: string]: any } = {};

    // Extract typography from published text styles (primary source of truth)
    const textStyles = stylesData.meta.styles.filter(style => style.style_type === 'TEXT');

    if (textStyles.length > 0) {
      console.log(`📝 Found ${textStyles.length} published text styles`);

      for (const style of textStyles) {
        const hierarchicalName = this.preserveDesignHierarchy(style.name);
        const typographyProperties = this.extractTypographyFromStyle(style, fileData);

        if (typographyProperties) {
          typography[hierarchicalName] = {
            ...typographyProperties,
            name: style.name,
            description: style.description || ''
          };
        }
      }
    }

    // Extract typography from Variables (if available)
    // This is handled by the main extractTypographyFromVariables method now
    // const variableTypography = this.extractTypographyFromVariables(fileData);
    // Object.assign(typography, variableTypography);

    console.log(`📊 Extracted ${Object.keys(typography).length} typography tokens from design system`);
    return Object.keys(typography).length > 0 ? typography : this.getFallbackTypography();
  }

    private extractTypographyFromVariables(variablesData: FigmaVariablesResponse, fileData: FigmaFileResponse, stylesData: FigmaStylesResponse): { [key: string]: any } {
    const typography: { [key: string]: any } = {};

    // Extract typography from Variables API (currently limited in Figma)
    // Most typography variables are still handled via text styles

    // Fallback to published text styles
    console.log('📝 Typography variables not commonly available, using published text styles...');
    return this.extractTypographyFromStyles(fileData, stylesData);
  }

  private extractTypographyFromStyle(style: any, fileData: FigmaFileResponse): any | null {
    // Try to find the actual typography properties from the styles object in fileData
    if (fileData.styles && fileData.styles[style.key]) {
      const styleData = fileData.styles[style.key];
      return this.extractTypographyPropertiesFromStyleData(styleData);
    }

    return null;
  }

  private extractTypographyPropertiesFromStyleData(styleData: any): any | null {
    try {
      if (styleData.style) {
        const textStyle = styleData.style;
        return {
          fontSize: textStyle.fontSize || 16,
          fontWeight: textStyle.fontWeight || 400,
          lineHeight: textStyle.lineHeightPx ? textStyle.lineHeightPx / (textStyle.fontSize || 16) : (textStyle.lineHeightPercent ? textStyle.lineHeightPercent / 100 : 1.4),
          fontFamily: textStyle.fontFamily || 'Inter',
          letterSpacing: textStyle.letterSpacing || 0,
          textTransform: textStyle.textCase || 'none'
        };
      }
    } catch (error) {
      // Silent fail for now
    }
    return null;
  }

  private traverseNodesForTypography(node: any, textStyles: { [key: string]: any }) {
    if (!node) return;

    // Extract text properties from TEXT nodes
    if (node.type === 'TEXT' && node.style) {
      const style = node.style;
      const styleKey = this.generateTypographyKey(style);

      if (!textStyles[styleKey]) {
        textStyles[styleKey] = {
          fontSize: style.fontSize || 16,
          fontWeight: style.fontWeight || 400,
          lineHeight: style.lineHeightPx ? style.lineHeightPx / (style.fontSize || 16) : 1.4,
          fontFamily: style.fontFamily || 'Inter',
          letterSpacing: style.letterSpacing || 0
        };
      }
    }

    // Recursively traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        this.traverseNodesForTypography(child, textStyles);
      });
    }
  }

  private generateTypographyKey(style: any): string {
    const fontSize = style.fontSize || 16;
    const fontWeight = style.fontWeight || 400;

    // Generate semantic names based on size and weight
    if (fontSize >= 32) return fontWeight >= 600 ? 'heading-xl' : 'display-xl';
    if (fontSize >= 24) return fontWeight >= 600 ? 'heading-lg' : 'display-lg';
    if (fontSize >= 20) return fontWeight >= 600 ? 'heading-md' : 'display-md';
    if (fontSize >= 18) return fontWeight >= 600 ? 'heading-sm' : 'text-lg';
    if (fontSize >= 16) return fontWeight >= 600 ? 'text-bold' : 'text-base';
    if (fontSize >= 14) return 'text-sm';
    return 'text-xs';
  }

  private getFallbackTypography(): { [key: string]: any } {
    return {
      'heading-xl': {
        fontSize: 32,
        fontWeight: 700,
        lineHeight: 1.2
      },
      'heading-lg': {
        fontSize: 24,
        fontWeight: 600,
        lineHeight: 1.3
      },
      'body': {
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.5
      }
    };
  }

  private extractSpacing(fileData: FigmaFileResponse): { [key: string]: number } {
    const spacing: { [key: string]: number } = {};
    const spacingCounts: { [spacing: number]: number } = {};

    // Extract spacing from Auto Layout nodes
    this.traverseNodesForSpacing(fileData.document, spacingCounts);

    // Convert to tokens with semantic names
    Object.entries(spacingCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .forEach(([space, count], index) => {
        const tokenName = this.generateSpacingName(Number(space));
        spacing[tokenName] = Number(space);
      });

    console.log(`📊 Found ${Object.keys(spacing).length} spacing tokens`);
    return Object.keys(spacing).length > 0 ? spacing : this.getFallbackSpacing();
  }

  private traverseNodesForSpacing(node: any, spacingCounts: { [spacing: number]: number }) {
    if (!node) return;

    // Extract Auto Layout spacing
    if (node.layoutMode && node.itemSpacing && typeof node.itemSpacing === 'number') {
      spacingCounts[node.itemSpacing] = (spacingCounts[node.itemSpacing] || 0) + 1;
    }

    // Extract padding from Auto Layout
    if (node.paddingLeft && typeof node.paddingLeft === 'number') {
      spacingCounts[node.paddingLeft] = (spacingCounts[node.paddingLeft] || 0) + 1;
    }
    if (node.paddingTop && typeof node.paddingTop === 'number') {
      spacingCounts[node.paddingTop] = (spacingCounts[node.paddingTop] || 0) + 1;
    }

    // Recursively traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        this.traverseNodesForSpacing(child, spacingCounts);
      });
    }
  }

  private generateSpacingName(spacing: number): string {
    if (spacing === 0) return 'none';
    if (spacing <= 2) return 'xs';
    if (spacing <= 4) return 'sm';
    if (spacing <= 8) return 'md';
    if (spacing <= 12) return 'lg';
    if (spacing <= 16) return 'xl';
    if (spacing <= 24) return '2xl';
    if (spacing <= 32) return '3xl';
    if (spacing <= 48) return '4xl';
    return '5xl';
  }

  private getFallbackSpacing(): { [key: string]: number } {
    return {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32
    };
  }

  private extractEffectsFromStyles(fileData: FigmaFileResponse, stylesData: FigmaStylesResponse): { [key: string]: any } {
    const effects: { [key: string]: any } = {};

    // Extract effects from published effect styles (primary source of truth)
    const effectStyles = stylesData.meta.styles.filter(style => style.style_type === 'EFFECT');

    if (effectStyles.length > 0) {
      console.log(`✨ Found ${effectStyles.length} published effect styles`);

      for (const style of effectStyles) {
        const hierarchicalName = this.preserveDesignHierarchy(style.name);
        const effectProperties = this.extractEffectFromStyle(style, fileData);

        if (effectProperties) {
          effects[hierarchicalName] = {
            ...effectProperties,
            name: style.name,
            description: style.description || ''
          };
        }
      }
    }

    // Extract effects from Variables (if available)
    const variableEffects = this.extractEffectsFromVariables(fileData);
    Object.assign(effects, variableEffects);

    console.log(`📊 Extracted ${Object.keys(effects).length} effect tokens from design system`);
    return Object.keys(effects).length > 0 ? effects : this.getFallbackEffects();
  }

  private extractEffectsFromVariables(fileData: FigmaFileResponse): { [key: string]: any } {
    const effects: { [key: string]: any } = {};

    // Check if file has effect variables
    if (fileData.styles && typeof fileData.styles === 'object') {
      Object.entries(fileData.styles).forEach(([styleId, styleData]: [string, any]) => {
        if (styleData.styleType === 'EFFECT' && styleData.name) {
          const hierarchicalName = this.preserveDesignHierarchy(styleData.name);
          const effectProperties = this.extractEffectPropertiesFromStyleData(styleData);
          if (effectProperties) {
            effects[hierarchicalName] = effectProperties;
          }
        }
      });
    }

    return effects;
  }

  private extractEffectFromStyle(style: any, fileData: FigmaFileResponse): any | null {
    // Try to find the actual effect properties from the styles object in fileData
    if (fileData.styles && fileData.styles[style.key]) {
      const styleData = fileData.styles[style.key];
      return this.extractEffectPropertiesFromStyleData(styleData);
    }

    return null;
  }

  private extractEffectPropertiesFromStyleData(styleData: any): any | null {
    try {
      if (styleData.effects && styleData.effects.length > 0) {
        const effect = styleData.effects[0]; // Take the first effect
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
          return {
            type: effect.type.toLowerCase().replace('_', ''),
            x: effect.offset?.x || 0,
            y: effect.offset?.y || 0,
            blur: effect.radius || 0,
            spread: effect.spread || 0,
            color: effect.color ? this.rgbaToString(effect.color) : 'rgba(0, 0, 0, 0.1)'
          };
        }
      }
    } catch (error) {
      // Silent fail for now
    }
    return null;
  }

  private traverseNodesForEffects(node: any, effectsFound: Array<any>) {
    if (!node) return;

    // Extract effects
    if (node.effects && Array.isArray(node.effects)) {
      node.effects.forEach((effect: any) => {
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
          effectsFound.push({
            type: effect.type.toLowerCase().replace('_', ''),
            x: effect.offset?.x || 0,
            y: effect.offset?.y || 0,
            blur: effect.radius || 0,
            spread: effect.spread || 0,
            color: effect.color ? this.rgbaToString(effect.color) : 'rgba(0, 0, 0, 0.1)'
          });
        }
      });
    }

    // Recursively traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        this.traverseNodesForEffects(child, effectsFound);
      });
    }
  }

  private generateEffectName(effect: any, index: number): string {
    const blur = effect.blur || 0;
    if (blur <= 2) return `shadow-xs`;
    if (blur <= 4) return `shadow-sm`;
    if (blur <= 8) return `shadow-md`;
    if (blur <= 16) return `shadow-lg`;
    return `shadow-xl`;
  }

  private rgbaToString(color: { r: number; g: number; b: number; a?: number }): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color.a !== undefined ? color.a : 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  private getFallbackEffects(): { [key: string]: any } {
    return {
      'shadow-sm': {
        type: 'dropShadow',
        x: 0,
        y: 1,
        blur: 3,
        spread: 0,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      'shadow-lg': {
        type: 'dropShadow',
        x: 0,
        y: 4,
        blur: 6,
        spread: -1,
        color: 'rgba(0, 0, 0, 0.1)'
      }
    };
  }

  private extractBorderRadius(fileData: FigmaFileResponse): { [key: string]: number } {
    const borderRadius: { [key: string]: number } = {};
    const radiusCounts: { [radius: number]: number } = {};

    // Extract border radius from document nodes
    this.traverseNodesForBorderRadius(fileData.document, radiusCounts);

    // Convert to tokens
    Object.entries(radiusCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([radius, count], index) => {
        const tokenName = this.generateBorderRadiusName(Number(radius));
        borderRadius[tokenName] = Number(radius);
      });

    console.log(`📊 Found ${Object.keys(borderRadius).length} border radius tokens`);
    return Object.keys(borderRadius).length > 0 ? borderRadius : this.getFallbackBorderRadius();
  }

  private traverseNodesForBorderRadius(node: any, radiusCounts: { [radius: number]: number }) {
    if (!node) return;

    // Extract corner radius from rectangles and other shapes
    if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
      if (node.cornerRadius && typeof node.cornerRadius === 'number') {
        radiusCounts[node.cornerRadius] = (radiusCounts[node.cornerRadius] || 0) + 1;
      }

      // Handle individual corner radius
      if (node.rectangleCornerRadii && Array.isArray(node.rectangleCornerRadii)) {
        node.rectangleCornerRadii.forEach((radius: number) => {
          if (typeof radius === 'number') {
            radiusCounts[radius] = (radiusCounts[radius] || 0) + 1;
          }
        });
      }
    }

    // Recursively traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        this.traverseNodesForBorderRadius(child, radiusCounts);
      });
    }
  }

  private generateBorderRadiusName(radius: number): string {
    if (radius === 0) return 'none';
    if (radius <= 2) return 'sm';
    if (radius <= 4) return 'md';
    if (radius <= 8) return 'lg';
    if (radius <= 12) return 'xl';
    if (radius <= 16) return '2xl';
    if (radius >= 9999 || radius >= 1000) return 'full';
    return '3xl';
  }

  private getFallbackBorderRadius(): { [key: string]: number } {
    return {
      none: 0,
      sm: 2,
      md: 4,
      lg: 8,
      xl: 12,
      full: 9999
    };
  }

  private extractStrokeWeights(fileData: FigmaFileResponse): { [key: string]: number } {
    const strokeWeights: { [key: string]: number } = {};
    const weightCounts: { [weight: number]: number } = {};

    // Extract stroke weights from document nodes
    this.traverseNodesForStrokes(fileData.document, weightCounts);

    // Convert to tokens
    Object.entries(weightCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([weight, count], index) => {
        const tokenName = this.generateStrokeWeightName(Number(weight));
        strokeWeights[tokenName] = Number(weight);
      });

    console.log(`📊 Found ${Object.keys(strokeWeights).length} stroke weight tokens`);
    return Object.keys(strokeWeights).length > 0 ? strokeWeights : this.getFallbackStrokeWeights();
  }

  private traverseNodesForStrokes(node: any, weightCounts: { [weight: number]: number }) {
    if (!node) return;

    // Extract stroke weights
    if (node.strokeWeight && typeof node.strokeWeight === 'number') {
      weightCounts[node.strokeWeight] = (weightCounts[node.strokeWeight] || 0) + 1;
    }

    // Recursively traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        this.traverseNodesForStrokes(child, weightCounts);
      });
    }
  }

  private generateStrokeWeightName(weight: number): string {
    if (weight <= 1) return 'thin';
    if (weight <= 2) return 'normal';
    if (weight <= 4) return 'medium';
    if (weight <= 6) return 'thick';
    return 'extra-thick';
  }

  private getFallbackStrokeWeights(): { [key: string]: number } {
    return {
      thin: 1,
      normal: 2,
      thick: 4
    };
  }

    private extractSpacingFromVariables(variablesData: FigmaVariablesResponse): { [key: string]: number } {
    const spacing: { [key: string]: number } = {};

    // Extract spacing from Variables API
    if (variablesData.meta.variables) {
      Object.entries(variablesData.meta.variables).forEach(([variableId, variable]) => {
        if (variable.resolvedType === 'FLOAT' && variable.name.toLowerCase().includes('spacing')) {
          const hierarchicalName = this.preserveDesignHierarchy(variable.name);
          const spacingValue = this.extractNumberFromVariable(variable, variablesData);

          if (spacingValue !== null) {
            spacing[hierarchicalName] = spacingValue;
          }
        }
      });
    }

    console.log(`📊 Extracted ${Object.keys(spacing).length} spacing tokens from variables`);
    return Object.keys(spacing).length > 0 ? spacing : this.getFallbackSpacing();
  }

  private extractBorderRadiusFromVariables(variablesData: FigmaVariablesResponse): { [key: string]: number } {
    const borderRadius: { [key: string]: number } = {};

    // Extract border radius from Variables API
    if (variablesData.meta.variables) {
      Object.entries(variablesData.meta.variables).forEach(([variableId, variable]) => {
        if (variable.resolvedType === 'FLOAT' && (variable.name.toLowerCase().includes('radius') || variable.name.toLowerCase().includes('border'))) {
          const hierarchicalName = this.preserveDesignHierarchy(variable.name);
          const radiusValue = this.extractNumberFromVariable(variable, variablesData);

          if (radiusValue !== null) {
            borderRadius[hierarchicalName] = radiusValue;
          }
        }
      });
    }

    console.log(`📊 Extracted ${Object.keys(borderRadius).length} border radius tokens from variables`);
    return Object.keys(borderRadius).length > 0 ? borderRadius : this.getFallbackBorderRadius();
  }

  private extractStrokeWeightsFromVariables(variablesData: FigmaVariablesResponse): { [key: string]: number } {
    const strokeWeights: { [key: string]: number } = {};

    // Extract stroke weights from Variables API
    if (variablesData.meta.variables) {
      Object.entries(variablesData.meta.variables).forEach(([variableId, variable]) => {
        if (variable.resolvedType === 'FLOAT' && (variable.name.toLowerCase().includes('stroke') || variable.name.toLowerCase().includes('weight'))) {
          const hierarchicalName = this.preserveDesignHierarchy(variable.name);
          const strokeValue = this.extractNumberFromVariable(variable, variablesData);

          if (strokeValue !== null) {
            strokeWeights[hierarchicalName] = strokeValue;
          }
        }
      });
    }

    console.log(`📊 Extracted ${Object.keys(strokeWeights).length} stroke weight tokens from variables`);
    return Object.keys(strokeWeights).length > 0 ? strokeWeights : this.getFallbackStrokeWeights();
  }

  private extractNumberFromVariable(variable: any, variablesData: FigmaVariablesResponse): number | null {
    try {
      const collection = variablesData.meta.variableCollections[variable.variableCollectionId];
      if (!collection) return null;

      const defaultModeId = collection.defaultModeId;
      const value = variable.valuesByMode[defaultModeId];

      if (typeof value === 'number') {
        return value;
      }
    } catch (error) {
      console.log(`⚠️  Could not extract number from variable ${variable.name}`);
    }
    return null;
  }

  // Utility methods
  private sanitizeTokenName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
