import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { PhoneOff, Mic, Loader2, Volume2, ShieldCheck } from "lucide-react";
import { apiRequest, useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
type CallRole = "caller" | "callee";
type CallStatus = "ringing" | "active" | "ended";
type CallCandidate = RTCIceCandidateInit;
interface CallState {
  id: string;
  role: CallRole;
  status: CallStatus;
  offer?: RTCSessionDescriptionInit | null;
  answer?: RTCSessionDescriptionInit | null;
  remoteCandidates?: CallCandidate[];
}
function displayError(error: unknown) {
  return error instanceof Error ? error.message : "تعذر بدء المكالمة";
}
export default function Call() {
  const [, params] = useRoute("/call/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const callId = params?.id || "";
  const [status, setStatus] = useState<
    "connecting" | "ringing" | "active" | "ended" | "error"
  >("connecting");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteDescriptionSetRef = useRef(false);
  const processedCandidatesRef = useRef(new Set<string>());
  const mountedRef = useRef(true);
  useEffect(() => {
    if (status !== "active") return;
    const timer = window.setInterval(() => setSeconds(v => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);
  useEffect(() => {
    mountedRef.current = true;
    if (!callId || !user) return;
    let disposed = false;
    let pollTimer: number | undefined;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerRef.current = pc;
    const postCandidate = async (candidate: RTCIceCandidate) => {
      try {
        await apiRequest(`/calls/${callId}/candidates`, {
          method: "POST",
          body: JSON.stringify({ candidate: candidate.toJSON() }),
        });
      } catch {}
    };
    pc.onicecandidate = e => {
      if (e.candidate) void postCandidate(e.candidate);
    };
    pc.ontrack = e => {
      const audio = remoteAudioRef.current;
      if (!audio) return;
      audio.srcObject = e.streams[0];
      void audio.play().catch(() => undefined);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected" && mountedRef.current)
        setStatus("active");
      if (
        ["failed", "disconnected", "closed"].includes(pc.connectionState) &&
        mountedRef.current
      )
        setStatus("ended");
    };
    const addRemoteCandidates = async (candidates: CallCandidate[] = []) => {
      if (!remoteDescriptionSetRef.current) return;
      for (const candidate of candidates) {
        const key = JSON.stringify(candidate);
        if (processedCandidatesRef.current.has(key)) continue;
        processedCandidatesRef.current.add(key);
        try {
          await pc.addIceCandidate(candidate);
        } catch {}
      }
    };
    const applyState = async (state: CallState) => {
      if (state.status === "ended") {
        if (mountedRef.current) setStatus("ended");
        return;
      }
      if (
        state.role === "caller" &&
        state.answer &&
        !remoteDescriptionSetRef.current
      ) {
        await pc.setRemoteDescription(state.answer);
        remoteDescriptionSetRef.current = true;
      }
      if (
        state.role === "callee" &&
        state.offer &&
        !remoteDescriptionSetRef.current
      ) {
        await pc.setRemoteDescription(state.offer);
        remoteDescriptionSetRef.current = true;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await apiRequest(`/calls/${callId}/answer`, {
          method: "POST",
          body: JSON.stringify({ answer }),
        });
        if (mountedRef.current) setStatus("active");
      }
      await addRemoteCandidates(state.remoteCandidates);
      if (state.status === "active" && mountedRef.current) setStatus("active");
    };
    const poll = async () => {
      if (disposed) return;
      try {
        const state = (await apiRequest(`/calls/${callId}`)) as CallState;
        await applyState(state);
      } catch (pollError) {
        if (!disposed && mountedRef.current) {
          setError(displayError(pollError));
          setStatus("error");
        }
      }
    };
    const setup = async () => {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("المتصفح لا يدعم المكالمات الصوتية داخل التطبيق");
      const initialState = (await apiRequest(`/calls/${callId}`)) as CallState;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      streamRef.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      if (initialState.role === "caller") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await apiRequest(`/calls/${callId}/offer`, {
          method: "POST",
          body: JSON.stringify({ offer }),
        });
        if (mountedRef.current) setStatus("ringing");
      } else await applyState(initialState);
      await poll();
      pollTimer = window.setInterval(() => void poll(), 900);
    };
    void setup().catch(setupError => {
      if (!disposed && mountedRef.current) {
        setError(displayError(setupError));
        setStatus("error");
      }
    });
    return () => {
      disposed = true;
      mountedRef.current = false;
      if (pollTimer) window.clearInterval(pollTimer);
      pc.close();
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      peerRef.current = null;
    };
  }, [callId, user]);
  const endCall = async () => {
    try {
      await apiRequest(`/calls/${callId}/end`, { method: "POST" });
    } catch {}
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());
    setStatus("ended");
    window.setTimeout(() => setLocation("/messages"), 250);
  };
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  const statusLabel =
    status === "active"
      ? `${minutes}:${remainingSeconds}`
      : status === "ringing"
        ? "بانتظار الرد..."
        : status === "connecting"
          ? "جاري تجهيز المكالمة..."
          : status === "ended"
            ? "انتهت المكالمة"
            : error;
  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-between overflow-hidden bg-primary px-6 py-12 text-center text-primary-foreground sm:py-16"
      dir="rtl"
    >
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
      <div className="pointer-events-none absolute -right-28 top-10 h-72 w-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -left-40 bottom-8 h-96 w-96 rounded-full border border-accent/10" />
      <div className="relative flex flex-col items-center gap-6 pt-4">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
          <ShieldCheck className="h-4 w-4 text-accent" />
          اتصال آمن داخل فزعة
        </div>
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-accent/70 bg-white/10 shadow-2xl shadow-black/20">
          {(status === "ringing" || status === "connecting") && (
            <span className="absolute inset-[-14px] animate-pulse rounded-full border border-accent/30" />
          )}
          <Volume2 className="relative h-12 w-12 text-accent" />
        </div>
        <div>
          <p className="text-sm text-white/65">مكالمة صوتية</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
            اتصال موثوق
          </h1>
          <p className="mt-3 text-sm text-white/70">{statusLabel}</p>
        </div>
      </div>
      <div className="relative w-full max-w-sm space-y-5 pb-2">
        {status === "error" && (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/20 px-4 py-3 text-sm leading-6 text-white">
            {error}
          </p>
        )}
        {status === "active" && (
          <div className="flex items-center justify-center gap-2 text-sm text-white/75">
            <Mic className="h-4 w-4" />
            الميكروفون يعمل داخل التطبيق
          </div>
        )}
        {status === "connecting" && (
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-accent" />
        )}
        <button
          type="button"
          onClick={endCall}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-black/20 transition-colors hover:bg-red-600"
          aria-label="إنهاء المكالمة"
        >
          <PhoneOff className="h-7 w-7" />
        </button>
        <p className="text-xs text-white/60">إنهاء المكالمة</p>
      </div>
    </div>
  );
}
