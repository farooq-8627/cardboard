import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import cors from "cors";
import { handleSignaling } from "./webrtc/signaling";

const app = express();
app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"https://workflow-wizard-nine.vercel.app",
			"https://workflow-wizard-jfy2045ky-farooq-8627s-projects.vercel.app",
			"https://workflow-wizard-nine.onrender.com",
			"https://https-workflow-wizard-nine-vercel-app.onrender.com",
			process.env.CORS_ORIGIN || "*",
		],
		methods: ["GET", "POST"],
		credentials: true,
	})
);

// Health check endpoint (required by Render)
app.get("/", (req, res) => {
	res.json({ status: "healthy" });
});

const server = createServer(app);
const wss = new WebSocketServer({
	server,
	path: "/ws", // Explicit WebSocket path
});

// Keep track of connected clients
const clients = new Set<WebSocket>();

wss.on("connection", (ws: WebSocket) => {
	console.log("New WebSocket connection established");
	clients.add(ws);

	ws.on("message", (message: string) => {
		try {
			handleSignaling(message, ws, wss);
		} catch (error) {
			console.error("Error handling message:", error);
			ws.send(
				JSON.stringify({ type: "error", message: "Failed to process message" })
			);
		}
	});

	ws.on("close", () => {
		console.log("WebSocket connection closed");
		clients.delete(ws);
	});

	ws.on("error", (error) => {
		console.error("WebSocket error:", error);
		clients.delete(ws);
	});

	// Send initial connection confirmation
	ws.send(
		JSON.stringify({
			type: "connection",
			status: "connected",
		})
	);
});

// Ping clients every 30 seconds to keep connections alive
setInterval(() => {
	clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.ping();
		}
	});
}, 30000);

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
	console.log(`WebSocket server is running on port ${PORT}`);
});
