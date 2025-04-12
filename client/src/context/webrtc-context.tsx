import React, {
	createContext,
	useState,
	useEffect,
	useContext,
	ReactNode,
	useRef,
	useCallback,
} from "react";
import { useToast } from "@/hooks/use-toast";

// WebRTC configuration
const configuration: RTCConfiguration = {
	iceServers: [
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun1.l.google.com:19302" },
		{ urls: "stun:stun2.l.google.com:19302" },
	],
};

// Status types
type ConnectionStatus = "disconnected" | "connecting" | "connected";
type DeviceType = "desktop" | "mobile";

// Context types
interface WebRTCContextType {
	// Connection state
	peerConnection: RTCPeerConnection | null;
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;
	connectionStatus: ConnectionStatus;
	deviceType: DeviceType;
	sessionId: string | null;

	// Methods
	startStream: (deviceType: DeviceType) => Promise<MediaStream | null>;
	stopStream: () => void;
	createSession: () => Promise<string>;
	joinSession: (id: string) => Promise<void>;
	disconnectPeer: () => void;

	// Video elements
	localVideoRef: React.RefObject<HTMLVideoElement>;
	remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

// Create context with default values
const WebRTCContext = createContext<WebRTCContextType>({
	peerConnection: null,
	localStream: null,
	remoteStream: null,
	connectionStatus: "disconnected",
	deviceType: "desktop",
	sessionId: null,

	startStream: async () => null,
	stopStream: () => {},
	createSession: async () => "",
	joinSession: async () => {},
	disconnectPeer: () => {},

	localVideoRef: { current: null },
	remoteVideoRef: { current: null },
});

interface WebRTCProviderProps {
	children: ReactNode;
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
	// State
	const [peerConnection, setPeerConnection] =
		useState<RTCPeerConnection | null>(null);
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
	const [connectionStatus, setConnectionStatus] =
		useState<ConnectionStatus>("disconnected");
	const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [wsClientId, setWsClientId] = useState<string | null>(null);
	const [peerId, setPeerId] = useState<string | null>(null);

	// Refs
	const wsRef = useRef<WebSocket | null>(null);
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);

	// Toast notifications
	const { toast } = useToast();

	// Connect to WebSocket server
	const connectWebSocket = useCallback(() => {
		const wsUrl =
			import.meta.env.VITE_WS_URL ||
			`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
				window.location.host
			}/ws`;

		console.log("Connecting to WebSocket server at:", wsUrl);

		const ws = new WebSocket(wsUrl);
		wsRef.current = ws;

		ws.onopen = () => {
			console.log("WebSocket connection established");
			// Register as device type
			ws.send(
				JSON.stringify({
					type: "register",
					role: deviceType === "desktop" ? "browser" : "mobile",
				})
			);
		};

		ws.onmessage = (event) => {
			handleSignalingMessage(event.data);
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
			toast({
				title: "Connection Error",
				description: "Failed to connect to signaling server",
				variant: "destructive",
			});
		};

		ws.onclose = () => {
			console.log("WebSocket connection closed");
			setConnectionStatus("disconnected");
		};
	}, [deviceType, toast]);

	// Handle incoming signaling messages
	const handleSignalingMessage = useCallback(
		async (data: string) => {
			try {
				const message = JSON.parse(data);
				console.log("Received signaling message:", message.type);

				switch (message.type) {
					case "registered":
						setWsClientId(message.id);
						break;

					case "ready":
						setPeerId(message.peerId);

						// Initiate WebRTC if we're the browser
						if (message.initiator) {
							await createOffer(message.peerId);
						}
						break;

					case "offer":
						if (message.peerId) {
							await handleOffer(message.offer, message.peerId);
						}
						break;

					case "answer":
						await handleAnswer(message.answer);
						break;

					case "ice-candidate":
						await handleIceCandidate(message.candidate);
						break;

					case "peer-disconnected":
						handlePeerDisconnect();
						break;

					case "error":
						console.error("Signaling error:", message.message);
						toast({
							title: "Connection Error",
							description: message.message,
							variant: "destructive",
						});
						break;
				}
			} catch (error) {
				console.error("Error processing signaling message:", error);
			}
		},
		[toast]
	);

