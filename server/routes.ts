import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { handleSignaling } from "./webrtc/signaling";

export async function registerRoutes(app: Express): Promise<Server> {
	// Regular API routes
	app.get("/api/health", (req, res) => {
		res.json({ status: "healthy" });
	});

	// Session management
	app.post("/api/sessions", async (req, res) => {
		try {
			const { sessionId, connectionType } = req.body;
			if (!sessionId || !connectionType) {
				return res.status(400).json({ error: "Missing required fields" });
			}

			const session = await storage.createSession({
				sessionId,
				connectionType,
				createdAt: Date.now(),
				isActive: true,
				metrics: {},
			});

			res.status(201).json(session);
		} catch (error) {
			console.error("Error creating session:", error);
			res.status(500).json({ error: "Failed to create session" });
		}
	});

	// Get active sessions
	app.get("/api/sessions/active", async (req, res) => {
		try {
			// This will be implemented in a future update
			// For now, return an empty array
			res.json([]);
		} catch (error) {
			console.error("Error fetching active sessions:", error);
			res.status(500).json({ error: "Failed to fetch sessions" });
		}
	});

	// Store biometric data
	app.post("/api/biometrics", async (req, res) => {
		try {
			const {
				sessionId,
				attentionScore,
				heartRate,
				emotion,
				emotionConfidence,
				eyeTrackingData,
			} = req.body;

			if (!sessionId) {
				return res.status(400).json({ error: "Session ID is required" });
			}

			const biometricData = await storage.storeBiometricData({
				sessionId,
				timestamp: Date.now(),
				attentionScore,
				heartRate,
				emotion,
				emotionConfidence,
				eyeTrackingData,
			});

			res.status(201).json(biometricData);
		} catch (error) {
			console.error("Error storing biometric data:", error);
			res.status(500).json({ error: "Failed to store biometric data" });
		}
	});

	const httpServer = createServer(app);

	// Setup WebSocket server for WebRTC signaling
	const wss = new WebSocketServer({
		server: httpServer,
		path: "/ws",
		verifyClient: (info, cb) => {
			const origin = info.origin || info.req.headers.origin;
			// Allow connections from our known origins
			const allowedOrigins = [
				"http://localhost:3000",
				"https://workflow-wizard-nine.vercel.app",
				"https://workflow-wizard-jfy2045ky-farooq-8627s-projects.vercel.app",
				"https://workflow-wizard-nine.onrender.com",
				"https://https-workflow-wizard-nine-vercel-app.onrender.com",
			];

			if (!origin || allowedOrigins.includes(origin)) {
				cb(true);
			} else {
				cb(false, 403, "Forbidden");
			}
		},
	});

	wss.on("connection", (ws: WebSocket, req) => {
		console.log(
			"New WebSocket connection established from:",
			req.headers.origin
		);

		ws.on("message", (message: string) => {
			handleSignaling(message, ws, wss);
		});

		ws.on("close", () => {
			console.log("WebSocket connection closed");
		});

		ws.on("error", (error) => {
			console.error("WebSocket error:", error);
		});

		// Send initial connection confirmation
		ws.send(
			JSON.stringify({
				type: "connection",
				status: "connected",
			})
		);
	});

	return httpServer;
}
