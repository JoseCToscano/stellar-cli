import fs from 'fs';
import path from 'path';

// Create a logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'mcp-server.log');

/**
 * Logs messages to a file instead of console.log
 * @param message The message or object to log
 */
export function log(message: any): void {
  const timestamp = new Date().toISOString();
  let logMessage: string;
  
  if (typeof message === 'object') {
    logMessage = JSON.stringify(message, null, 2);
  } else {
    logMessage = String(message);
  }
  
  const formattedMessage = `[${timestamp}] ${logMessage}\n`;
  
  try {
    fs.appendFileSync(logFile, formattedMessage);
  } catch (error) {
    // If we can't write to the file, use stderr as fallback
    console.error(`[Logger] Failed to write to log file: ${error}`);
    console.error(formattedMessage);
  }
}

/**
 * Clears the log file
 */
export function clearLog(): void {
  try {
    fs.writeFileSync(logFile, '');
  } catch (error) {
    console.error(`[Logger] Failed to clear log file: ${error}`);
  }
}

// Optional: Clear log on startup
// clearLog();

// Log startup message
log(`MCP Server started at ${new Date().toISOString()}`);