import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Secret key for JWT signing/verifying (In a real app, use an env variable)
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-gateway";

// Rate limiting configurations (requests per minute)
const RATE_LIMITS = {
  free: 5,
  pro: 50,
};

// In-memory store for rate limiting (fixed window)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface JwtPayload {
  userId: string;
  tier: "free" | "pro";
  iat: number;
  exp: number;
}

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      gatewayStartTime?: number;
    }
  }
}

// ----------------------------------------------------------------------
// Middlewares
// ----------------------------------------------------------------------

// 1. Gateway metrics middleware: Tracks request latency
app.use("/api/gateway", (req, res, next) => {
  req.gatewayStartTime = Date.now();
  next();
});

// 2. Authentication Middleware: Decodes JWT fast
const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// 3. Dynamic Rate Limiting Middleware
const dynamicRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const limit = RATE_LIMITS[user.tier] || RATE_LIMITS.free;
  const now = Date.now();
  
  let record = rateLimitStore.get(user.userId);
  
  if (!record) {
    record = { count: 1, resetTime: now + WINDOW_MS };
    rateLimitStore.set(user.userId, record);
  } else {
    // Check if window has expired
    if (now > record.resetTime) {
      record = { count: 1, resetTime: now + WINDOW_MS };
      rateLimitStore.set(user.userId, record);
    } else {
      record.count += 1;
    }
  }

  // Set standard RateLimit headers
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - record.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

  if (record.count > limit) {
    res.status(429).json({ 
      error: "Too Many Requests", 
      message: `Rate limit exceeded for tier: ${user.tier}. Try again later.`,
      tier: user.tier,
      limit: limit
    });
    return;
  }

  next();
};

// ----------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------

// Endpoint to generate a test token
app.post("/api/auth/token", (req, res) => {
  const { userId, tier } = req.body;
  
  if (!userId || !tier) {
    res.status(400).json({ error: "Missing userId or tier" });
    return;
  }

  const payload = { userId, tier };
  // Token expires in 1 hour
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  
  res.json({ token, payload });
});

// Mock upstream service endpoint
// The gateway forwards traffic here
app.all("/api/gateway/*", authenticateJwt, dynamicRateLimit, (req, res) => {
  // Simulate some upstream latency
  const upstreamLatency = Math.floor(Math.random() * 50) + 10; 
  
  setTimeout(() => {
    const gatewayLatency = Date.now() - (req.gatewayStartTime || Date.now());
    
    res.json({
      status: "success",
      message: "Request successfully proxied to upstream service.",
      data: {
        path: req.path.replace("/api/gateway", ""),
        method: req.method,
        user: req.user,
      },
      metrics: {
        upstreamLatencyMs: upstreamLatency,
        gatewayLatencyMs: gatewayLatency - upstreamLatency, // time spent in middleware
        totalLatencyMs: gatewayLatency,
      }
    });
  }, upstreamLatency);
});

// System check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", activeLimits: rateLimitStore.size });
});

// ----------------------------------------------------------------------
// Vite Middleware & Static Serving
// ----------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API Gateway Server running on port ${PORT}`);
  });
}

startServer();
