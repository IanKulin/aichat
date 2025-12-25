import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger.ts";

/**
 * Enhanced request logging middleware
 * Logs request details and response information
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Log incoming request
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    contentType: req.get("Content-Type"),
  });

  // Override res.end to log response
  const originalEnd = res.end.bind(res);
  res.end = function (...args: Parameters<typeof originalEnd>) {
    const duration = Date.now() - start;

    logger.debug(`${req.method} ${req.path} ${res.statusCode}`, {
      duration: `${duration}ms`,
      contentLength: res.get("Content-Length"),
    });

    // Call the original end method
    return originalEnd(...args);
  };

  next();
}

/**
 * Chat-specific logging middleware
 * Logs detailed information about chat requests
 */
export function chatLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.path === "/api/chat" && req.method === "POST") {
    const { messages, provider, model } = req.body;

    logger.debug(`Chat request`, {
      messageCount: Array.isArray(messages) ? messages.length : 0,
      provider: provider || "default",
      model: model || "default",
      lastMessagePreview:
        messages && messages.length > 0
          ? messages[messages.length - 1].content?.substring(0, 100) + "..."
          : "no content",
    });

    // Override res.json to log response details
    const originalJson = res.json;
    res.json = function (obj: Record<string, unknown>) {
      if (obj.response) {
        logger.debug(`Chat response`, {
          provider: obj.provider,
          model: obj.model,
          responseLength:
            typeof obj.response === "string" ? obj.response.length : "unknown",
          timestamp: obj.timestamp,
        });
      }

      return originalJson.call(this, obj);
    };
  }

  next();
}
