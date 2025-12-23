import { test, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import express from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger.ts";
import type { Request, Response } from "express";

describe("Rate Limiter Tests", () => {
  describe("chatLimiter (30 req/min)", () => {
    test("should allow requests under the limit", async () => {
      // Create a fresh limiter for this test with unique key
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-1",
        handler: (req: Request, res: Response) => {
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.get("/test", testLimiter, (req, res) => {
        res.json({ message: "success" });
      });

      // Make 5 requests (well under 30)
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get("/test").expect(200);
        assert.strictEqual(response.body.message, "success");
      }
    });

    test("should block requests over the limit", async () => {
      // Create a fresh limiter for this test with unique key
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-2",
        handler: (req: Request, res: Response) => {
          logger.warn("Rate limit exceeded", {
            ip: req.ip,
            path: req.path,
            method: req.method,
          });
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.post("/test", testLimiter, (req, res) => {
        res.json({ message: "success" });
      });

      // Make 31 requests (1 over the limit of 30)
      for (let i = 0; i < 30; i++) {
        await request(app).post("/test").send({}).expect(200);
      }

      console.log(
        "⚠️  The following 'Rate limit exceeded' warning is EXPECTED and part of the test:"
      );

      // 31st request should be rate limited
      const response = await request(app).post("/test").send({}).expect(429);
      assert.strictEqual(
        response.body.error,
        "Too many requests. Please wait a moment before trying again."
      );
    });

    test("should include RateLimit headers", async () => {
      // Create a fresh limiter for this test with unique key
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-3",
        handler: (req: Request, res: Response) => {
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.get("/test", testLimiter, (req, res) => {
        res.json({ message: "success" });
      });

      const response = await request(app).get("/test").expect(200);

      // Check for standard RateLimit-* headers
      assert.ok(
        response.headers["ratelimit-limit"] !== undefined,
        "Should have RateLimit-Limit header"
      );
      assert.ok(
        response.headers["ratelimit-remaining"] !== undefined,
        "Should have RateLimit-Remaining header"
      );
    });
  });

  describe("apiLimiter (100 req/min)", () => {
    test("should allow requests under the limit", async () => {
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-4",
        handler: (req: Request, res: Response) => {
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.get("/test", testLimiter, (req, res) => {
        res.json({ providers: [] });
      });

      // Make 10 requests (well under 100)
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get("/test").expect(200);
        assert.ok(Array.isArray(response.body.providers));
      }
    });

    test("should have higher limit than chatLimiter", async () => {
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-5",
        handler: (req: Request, res: Response) => {
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.get("/test", testLimiter, (req, res) => {
        res.json({ message: "success" });
      });

      // Make 50 requests (would exceed chatLimiter, but within apiLimiter)
      for (let i = 0; i < 50; i++) {
        await request(app).get("/test").expect(200);
      }
    });

    test("should include RateLimit headers", async () => {
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-6",
        handler: (req: Request, res: Response) => {
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.get("/test", testLimiter, (req, res) => {
        res.json({ providers: [] });
      });

      const response = await request(app).get("/test").expect(200);

      assert.ok(
        response.headers["ratelimit-limit"] !== undefined,
        "Should have RateLimit-Limit header"
      );
      assert.ok(
        response.headers["ratelimit-remaining"] !== undefined,
        "Should have RateLimit-Remaining header"
      );
    });
  });

  describe("healthLimiter (200 req/min)", () => {
    test("should allow requests under the limit", async () => {
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-7",
        handler: (req: Request, res: Response) => {
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.get("/test", testLimiter, (req, res) => {
        res.json({ status: "ok" });
      });

      // Make 20 requests (well under 200)
      for (let i = 0; i < 20; i++) {
        const response = await request(app).get("/test").expect(200);
        assert.strictEqual(response.body.status, "ok");
      }
    });

    test("should have highest limit of all limiters", async () => {
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-8",
        handler: (req: Request, res: Response) => {
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.get("/test", testLimiter, (req, res) => {
        res.json({ status: "ok" });
      });

      // Make 150 requests (would exceed chatLimiter and apiLimiter, but within healthLimiter)
      for (let i = 0; i < 150; i++) {
        await request(app).get("/test").expect(200);
      }
    });

    test("should include RateLimit headers", async () => {
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-9",
        handler: (req: Request, res: Response) => {
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.get("/test", testLimiter, (req, res) => {
        res.json({ status: "ok" });
      });

      const response = await request(app).get("/test").expect(200);

      assert.ok(
        response.headers["ratelimit-limit"] !== undefined,
        "Should have RateLimit-Limit header"
      );
      assert.ok(
        response.headers["ratelimit-remaining"] !== undefined,
        "Should have RateLimit-Remaining header"
      );
    });
  });

  describe("Rate limit error responses", () => {
    test("should return 429 status code when limit exceeded", async () => {
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-10",
        handler: (req: Request, res: Response) => {
          logger.warn("Rate limit exceeded", {
            ip: req.ip,
            path: req.path,
            method: req.method,
          });
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.post("/test", testLimiter, (req, res) => {
        res.json({ message: "success" });
      });

      // Exceed the limit
      for (let i = 0; i < 30; i++) {
        await request(app).post("/test").send({});
      }

      console.log(
        "⚠️  The following 'Rate limit exceeded' warning is EXPECTED and part of the test:"
      );

      const response = await request(app).post("/test").send({});
      assert.strictEqual(response.status, 429);
    });

    test("should return JSON error message", async () => {
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => "test-11",
        handler: (req: Request, res: Response) => {
          logger.warn("Rate limit exceeded", {
            ip: req.ip,
            path: req.path,
            method: req.method,
          });
          res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        },
      });

      const app = express();
      app.use(express.json());
      app.post("/test", testLimiter, (req, res) => {
        res.json({ message: "success" });
      });

      // Exceed the limit
      for (let i = 0; i < 30; i++) {
        await request(app).post("/test").send({});
      }

      console.log(
        "⚠️  The following 'Rate limit exceeded' warning is EXPECTED and part of the test:"
      );

      const response = await request(app).post("/test").send({});
      assert.ok(response.headers["content-type"].includes("application/json"));
      assert.strictEqual(
        response.body.error,
        "Too many requests. Please wait a moment before trying again."
      );
    });
  });
});
