"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, Maximize, Eye } from "lucide-react";
import { api } from "@/lib/api";

interface ProctoringMonitorProps {
  attemptId: string;
  onViolation?: (type: string, severity: "low" | "medium" | "high") => void;
  children: React.ReactNode;
}

type FaceStatus = "loading" | "ok" | "no_face" | "multiple" | "camera_denied" | "unavailable";

declare global {
  interface Window {
    FaceDetector?: new (options?: { maxDetectedFaces?: number; fastMode?: boolean }) => {
      detect: (image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    };
  }
}

function analyzeCanvasFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || video.videoWidth === 0 || video.videoHeight === 0) return "unavailable" as FaceStatus;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const frame = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let totalBrightness = 0;
  let skinLeft = 0;
  let skinRight = 0;
  let skinCenter = 0;

  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      const index = (y * canvas.width + x) * 4;
      const red = frame[index];
      const green = frame[index + 1];
      const blue = frame[index + 2];
      totalBrightness += (red + green + blue) / 3;

      const looksLikeSkin = red > 65 && green > 38 && blue > 18 && red > green && red - blue > 15;
      if (looksLikeSkin) {
        if (x < canvas.width * 0.42) skinLeft += 1;
        else if (x > canvas.width * 0.58) skinRight += 1;
        else skinCenter += 1;
      }
    }
  }

  const samples = (canvas.width / 2) * (canvas.height / 2);
  const averageBrightness = totalBrightness / samples;
  const skinTotal = skinLeft + skinRight + skinCenter;

  if (averageBrightness < 14 || skinTotal < 18) return "no_face";
  if (skinLeft > 85 && skinRight > 85 && skinCenter > 30) return "multiple";
  return "ok";
}

