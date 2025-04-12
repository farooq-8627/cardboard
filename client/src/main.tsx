import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { WebRTCProvider } from "./context/webrtc-context";

createRoot(document.getElementById("root")!).render(
  <WebRTCProvider>
    <App />
  </WebRTCProvider>
);
