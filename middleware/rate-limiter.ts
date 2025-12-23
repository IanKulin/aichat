import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger.ts";
import type { Request, Response } from "express";

/**
 * Rate limiter for chat endpoints
 * Limit: 30 requests per minute
 * Rationale: Humans type 5-10 msgs/min max, 3x buffer for safety
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per window
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req: Request, res: Response) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: "Too many requests. Please wait a moment before trying again.",
    });
  },
});

/**
 * Rate limiter for general API endpoints
 * Limit: 100 requests per minute
 * Rationale: Lighter operations, UI interactions
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: "Too many requests. Please wait a moment before trying again.",
    });
  },
});

/**
 * Rate limiter for health check endpoint
 * Limit: 200 requests per minute
 * Rationale: Monitoring and status checks
 */
export const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: "Too many requests. Please wait a moment before trying again.",
    });
  },
});
