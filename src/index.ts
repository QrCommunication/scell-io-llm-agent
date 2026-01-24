/**
 * @scell/mcp-client
 *
 * MCP client configuration generator for Scell.io API
 * Supports Claude Desktop, Cursor, VS Code, and other MCP-compatible clients
 *
 * @packageDocumentation
 */

// Export all types
export type {
  // Configuration types
  ScellMcpConfig,
  McpServerConfig,
  McpClientConfig,

  // Invoice types
  Company,
  InvoiceLine,
  InvoiceInput,
  Invoice,

  // Signature types
  Signer,
  SignatureInput,
  SignatureRequest,

  // Result types
  ToolResult,
  PaginatedResult,

  // API types
  HealthCheckResponse,
  ApiKeyValidationResponse,

  // Webhook types
  WebhookEventType,
  WebhookPayload,
} from './types/index.js';

// Export configuration generators
export {
  generateClaudeDesktopConfig,
  generateCursorConfig,
  generateVSCodeConfig,
  generateGenericConfig,
  generateConfigWithInstructions,
  getConfigPath,
  validateConfig,
} from './config/generator.js';

// Export default configuration function
export { generateGenericConfig as default } from './config/generator.js';