export function ProctoringMonitor({ attemptId, onViolation, children }: ProctoringMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceIntervalRef = useRef<number | null>(null);
  const sessionStartedRef = useRef(false);
  const lastLoggedFaceStatusRef = useRef<FaceStatus | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("loading");
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const logEvent = useCallback(async (
    event_type: string,
    severity: "low" | "medium" | "high",
    description: string,
    metadata?: Record<string, unknown>,
  ) => {
    setViolationCount(c => c + 1);
    onViolation?.(event_type, severity);
    try {
      await api(`/candidate/assessments/attempts/${attemptId}/proctoring/event`, {
        method: "POST",
        body: { event_type, severity, description, metadata: metadata ?? {} },
      });
    } catch {
      // Do not interrupt the assessment if event logging fails.
    }
  }, [attemptId, onViolation]);

  const showViolationWarning = useCallback((msg: string) => {
    setWarningMessage(msg);
    setShowWarning(true);
    window.setTimeout(() => setShowWarning(false), 4000);
  }, []);

  useEffect(() => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    api(`/candidate/assessments/attempts/${attemptId}/proctoring/start`, {
      method: "POST",
      body: {
        device_info: {
          browser: navigator.userAgent,
          screen_resolution: `${screen.width}x${screen.height}`,
        },
      },
    }).catch(() => {});
  }, [attemptId]);

  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch {
        // Browsers can block fullscreen until user interaction.
      }
    };

    requestFullscreen();

    const handleFullscreenChange = () => {
      const inFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(inFullscreen);
      if (!inFullscreen) {
        logEvent("fullscreen_exit", "medium", "Candidate exited fullscreen mode");
        showViolationWarning("Please return to fullscreen to continue.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [logEvent, showViolationWarning]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        logEvent("tab_switch", "high", "Candidate switched tabs or minimized the window");
        showViolationWarning("Tab switch detected. Stay on this page during the assessment.");
      }
    };

    const handleBlur = () => {
      logEvent("focus_loss", "medium", "Assessment window lost focus");
      showViolationWarning("Focus lost. Keep your attention on this window.");
    };

    const handleCopy = () => {
      logEvent("copy_paste", "medium", "Copy event detected");
      showViolationWarning("Copying is not allowed during the assessment.");
    };

    const handlePaste = () => {
      logEvent("copy_paste", "medium", "Paste event detected");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [logEvent, showViolationWarning]);

  useEffect(() => {
    let cancelled = false;
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;

    const publishFaceStatus = (nextStatus: FaceStatus) => {
      if (cancelled) return;
      setFaceStatus(nextStatus);

      if (nextStatus === lastLoggedFaceStatusRef.current) return;
      lastLoggedFaceStatusRef.current = nextStatus;

      if (nextStatus === "no_face") {
        logEvent("face_not_detected", "medium", "No face detected in camera view");
      }
      if (nextStatus === "multiple") {
        logEvent("multiple_faces", "high", "Multiple faces detected in camera view");
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setFaceStatus("camera_denied");
        logEvent("camera_disabled", "high", "Camera access denied or unavailable");
        return;
      }

      faceIntervalRef.current = window.setInterval(async () => {
        const video = videoRef.current;
        if (!video) return;

        if (window.FaceDetector) {
          try {
            const detector = new window.FaceDetector({ maxDetectedFaces: 5, fastMode: true });
            const faces = await detector.detect(video);
            if (faces.length === 0) publishFaceStatus("no_face");
            else if (faces.length >= 2) publishFaceStatus("multiple");
            else publishFaceStatus("ok");
            return;
          } catch {
            // Fall back to lightweight frame analysis below.
          }
        }

        publishFaceStatus(analyzeCanvasFrame(video, canvas));
      }, 2500);
    };

    startCamera();

    return () => {
      cancelled = true;
      if (faceIntervalRef.current) window.clearInterval(faceIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [logEvent]);

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => {});
  };

  const faceStatusColor =
    faceStatus === "ok" ? "green" :
    faceStatus === "no_face" || faceStatus === "multiple" ? "red" :
    "var(--muted)";

  const faceStatusLabel =
    faceStatus === "loading" ? "Starting camera..." :
    faceStatus === "ok" ? "Face detected" :
    faceStatus === "no_face" ? "No face detected" :
    faceStatus === "multiple" ? "Multiple faces" :
    faceStatus === "camera_denied" ? "Camera denied" :
    "Camera unavailable";

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="proctoring-status-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Eye size={14} />
          <span style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Proctored
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <span className={`proctoring-status-indicator ${isFullscreen ? "green" : "red"}`} />
            {isFullscreen ? "Fullscreen" : (
              <button
                onClick={enterFullscreen}
                style={{ fontSize: 12, color: "var(--danger)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <Maximize size={12} style={{ marginRight: 4 }} />Enter fullscreen
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <span className={`proctoring-status-indicator ${faceStatus === "ok" ? "green" : "red"}`} />
            {faceStatus === "camera_denied" || faceStatus === "unavailable" ? <CameraOff size={12} /> : <Camera size={12} />}
            <span>{faceStatusLabel}</span>
          </div>
          {violationCount > 0 && (
            <div className="violation-count">{violationCount} flag{violationCount !== 1 ? "s" : ""}</div>
          )}
        </div>
      </div>

      <video
        ref={videoRef}
        className={`video-preview ${faceStatus === "ok" ? "face-ok" : faceStatus === "no_face" || faceStatus === "multiple" ? "face-danger" : ""}`}
        muted
        playsInline
        aria-hidden="true"
        style={{ position: "fixed", bottom: 16, right: 16, width: 140, height: 105, borderRadius: 8, objectFit: "cover", border: `2px solid ${faceStatusColor}`, zIndex: 1000, opacity: 0.9 }}
      />

      {showWarning && (
        <div className="proctoring-overlay" style={{ zIndex: 2000 }}>
          <div className="proctoring-warning-box">
            <div style={{ fontSize: 24, marginBottom: 8 }}>!</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Violation detected</div>
            <div style={{ fontSize: 14, color: "var(--muted)" }}>{warningMessage}</div>
          </div>
        </div>
      )}

      <div style={{ paddingTop: 48 }}>{children}</div>
    </div>
  );
}

