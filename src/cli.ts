#!/usr/bin/env node

/**
 * Scell.io MCP Configuration CLI
 *
 * Generate MCP configuration for various clients
 */

import {
  generateClaudeDesktopConfig,
  generateCursorConfig,
  generateVSCodeConfig,
  generateConfigWithInstructions,
  getConfigPath,
  validateConfig,
} from './config/generator.js';
import type { ScellMcpConfig } from './types/index.js';

const VERSION = '1.1.0';

const HELP_TEXT = `
Scell.io MCP Configuration Generator v${VERSION}

Usage:
  scell-mcp <command> <api-key> [options]

Commands:
  claude <api-key>     Generate Claude Desktop configuration
  cursor <api-key>     Generate Cursor IDE configuration
  vscode <api-key>     Generate VS Code configuration
  generic <api-key>    Generate generic MCP configuration

Options:
  --base-url <url>     Custom API base URL (default: https://api.scell.io/api)
  --env <environment>  Environment: production, staging, development
  --sandbox            Use sandbox mode (appends /sandbox to base URL)
  --sandbox            Use sandbox mode (appends /sandbox to base URL)
  --output <file>      Write configuration to file instead of stdout
  --help, -h           Show this help message
  --version, -v        Show version number

Examples:
  # Generate Claude Desktop config
  scell-mcp claude sk_live_your_api_key_here

  # Generate Cursor config with custom base URL
  scell-mcp cursor sk_live_your_api_key_here --base-url https://api.staging.scell.io/api

  # Generate config and save to file
  scell-mcp claude sk_live_your_api_key_here --output ~/.config/Claude/claude_desktop_config.json

Environment Variables:
  SCELL_API_KEY        Default API key (used if not provided as argument)
  SCELL_BASE_URL       Default base URL

For more information, visit: https://docs.scell.io
`;

interface CliOptions {
  command: string;
  apiKey: string;
  baseUrl?: string;
  environment?: 'production' | 'staging' | 'development';
  output?: string;
  sandbox?: boolean;
}

function parseArgs(args: string[]): CliOptions | null {
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(HELP_TEXT);
    return null;
  }

  if (command === '--version' || command === '-v') {
    console.log(VERSION);
    return null;
  }

  const validCommands = ['claude', 'cursor', 'vscode', 'generic'];
  if (!validCommands.includes(command)) {
    console.error(`Error: Unknown command '${command}'`);
    console.error(`Valid commands: ${validCommands.join(', ')}`);
    console.error('Run "scell-mcp --help" for usage information.');
    process.exit(1);
  }

  // Get API key from argument or environment
  let apiKey = args[1];
  if (!apiKey || apiKey.startsWith('--')) {
    apiKey = process.env.SCELL_API_KEY || '';
  }

  if (!apiKey) {
    console.error('Error: API key is required.');
    console.error('Provide it as an argument or set the SCELL_API_KEY environment variable.');
    process.exit(1);
  }

  const options: CliOptions = {
    command,
    apiKey,
  };

  // Parse additional options
  let i = apiKey === args[1] ? 2 : 1;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--base-url' && args[i + 1]) {
      options.baseUrl = args[i + 1];
      i += 2;
    } else if (arg === '--env' && args[i + 1]) {
      const env = args[i + 1];
      if (!['production', 'staging', 'development'].includes(env)) {
        console.error(`Error: Invalid environment '${env}'`);
        process.exit(1);
      }
      options.environment = env as 'production' | 'staging' | 'development';
      i += 2;
    } else if (arg === '--sandbox') {
      options.sandbox = true;
      i += 1;
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[i + 1];
      i += 2;
    } else {
      console.error(`Error: Unknown option '${arg}'`);
      process.exit(1);
    }
  }

  // Check for base URL in environment
  if (!options.baseUrl && process.env.SCELL_BASE_URL) {
    options.baseUrl = process.env.SCELL_BASE_URL;
  }

  return options;
}

async function writeFile(path: string, content: string): Promise<void> {
  const fs = await import('fs/promises');
  const pathModule = await import('path');

  // Create directory if it doesn't exist
  const dir = pathModule.dirname(path);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(path, content, 'utf-8');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (!options) {
    return;
  }

  const config: ScellMcpConfig = {
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
    environment: options.environment,
    sandbox: options.sandbox,
  };

  // Validate configuration
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.error('Configuration validation failed:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  // Generate configuration based on command
  let output: string;
  let configPath: string;

  switch (options.command) {
    case 'claude':
      output = JSON.stringify(generateClaudeDesktopConfig(config), null, 2);
      configPath = getConfigPath('claude');
      break;
    case 'cursor':
      output = JSON.stringify(generateCursorConfig(config), null, 2);
      configPath = getConfigPath('cursor');
      break;
    case 'vscode':
      output = JSON.stringify(generateVSCodeConfig(config), null, 2);
      configPath = getConfigPath('vscode');
      break;
    case 'generic':
    default:
      output = generateConfigWithInstructions(config, 'generic');
      configPath = 'mcp.json';
      break;
  }

  // Output or write to file
  if (options.output) {
    try {
      await writeFile(options.output, output);
      console.log(`Configuration written to: ${options.output}`);
    } catch (err) {
      console.error(`Error writing file: ${(err as Error).message}`);
      process.exit(1);
    }
  } else {
    console.log(output);
    console.log('');
    console.log(`// Save this configuration to: ${configPath}`);
  }
}

main().catch((err: Error) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
