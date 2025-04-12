import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

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
		host: process.env.VITE_HOST === "true" ? true : false,
		hmr: {
			clientPort: 3000,
		},
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true,
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
	root: path.resolve(import.meta.dirname, "client"),
	build: {
		outDir: path.resolve(import.meta.dirname, "dist/public"),
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