	// Create and configure new RTCPeerConnection
	const createPeerConnection = useCallback(() => {
		console.log("Creating new peer connection");

		const pc = new RTCPeerConnection(configuration);
		setPeerConnection(pc);

		// Add local stream tracks to the connection
		if (localStream) {
			localStream.getTracks().forEach((track) => {
				pc.addTrack(track, localStream);
			});
		}

		// Handle remote stream
		const remoteStream = new MediaStream();
		setRemoteStream(remoteStream);

		pc.ontrack = (event) => {
			console.log("Remote track received");
			event.streams[0].getTracks().forEach((track) => {
				remoteStream.addTrack(track);
			});

			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = remoteStream;
			}
		};

		// ICE candidate handling
		pc.onicecandidate = (event) => {
			if (event.candidate && wsRef.current && peerId) {
				console.log("Sending ICE candidate to peer");
				wsRef.current.send(
					JSON.stringify({
						type: "ice-candidate",
						candidate: event.candidate,
						peerId,
					})
				);
			}
		};

		// Connection state changes
		pc.onconnectionstatechange = () => {
			console.log("Connection state changed:", pc.connectionState);
			switch (pc.connectionState) {
				case "connected":
					setConnectionStatus("connected");
					toast({
						title: "Connected",
						description: "Peer connection established successfully",
					});
					break;

				case "disconnected":
				case "failed":
				case "closed":
					setConnectionStatus("disconnected");
					break;
			}
		};

		return pc;
	}, [localStream, peerId, toast]);

	// Create and send offer to remote peer
	const createOffer = useCallback(
		async (targetPeerId: string) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				console.error("WebSocket not connected");
				return;
			}

			try {
				setConnectionStatus("connecting");

				const pc = peerConnection || createPeerConnection();
				const offer = await pc.createOffer();
				await pc.setLocalDescription(offer);

				console.log("Sending offer to peer:", targetPeerId);
				wsRef.current.send(
					JSON.stringify({
						type: "offer",
						offer,
						peerId: targetPeerId,
					})
				);
			} catch (error) {
				console.error("Error creating offer:", error);
				setConnectionStatus("disconnected");
				toast({
					title: "Connection Error",
					description: "Failed to create connection offer",
					variant: "destructive",
				});
			}
		},
		[peerConnection, createPeerConnection, toast]
	);

	// Handle received offer from remote peer
	const handleOffer = useCallback(
		async (offer: RTCSessionDescriptionInit, senderId: string) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				console.error("WebSocket not connected");
				return;
			}

			try {
				setConnectionStatus("connecting");
				setPeerId(senderId);

				const pc = peerConnection || createPeerConnection();
				await pc.setRemoteDescription(new RTCSessionDescription(offer));

				const answer = await pc.createAnswer();
				await pc.setLocalDescription(answer);

				console.log("Sending answer to peer:", senderId);
				wsRef.current.send(
					JSON.stringify({
						type: "answer",
						answer,
						peerId: senderId,
					})
				);
			} catch (error) {
				console.error("Error handling offer:", error);
				setConnectionStatus("disconnected");
				toast({
					title: "Connection Error",
					description: "Failed to process connection offer",
					variant: "destructive",
				});
			}
		},
		[peerConnection, createPeerConnection, toast]
	);

	// Handle received answer from remote peer
	const handleAnswer = useCallback(
		async (answer: RTCSessionDescriptionInit) => {
			try {
				if (peerConnection) {
					await peerConnection.setRemoteDescription(
						new RTCSessionDescription(answer)
					);
					console.log("Remote description set from answer");
				}
			} catch (error) {
				console.error("Error handling answer:", error);
				toast({
					title: "Connection Error",
					description: "Failed to process connection answer",
					variant: "destructive",
				});
			}
		},
		[peerConnection, toast]
	);

	// Handle received ICE candidate from remote peer
	const handleIceCandidate = useCallback(
		async (candidate: RTCIceCandidateInit) => {
			try {
				if (peerConnection) {
					await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
					console.log("Added ICE candidate");
				}
			} catch (error) {
				console.error("Error adding ICE candidate:", error);
			}
		},
		[peerConnection]
	);

	// Handle peer disconnection
	const handlePeerDisconnect = useCallback(() => {
		toast({
			title: "Peer Disconnected",
			description: "The remote peer has disconnected",
		});

		setPeerId(null);
		setConnectionStatus("disconnected");
	}, [toast]);

	// Start local media stream
	const startStream = useCallback(
		async (type: DeviceType): Promise<MediaStream | null> => {
			try {
				setDeviceType(type);

				const constraints: MediaStreamConstraints = {
					video: true,
					audio: false, // Disable audio for this app since we're focusing on video processing
				};

				console.log("Requesting media stream with constraints:", constraints);
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				setLocalStream(stream);

				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}

				// Connect to signaling server after getting stream
				if (!wsRef.current) {
					connectWebSocket();
				}

				return stream;
			} catch (error) {
				console.error("Error getting user media:", error);
				toast({
					title: "Camera Error",
					description: "Unable to access camera. Please check permissions.",
					variant: "destructive",
				});
				return null;
			}
		},
		[connectWebSocket, toast]
	);

	// Stop local stream
	const stopStream = useCallback(() => {
		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
			setLocalStream(null);

			if (localVideoRef.current) {
				localVideoRef.current.srcObject = null;
			}
		}

		disconnectPeer();
	}, [localStream]);

	// Create a new session
	const createSession = useCallback(async (): Promise<string> => {
		const newSessionId = Math.random().toString(36).substring(2, 10);
		setSessionId(newSessionId);

		if (
			wsRef.current &&
			wsRef.current.readyState === WebSocket.OPEN &&
			wsClientId
		) {
			wsRef.current.send(
				JSON.stringify({
					type: "join",
					sessionId: newSessionId,
				})
			);

			try {
				// Register session in backend
				await fetch("/api/sessions", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						sessionId: newSessionId,
						connectionType: deviceType,
					}),
				});
			} catch (error) {
				console.error("Failed to register session with backend:", error);
			}
		} else {
			console.error("WebSocket not connected or client not registered");
			toast({
				title: "Connection Error",
				description: "Not connected to signaling server",
				variant: "destructive",
			});
		}

		return newSessionId;
	}, [wsClientId, deviceType, toast]);

	// Join an existing session
	const joinSession = useCallback(
		async (id: string) => {
			setSessionId(id);

			if (
				wsRef.current &&
				wsRef.current.readyState === WebSocket.OPEN &&
				wsClientId
			) {
				wsRef.current.send(
					JSON.stringify({
						type: "join",
						sessionId: id,
					})
				);
			} else {
				console.error("WebSocket not connected or client not registered");
				toast({
					title: "Connection Error",
					description: "Not connected to signaling server",
					variant: "destructive",
				});
			}
		},
		[wsClientId, toast]
	);

	// Disconnect from peer
	const disconnectPeer = useCallback(() => {
		if (peerConnection) {
			peerConnection.close();
			setPeerConnection(null);
		}

		if (remoteStream) {
			remoteStream.getTracks().forEach((track) => track.stop());
			setRemoteStream(null);

			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = null;
			}
		}

		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ type: "disconnect" }));
		}

		setConnectionStatus("disconnected");
		setPeerId(null);
		setSessionId(null);
	}, [peerConnection, remoteStream]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			stopStream();

			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [stopStream]);

	const contextValue: WebRTCContextType = {
		peerConnection,
		localStream,
		remoteStream,
		connectionStatus,
		deviceType,
		sessionId,

		startStream,
		stopStream,
		createSession,
		joinSession,
		disconnectPeer,

		localVideoRef,
		remoteVideoRef,
	};

	return (
		<WebRTCContext.Provider value={contextValue}>
			{children}
		</WebRTCContext.Provider>
	);
};

// Custom hook to use the WebRTC context
export const useWebRTC = () => useContext(WebRTCContext);
