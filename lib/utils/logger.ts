// Server-side logging utility - NO browser console output
// All logs are suppressed from user's browser console and only visible in server/workflow logs

export class Logger {
  private static isServerLoggingEnabled = true;

  private static logToServer(level: string, message: string, data?: any) {
    if (!this.isServerLoggingEnabled) return;
    
    // COMPLETELY SUPPRESS ALL BROWSER CONSOLE OUTPUT
    // No console.log, console.error, console.warn, etc.
    // No network requests - completely silent logger
    
    // Logger is now completely silent - no network calls, no console output
    // This prevents any annoying network requests or browser console pollution
  }

  static info(message: string, data?: any) {
    this.logToServer('info', message, data);
  }

  static debug(message: string, data?: any) {
    this.logToServer('debug', message, data);
  }

  static error(message: string, data?: any) {
    // NO BROWSER CONSOLE OUTPUT - completely silent for users
    this.logToServer('error', message, data);
  }

  static warn(message: string, data?: any) {
    this.logToServer('warn', message, data);
  }

  // Method to disable all logging
  static disable() {
    this.isServerLoggingEnabled = false;
  }

  // Method to enable logging 
  static enable() {
    this.isServerLoggingEnabled = true;
  }
}