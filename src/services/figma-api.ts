import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';

export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: any;
  components: { [key: string]: any };
  componentSets: { [key: string]: any };
  schemaVersion: number;
  styles: { [key: string]: any };
}

export interface FigmaStylesResponse {
  meta: {
    styles: Array<{
      key: string;
      file_key: string;
      node_id: string;
      style_type: string;
      thumbnail_url: string;
      name: string;
      description: string;
      created_at: string;
      updated_at: string;
    }>;
  };
}

export interface FigmaComponentsResponse {
  meta: {
    components: Array<{
      key: string;
      file_key: string;
      node_id: string;
      thumbnail_url: string;
      name: string;
      description: string;
      created_at: string;
      updated_at: string;
    }>;
  };
}

export interface FigmaVariablesResponse {
  meta: {
    variables: { [key: string]: FigmaVariable };
    variableCollections: { [key: string]: FigmaVariableCollection };
  };
}

export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: string;
  description: string;
  hiddenFromPublishing: boolean;
  scopes: string[];
  codeSyntax: { [key: string]: string };
  valuesByMode: { [key: string]: any };
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{
    modeId: string;
    name: string;
  }>;
  defaultModeId: string;
  remote: boolean;
  hiddenFromPublishing: boolean;
}

export class FigmaApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.figmaApiBaseUrl,
      headers: {
        'X-Figma-Token': config.figmaApiToken,
        'Content-Type': 'application/json'
      }
    });
  }

  async getFile(fileKey: string): Promise<FigmaFileResponse> {
    try {
      const response: AxiosResponse<FigmaFileResponse> = await this.client.get(`/files/${fileKey}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Figma file: ${error}`);
    }
  }

  async getFileStyles(fileKey: string): Promise<FigmaStylesResponse> {
    try {
      const response: AxiosResponse<FigmaStylesResponse> = await this.client.get(`/files/${fileKey}/styles`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Figma file styles: ${error}`);
    }
  }

  async getFileComponents(fileKey: string): Promise<FigmaComponentsResponse> {
    try {
      const response: AxiosResponse<FigmaComponentsResponse> = await this.client.get(`/files/${fileKey}/components`);

      // Console log the response for debugging
      console.log('🔍 Raw components API response:');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));

      if (response.data.meta && response.data.meta.components) {
        console.log(`📦 Found ${response.data.meta.components.length} components via API`);
        response.data.meta.components.forEach((comp, index) => {
          console.log(`  ${index + 1}. ${comp.name} (${comp.key}) - Node ID: ${comp.node_id}`);
        });
      }

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Figma file components: ${error}`);
    }
  }

  async getLocalVariables(fileKey: string): Promise<FigmaVariablesResponse> {
    try {
      const response: AxiosResponse<FigmaVariablesResponse> = await this.client.get(`/files/${fileKey}/variables/local`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Figma local variables: ${error}`);
    }
  }
}
