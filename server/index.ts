import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { WebSocketServer } from "ws";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
	const start = Date.now();
	const path = req.path;
	let capturedJsonResponse: Record<string, any> | undefined = undefined;

	const originalResJson = res.json;
	res.json = function (bodyJson, ...args) {
		capturedJsonResponse = bodyJson;
		return originalResJson.apply(res, [bodyJson, ...args]);
	};

	res.on("finish", () => {
		const duration = Date.now() - start;
		if (path.startsWith("/api")) {
			let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
			if (capturedJsonResponse) {
				logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
			}

			if (logLine.length > 80) {
				logLine = logLine.slice(0, 79) + "…";
			}

			log(logLine);
		}
	});

	next();
});

(async () => {
	// Register API routes
	await registerRoutes(app);

	// Error handling middleware
	app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
		const status = err.status || err.statusCode || 500;
		const message = err.message || "Internal Server Error";
		res.status(status).json({ message });
		throw err;
	});

	// Setup Vite in development or serve static files in production
	if (process.env.NODE_ENV === "development") {
		const server = app.listen(3000, "0.0.0.0", () => {
			log(`Server running on http://localhost:3000`);
		});

		// WebSocket server for development
		const wss = new WebSocketServer({ server });
		wss.on("connection", (ws) => {
			console.log("New WebSocket connection");
			ws.on("message", (message) => {
				console.log("Received:", message);
				ws.send(`Server received: ${message}`);
			});
			ws.on("close", () => {
				console.log("Client disconnected");
			});
		});

		await setupVite(app, server);
	} else {
		// Serve static files in production
		app.use(express.static(path.resolve(projectRoot, "dist/client")));

		// Add a health check endpoint
		app.get("/health", (req, res) => {
			res.json({ status: "healthy" });
		});

		// Serve index.html for all non-API routes
		app.get("*", (req, res, next) => {
			if (req.path.startsWith("/api")) {
				return next();
			}
			res.sendFile(path.resolve(projectRoot, "dist/client/index.html"));
		});

		const port = process.env.PORT || 3000;
		app.listen(port, () => {
			log(`Production server running on port ${port}`);
		});
	}
})();
