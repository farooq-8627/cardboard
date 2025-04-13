import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [
		react(),
		runtimeErrorOverlay(),
		themePlugin(),
		...(process.env.NODE_ENV !== "production" &&
		process.env.REPL_ID !== undefined
			? [
					await import("@replit/vite-plugin-cartographer").then((m) =>
						m.cartographer()
					),
			  ]
			: []),
	],
	server: {
		host: "0.0.0.0",
		port: 3000,
		https: {
			key: fs.readFileSync("./certs/localhost+3-key.pem"),
			cert: fs.readFileSync("./certs/localhost+3.pem"),
		},
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true,
				secure: false,
			},
			"/ws": {
				target: "ws://localhost:3000",
				ws: true,
				secure: false,
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "client", "src"),
			"@shared": path.resolve(import.meta.dirname, "shared"),
			"@assets": path.resolve(import.meta.dirname, "attached_assets"),
		},
	},
	root: path.resolve(__dirname, "client"),
	build: {
		outDir: path.resolve(__dirname, "dist/client"),
		emptyOutDir: true,
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ["react", "react-dom"],
				},
			},
		},
	},
});
