"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, PhoneOff, Mic, MicOff, Loader2, Sparkles, Volume2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { Monogram } from "@/app/components/brand/Monogram";
import { BACKEND_ORIGIN } from "@/app/lib/backend-url";

const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;
const CHUNK_SAMPLES = 2048;
const LEGACY_VOICE_WS_ORIGIN = "wss://ndeefapp.runasp.net";

function float32ToPcm16(input: Float32Array, inputRate: number): Int16Array {
  if (inputRate === INPUT_RATE) {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  const ratio = inputRate / INPUT_RATE;
  const outLen = Math.max(1, Math.floor(input.length / ratio));
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const idx = Math.min(input.length - 1, Math.floor(i * ratio));
    const s = Math.max(-1, Math.min(1, input[idx]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

class PCMPlayer {
  private ctx: AudioContext;
  private nextTime = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  async start() {
    console.log(`[PCMPlayer] Starting player. Context state: ${this.ctx.state}, currentTime: ${this.ctx.currentTime}`);
    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
        console.log(`[PCMPlayer] Context resumed successfully. State: ${this.ctx.state}`);
      } catch (err) {
        console.error("[PCMPlayer] Failed to resume AudioContext during start:", err);
      }
    }
    this.nextTime = this.ctx.currentTime;
  }

  play(pcm16: Int16Array) {
    if (!this.ctx || pcm16.length === 0) return;

    // Trigger resume in background to avoid blocking the synchronous audio scheduling queue calculation
    if (this.ctx.state === "suspended") {
      this.ctx.resume()
        .then(() => console.log(`[PCMPlayer] Background resume completed. State: ${this.ctx.state}`))
        .catch((err) => console.error("[PCMPlayer] Background resume failed:", err));
    }

    try {
      const floats = new Float32Array(pcm16.length);
      let maxAmp = 0;
      for (let i = 0; i < pcm16.length; i++) {
        floats[i] = pcm16[i] / 32768;
        const absVal = Math.abs(floats[i]);
        if (absVal > maxAmp) maxAmp = absVal;
      }

      if (Math.random() < 0.05) {
        console.log(
          `[PCMPlayer] Scheduling audio chunk. Samples: ${pcm16.length}, maxAmp: ${maxAmp.toFixed(
            4,
          )}, nextTime: ${this.nextTime.toFixed(4)}, currentTime: ${this.ctx.currentTime.toFixed(4)}, state: ${
            this.ctx.state
          }`,
        );
      }

      const buffer = this.ctx.createBuffer(1, floats.length, OUTPUT_RATE);
      buffer.getChannelData(0).set(floats);

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);

      const now = this.ctx.currentTime;
      if (this.nextTime < now) {
        this.nextTime = now + 0.02;
      }
      source.start(this.nextTime);
      this.nextTime += buffer.duration;
    } catch (err) {
      console.error("[PCMPlayer] Error playing audio chunk:", err);
    }
  }

  flush() {
    if (this.ctx) {
      this.nextTime = this.ctx.currentTime;
      console.log(`[PCMPlayer] Flushed. nextTime reset to: ${this.nextTime}`);
    }
  }

  stop() {
    this.nextTime = 0;
    console.log("[PCMPlayer] Stopped.");
  }
}

const workletCode = `
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      this.port.postMessage(channelData);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

class PCMRecorder {
  private ctx: AudioContext;
  private source: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private inputRate = INPUT_RATE;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  async start(stream: MediaStream, onPcm: (pcm: Int16Array) => void) {
    this.inputRate = this.ctx.sampleRate;
    if (this.ctx.state === "suspended") await this.ctx.resume();

    try {
      const blob = new Blob([workletCode], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await this.ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[PCMRecorder] Failed to load AudioWorklet module:", err);
    }

    this.source = this.ctx.createMediaStreamSource(stream);
    this.workletNode = new AudioWorkletNode(this.ctx, "pcm-processor");

    const buffer: number[] = [];
    let frameCount = 0;

    this.workletNode.port.onmessage = (event) => {
      const channelData = event.data as Float32Array;
      if (!channelData) return;

      for (let i = 0; i < channelData.length; i++) {
        buffer.push(channelData[i]);
      }

      while (buffer.length >= CHUNK_SAMPLES) {
        const chunk = new Float32Array(buffer.splice(0, CHUNK_SAMPLES));
        frameCount++;
        let maxVal = 0;
        for (let i = 0; i < chunk.length; i++) {
          const val = Math.abs(chunk[i]);
          if (val > maxVal) maxVal = val;
        }
        if (frameCount % 10 === 0) {
          console.log(
            `[PCMRecorder] Fired AudioWorklet chunk. frame: ${frameCount}, samples: ${chunk.length}, maxAmp: ${maxVal.toFixed(
              4,
            )}`,
          );
        }
        onPcm(float32ToPcm16(chunk, this.inputRate));
      }
    };

    this.source.connect(this.workletNode);
    this.workletNode.connect(this.ctx.destination);
  }

  stop() {
    this.workletNode?.disconnect();
    this.source?.disconnect();
    this.workletNode = null;
    this.source = null;
  }
}

function buildVoiceWebSocketCandidates(token: string): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_BACKEND_WS_URL?.trim();
  const urls: string[] = [];

  if (fromEnv) {
    urls.push(`${fromEnv.replace(/\/$/, "")}/api/voice/socket?access_token=${encodeURIComponent(token)}`);
  }

  // Prioritize current active backend derived from BACKEND_ORIGIN
  const httpBase = BACKEND_ORIGIN;
  const wsBase = httpBase.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://");
  urls.push(`${wsBase.replace(/\/$/, "")}/api/voice/socket?access_token=${encodeURIComponent(token)}`);

  // Legacy fallback
  urls.push(`${LEGACY_VOICE_WS_ORIGIN}/api/voice/socket?access_token=${encodeURIComponent(token)}`);

  return Array.from(new Set(urls));
}

function openVoiceSocket(url: string, timeoutMs = 8000): Promise<WebSocket> {
  return new Promise<WebSocket>((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    // Buffer early messages to avoid race conditions during getUserMedia wait
    const earlyMessages: MessageEvent[] = [];
    socket.onmessage = (event) => {
      earlyMessages.push(event);
    };

    const timeout = window.setTimeout(() => {
      socket.close();
      reject(new Error("WebSocket timeout"));
    }, timeoutMs);

    socket.onopen = () => {
      window.clearTimeout(timeout);
      (socket as any)._earlyMessages = earlyMessages;
      resolve(socket);
    };
    socket.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("WebSocket failed"));
    };
  });
}

async function openVoiceSocketWithFallback(token: string): Promise<WebSocket> {
  const candidates = buildVoiceWebSocketCandidates(token);
  let lastError: unknown = null;

  for (const url of candidates) {
    try {
      console.log("[Voice] Connecting to:", url.replace(/access_token=.*/, "access_token=***"));
      return await openVoiceSocket(url);
    } catch (error) {
      lastError = error;
      console.warn("[Voice] WebSocket candidate failed:", url.replace(/access_token=.*/, "access_token=***"), error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("WebSocket failed");
}

type VoiceMsg = {
  type: string;
  text?: string;
  message?: string;
  role?: "user" | "assistant";
  bytesReceived?: number;
  outputSampleRate?: number;
};

export function VoiceCallWidget({
  sharedAudioCtx,
  onClose,
}: {
  sharedAudioCtx?: AudioContext | null;
  onClose: () => void;
}) {
  const { user, isAuthReady, isLoggedIn } = useAuth();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [status, setStatus] = useState<"connecting" | "active" | "error" | "ended">("connecting");
  const statusRef = useRef(status);
  statusRef.current = status;

  const [errorMsg, setErrorMsg] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [callDuration, setCallDuration] = useState(0);
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const isAssistantSpeakingRef = useRef(false);
  const [micBytesReceived, setMicBytesReceived] = useState(0);
  const [heardYou, setHeardYou] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<PCMRecorder | null>(null);
  const playerRef = useRef<PCMPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const micStartedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const token = user?.token;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [userTranscript, assistantTranscript]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    recorderRef.current?.stop();
    playerRef.current?.stop();
    if (audioCtxRef.current) {
      if (!sharedAudioCtx) {
        void audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    }
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
    wsRef.current = null;
    micStartedRef.current = false;
  }, [sharedAudioCtx]);

  const startMicStreaming = useCallback((ws: WebSocket, stream: MediaStream, audioContext: AudioContext) => {
    if (micStartedRef.current) {
      console.log("[Voice] startMicStreaming called but micStartedRef is already true. Skipping initialization.");
      return;
    }
    console.log("[Voice] startMicStreaming - Initializing PCMRecorder with sampleRate:", audioContext.sampleRate, "state:", audioContext.state);
    micStartedRef.current = true;
    recorderRef.current = new PCMRecorder(audioContext);
    void recorderRef.current.start(stream, (pcm) => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.warn("[Voice] WebSocket not open. State:", ws.readyState);
        return;
      }
      if (isMutedRef.current || isAssistantSpeakingRef.current) return;
      if (Math.random() < 0.05) {
        console.log(`[Voice] Sending PCM chunk to backend: ${pcm.length} samples, bytes: ${pcm.byteLength}`);
      }
      ws.send(pcm.buffer);
    });
  }, []);

  const handleServerMessage = useCallback(
    (data: VoiceMsg, ws: WebSocket) => {
      switch (data.type) {
        case "ready":
          if (data.outputSampleRate && data.outputSampleRate !== OUTPUT_RATE) {
            console.warn("Unexpected output sample rate:", data.outputSampleRate);
          }
          statusRef.current = "active";
          setStatus("active");
          setIsListening(true);
          if (micStreamRef.current && audioCtxRef.current) {
            startMicStreaming(ws, micStreamRef.current, audioCtxRef.current);
          }
          break;
        case "connecting_to_ai":
          statusRef.current = "active";
          setStatus("active");
          setIsListening(false);
          setIsAssistantSpeaking(false);
          isAssistantSpeakingRef.current = false;
          break;
        case "listening":
          setIsListening(true);
          setIsAssistantSpeaking(false);
          isAssistantSpeakingRef.current = false;
          if (typeof data.bytesReceived === "number") setMicBytesReceived(data.bytesReceived);
          break;
        case "speaking":
          setIsAssistantSpeaking(true);
          isAssistantSpeakingRef.current = true;
          setIsListening(false);
          break;
        case "caption":
          if (data.role === "user" && data.text) {
            setUserTranscript(data.text);
            setHeardYou(true);
          } else if (data.role === "assistant" && data.text) {
            setAssistantTranscript(data.text);
          }
          break;
        case "inputTranscript":
          if (data.text) {
            setUserTranscript(data.text);
            setHeardYou(true);
          }
          break;
        case "outputTranscript":
          if (data.text) {
            setAssistantTranscript((prev) => {
              if (!prev) return data.text!;
              if (data.text!.startsWith(prev)) return data.text!;
              return `${prev}${data.text}`;
            });
          }
          break;
        case "turnComplete":
          setIsAssistantSpeaking(false);
          isAssistantSpeakingRef.current = false;
          setIsListening(true);
          playerRef.current?.flush();
          break;
        case "interrupted":
          playerRef.current?.stop();
          if (audioCtxRef.current) {
            playerRef.current = new PCMPlayer(audioCtxRef.current);
            void playerRef.current.start();
          }
          setIsAssistantSpeaking(false);
          isAssistantSpeakingRef.current = false;
          setIsListening(true);
          break;
        case "error":
          statusRef.current = "error";
          setStatus("error");
          setErrorMsg(data.message || "Server error");
          cleanup();
          break;
      }
    },
    [cleanup, startMicStreaming],
  );

  const startCall = useCallback(
    async (authToken: string, checkActive: () => boolean) => {
      try {
        let audioCtx = sharedAudioCtx;
        if (!audioCtx || audioCtx.state === "closed") {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtx = new AudioContextClass();
        }

        if (!checkActive()) return;

        audioCtxRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        if (!checkActive()) {
          if (!sharedAudioCtx) void audioCtx.close();
          return;
        }

        playerRef.current = new PCMPlayer(audioCtx);
        await playerRef.current.start();

        if (!checkActive()) {
          playerRef.current?.stop();
          if (!sharedAudioCtx) void audioCtx.close();
          return;
        }

        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });

        if (!checkActive()) {
          micStream.getTracks().forEach((track) => track.stop());
          if (!sharedAudioCtx) void audioCtx.close();
          return;
        }

        const ws = await openVoiceSocketWithFallback(authToken);

        if (!checkActive()) {
          ws.close();
          micStream.getTracks().forEach((track) => track.stop());
          playerRef.current?.stop();
          if (!sharedAudioCtx) void audioCtx.close();
          return;
        }

        micStreamRef.current = micStream;
        wsRef.current = ws;
        statusRef.current = "active";
        setStatus("active");

        // Start keep-alive ping loop every 25 seconds to prevent Azure Container App TCP idle timeout
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log("[Voice] Sending keep-alive ping to server.");
            wsRef.current.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);

        ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            try {
              const byteLen = event.data.byteLength;
              if (byteLen % 2 !== 0) {
                console.warn(`[Voice] Received odd byte length: ${byteLen}`);
              }
              const pcm16 = new Int16Array(event.data, 0, Math.floor(byteLen / 2));
              if (Math.random() < 0.05) {
                console.log(`[Voice] Received binary audio packet from backend: ${byteLen} bytes, decoded to ${pcm16.length} samples.`);
              }
              playerRef.current?.play(pcm16);
            } catch (err) {
              console.error("[Voice] Failed to decode binary audio packet:", err);
            }
            return;
          }
          if (typeof event.data !== "string") return;
          console.log("[Voice] Received websocket text message from backend:", event.data);
          try {
            handleServerMessage(JSON.parse(event.data) as VoiceMsg, ws);
          } catch (err) {
            console.error("[Voice] Failed to parse websocket text message:", err);
          }
        };

        // Flush any early messages that were buffered on the socket
        const early = (ws as any)._earlyMessages as MessageEvent[];
        if (early && early.length > 0) {
          console.log(`[Voice] Flushing ${early.length} early buffered messages`);
          for (const msgEvent of early) {
            ws.onmessage?.(msgEvent);
          }
        }

        ws.onerror = () => {
          setStatus("error");
          setErrorMsg("Unable to connect to the voice server right now.");
          cleanup();
        };

        ws.onclose = (event) => {
          if (statusRef.current === "error") return;
          if (event.code !== 1000) {
            statusRef.current = "error";
            setStatus("error");
            setErrorMsg(
              event.code === 1006
                ? "The connection dropped. Please try again."
                : `Call ended unexpectedly (code ${event.code}).`,
            );
          } else {
            statusRef.current = "ended";
            setStatus("ended");
            setTimeout(() => onCloseRef.current(), 1200);
          }
          cleanup();
        };
      } catch (error) {
        statusRef.current = "error";
        setStatus("error");
        const message = error instanceof Error ? error.message : "";
        setErrorMsg(
          message.includes("Permission") || message.includes("NotAllowed")
            ? "Please allow microphone access in your browser settings."
            : "We could not start the voice assistant. Please try again.",
        );
        cleanup();
      }
    },
    [cleanup, handleServerMessage, sharedAudioCtx],
  );

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn || !token) {
      setStatus("error");
      setErrorMsg("Please sign in first to use the Nazeef voice assistant.");
      return;
    }

    let isEffectActive = true;

    void startCall(token, () => isEffectActive);
    timerRef.current = setInterval(() => setCallDuration((previous) => previous + 1), 1000);

    // Periodic checker to auto-resume AudioContext if it gets suspended
    checkIntervalRef.current = setInterval(() => {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        console.log("[Voice] AudioContext is suspended. Attempting periodic auto-resume...");
        audioCtxRef.current.resume().catch((err) => console.warn("[Voice] Periodic auto-resume failed:", err));
      }
    }, 5000);

    // Gesture auto-resumer on user click or touch
    const handleGesture = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        console.log("[Voice] Resuming AudioContext on user gesture (click/touch)");
        audioCtxRef.current.resume().catch((err) => console.error("[Voice] Gesture auto-resume failed:", err));
      }
    };
    window.addEventListener("click", handleGesture, { passive: true });
    window.addEventListener("touchstart", handleGesture, { passive: true });

    return () => {
      isEffectActive = false;
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
      cleanup();
    };
  }, [isAuthReady, isLoggedIn, token, startCall, cleanup]);

  const endCall = () => {
    statusRef.current = "ended";
    setStatus("ended");
    wsRef.current?.close(1000, "User ended");
    cleanup();
    setTimeout(() => onCloseRef.current(), 800);
  };

  const toggleMute = () => {
    setIsMuted((muted) => {
      isMutedRef.current = !muted;
      return !muted;
    });
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="ndeef-voice-widget fixed inset-0 z-[70] flex items-center justify-center bg-white/82 p-4 backdrop-blur-md">
      <div className="ndeef-voice-card relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-[2.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbfd)] p-6 text-center shadow-[0_30px_90px_rgba(15,23,42,0.16)]">
        <div className="ndeef-voice-glow pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(64,165,194,0.16),transparent_70%)]" />

        <div className="relative mb-4 mt-1">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-[#1D6076] via-[#2d89a3] to-[#40A5C2] p-1.5 shadow-[0_0_42px_rgba(64,165,194,0.30)]">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-slate-200 bg-white">
              <Monogram variant="orange" size={56} className="mb-2" useImage={true} />
              {status === "active" && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold tracking-[0.24em] text-emerald-300">
                  LIVE
                </span>
              )}
            </div>
          </div>
          {status === "active" && isListening && !isMuted && (
            <div className="absolute -inset-2 rounded-full border-2 border-dashed border-cyan-400/50 animate-spin" />
          )}
        </div>

        <div className="mb-1 flex items-center gap-2">
          <h2
            className="text-2xl font-black tracking-[0.08em] text-slate-950"
            style={{ fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}
          >
            NAZEEF
          </h2>
          <Sparkles className="h-4 w-4 text-cyan-400" />
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#1D6076]/70">
          AI Voice Assistant
        </p>

        <div className="mb-4 min-h-9 text-sm">
          {status === "connecting" && (
            <span className="flex items-center justify-center gap-2 text-cyan-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
            </span>
          )}
          {status === "active" && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-mono text-slate-500">{formatTime(callDuration)}</span>
              {isAssistantSpeaking && <span className="text-xs text-cyan-400">Nazeef is responding...</span>}
              {isListening && !isMuted && <span className="text-xs text-emerald-400">Listening now...</span>}
              {isMuted && <span className="text-xs text-yellow-400">Microphone muted</span>}
            </div>
          )}
          {status === "error" && <p className="px-2 text-xs text-red-400">{errorMsg}</p>}
        </div>

        <div className="mb-5 w-full">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-widest text-slate-400">Live Transcript</span>
            {status === "active" && !isMuted && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  heardYou
                    ? "bg-emerald-500/25 text-emerald-300"
                    : micBytesReceived > 500
                      ? "bg-cyan-500/25 text-cyan-300"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {heardYou ? "Heard you" : micBytesReceived > 500 ? "Mic active" : "Start talking"}
              </span>
            )}
          </div>

          <div className="ndeef-voice-transcript h-48 space-y-3 overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbfd,#ffffff)] p-4 text-right shadow-inner shadow-slate-200/70">
            <div className="ndeef-voice-transcript-user rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3">
              <p className="mb-1 flex items-center justify-end gap-1 text-[10px] font-bold text-cyan-400">
                <Mic className="h-3 w-3" /> You
              </p>
              <p className="text-sm leading-relaxed text-slate-700" dir="auto">
                {userTranscript || (
                  <span className="italic text-slate-400">
                    {micBytesReceived > 500 ? "Speak now..." : "Waiting for your voice..."}
                  </span>
                )}
              </p>
            </div>

            <div className="ndeef-voice-transcript-assistant rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] p-3">
              <p className="mb-1 flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-400">
                <Volume2 className="h-3 w-3" /> Nazeef
              </p>
              <p className="text-sm leading-relaxed text-[#1D6076]" dir="auto">
                {assistantTranscript || (
                  <span className="italic text-slate-400">
                    {isAssistantSpeaking ? "Preparing response..." : "Nazeef will reply here"}
                  </span>
                )}
              </p>
            </div>
            <div ref={transcriptEndRef} />
          </div>
        </div>

        <div className="flex gap-5">
          <button
            type="button"
            onClick={toggleMute}
            disabled={status !== "active"}
            className={`ndeef-voice-mute-button flex h-14 w-14 items-center justify-center rounded-full border shadow-lg transition-all ${
              isMuted
                ? "bg-yellow-500 text-black shadow-yellow-500/20"
                : "border-slate-200 bg-white text-slate-700 shadow-slate-200/80"
            } disabled:opacity-40`}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <button
            type="button"
            onClick={endCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_14px_32px_rgba(220,38,38,0.45)] transition-transform hover:scale-[1.03]"
          >
            <PhoneOff size={24} />
          </button>
        </div>

        {(status === "error" || status === "ended") && (
          <button type="button" onClick={onClose} className="absolute left-4 top-4 p-2 text-slate-400 transition hover:text-slate-700">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
