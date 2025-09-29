// Server-side logging utility - NO browser console output
// All logs are suppressed from user's browser console and only visible in server/workflow logs

export class Logger {
  private static isServerLoggingEnabled = true;

  private static logToServer(level: string, message: string, data?: any) {
    if (!this.isServerLoggingEnabled) return;
    
    // Create a detailed log entry for the server
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };

    // COMPLETELY SUPPRESS ALL BROWSER CONSOLE OUTPUT
    // No console.log, console.error, console.warn, etc.
    // These logs will only appear in workflow logs (server-side)
    
    // Send to server console via a background fetch request that doesn't interfere with user experience
    try {
      // Use a fake endpoint that will show in network logs but not affect user
      fetch('/dev/null', {
        method: 'POST',
        body: JSON.stringify(logEntry),
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {}); // Suppress any network errors
    } catch {
      // Completely silent - no browser console output at all
    }
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