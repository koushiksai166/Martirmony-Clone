import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, X } from "lucide-react";
import { getVideoToken } from "../../services/safety.service";
import { toast } from "react-toastify";

function VideoCallModal({ conversationId, otherName, onClose }) {
  const [token, setToken] = useState(null);
  const [appId, setAppId] = useState(null);
  const [joined, setJoined] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [loading, setLoading] = useState(true);

  const clientRef = useRef(null);
  const localTrackRef = useRef({ audio: null, video: null });
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    getVideoToken(conversationId)
      .then(({ data }) => {
        setAppId(data.appId);
        setToken(data.token);
      })
      .catch(() => toast.error("Unable to start video call"))
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    if (!appId) return;

    let mounted = true;

    const start = async () => {
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video" && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current);
          }
          if (mediaType === "audio") user.audioTrack?.play();
        });

        await client.join(appId, conversationId, token, null);

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTrackRef.current = { audio: audioTrack, video: videoTrack };

        if (localVideoRef.current) videoTrack.play(localVideoRef.current);
        await client.publish([audioTrack, videoTrack]);
        if (mounted) setJoined(true);
      } catch (err) {
        toast.error("Camera/microphone access required for video calls.");
      }
    };

    start();

    return () => {
      mounted = false;
      localTrackRef.current.audio?.close();
      localTrackRef.current.video?.close();
      clientRef.current?.leave();
    };
  }, [appId, token, conversationId]);

  const toggleVideo = async () => {
    const track = localTrackRef.current.video;
    if (!track) return;
    videoOn ? await track.setEnabled(false) : await track.setEnabled(true);
    setVideoOn((v) => !v);
  };

  const toggleAudio = async () => {
    const track = localTrackRef.current.audio;
    if (!track) return;
    audioOn ? await track.setEnabled(false) : await track.setEnabled(true);
    setAudioOn((a) => !a);
  };

  const endCall = async () => {
    localTrackRef.current.audio?.close();
    localTrackRef.current.video?.close();
    await clientRef.current?.leave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-800">
          <p className="text-white font-semibold">Video call with {otherName}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Video area */}
        <div className="relative bg-slate-900 h-80">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              Connecting…
            </div>
          )}
          {/* Remote video (full) */}
          <div ref={remoteVideoRef} className="h-full w-full" />
          {/* Local video (PiP) */}
          <div
            ref={localVideoRef}
            className="absolute bottom-3 right-3 h-28 w-20 rounded-lg overflow-hidden border-2 border-slate-600 bg-slate-800"
          />
          {!appId && !loading && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm text-center px-6">
              Video calls require Agora configuration.<br />Set AGORA_APP_ID in backend .env
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-4 bg-slate-800">
          <button
            onClick={toggleAudio}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition ${audioOn ? "bg-slate-600 hover:bg-slate-500 text-white" : "bg-red-600 text-white"}`}
          >
            {audioOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button
            onClick={endCall}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white transition"
          >
            <PhoneOff size={20} />
          </button>
          <button
            onClick={toggleVideo}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition ${videoOn ? "bg-slate-600 hover:bg-slate-500 text-white" : "bg-red-600 text-white"}`}
          >
            {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;
