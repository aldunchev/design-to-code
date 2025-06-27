import * as dotenv from 'dotenv';

dotenv.config();

export interface Config {
  figmaApiToken: string;
  figmaApiBaseUrl: string;
}

export const config: Config = {
  figmaApiToken: process.env.FIGMA_API_TOKEN || '',
  figmaApiBaseUrl: 'https://api.figma.com/v1'
};

export function validateConfig(): void {
  if (!config.figmaApiToken) {
    throw new Error('FIGMA_API_TOKEN environment variable is required');
  }
}
