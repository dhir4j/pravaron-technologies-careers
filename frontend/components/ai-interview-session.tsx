"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  ListChecks,
  LoaderCircle,
  Maximize,
  MessageSquare,
  Radio,
  Send,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { Feedback, LoadingBlock, StatusBadge } from "@/components/ui";
import type { AIInterview, AIInterviewQuestion } from "@/lib/types";
import type { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import type { Face, FaceLandmarksDetector, Keypoint } from "@tensorflow-models/face-landmarks-detection";

type Stage = "loading" | "ready" | "instructions" | "question" | "completed" | "error";
type FaceStatus = "loading" | "ok" | "no_face" | "multiple" | "look_away" | "mobile_detected" | "camera_denied" | "unavailable";
type Severity = "low" | "medium" | "high";
type FaceBox = { x: number; y: number; width: number; height: number };
type FrameAnalysis = {
  status: FaceStatus;
  confidence: number;
  metadata: Record<string, number | string | boolean>;
};
type VisionModels = { objectDetector: ObjectDetection | null; faceDetector: FaceLandmarksDetector | null };
type VisionStatus = "idle" | "loading" | "active" | "partial" | "fallback";

type StartResponse = {
  interview: AIInterview;
  next_question?: AIInterviewQuestion;
  total_questions?: number;
  time_limit_seconds?: number;
};

type SubmitResponse = {
  next_question: AIInterviewQuestion | null;
  completed: boolean;
  total_questions?: number;
};

declare global {
  interface Window {
    FaceDetector?: new (options?: { maxDetectedFaces?: number; fastMode?: boolean }) => {
      detect: (image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    };
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  aptitude: "Aptitude",
  gk: "General knowledge",
  technical: "Role technical",
};

function formatTime(seconds: number) {
  const minutes = Math.floor(Math.max(seconds, 0) / 60);
  const secs = Math.max(seconds, 0) % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getQuestionOptions(question: AIInterviewQuestion | null): string[] {
  if (!question) return [];
  return Array.isArray(question.options) ? question.options.filter(Boolean) : [];
}

function boxOverlapRatio(a: FaceBox, b: FaceBox) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const area = Math.max(1, a.width * a.height);
  return intersection / area;
}

function isSkinPixel(red: number, green: number, blue: number) {
  return red > 60 && green > 35 && blue > 18 && red > green * 1.05 && red > blue * 1.25 && Math.max(red, green, blue) - Math.min(red, green, blue) > 22;
}

function detectPhoneLikeObject(frame: Uint8ClampedArray, width: number, height: number, faceBoxes: FaceBox[]) {
  const visited = new Uint8Array(width * height);
  const isObjectPixel = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    const red = frame[index];
    const green = frame[index + 1];
    const blue = frame[index + 2];
    const brightness = (red + green + blue) / 3;
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
    if (isSkinPixel(red, green, blue)) return false;
    return brightness < 48 || (brightness > 205 && saturation < 62);
  };

  let best: null | { box: FaceBox; area: number; fill: number; aspect: number; skinRatio: number } = null;
  for (let y = Math.floor(height * 0.12); y < height - 2; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const start = y * width + x;
      if (visited[start] || !isObjectPixel(x, y)) continue;

      const queue: Array<[number, number]> = [[x, y]];
      visited[start] = 1;
      let area = 0;
      let skinPixels = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;

      for (let i = 0; i < queue.length; i += 1) {
        const [cx, cy] = queue[i];
        area += 1;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        const pixelIndex = (cy * width + cx) * 4;
        if (isSkinPixel(frame[pixelIndex], frame[pixelIndex + 1], frame[pixelIndex + 2])) skinPixels += 1;

        const neighbors: Array<[number, number]> = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for (const [nx, ny] of neighbors) {
          if (nx < 2 || nx >= width - 2 || ny < Math.floor(height * 0.12) || ny >= height - 2) continue;
          const next = ny * width + nx;
          if (!visited[next] && isObjectPixel(nx, ny)) {
            visited[next] = 1;
            queue.push([nx, ny]);
          }
        }
      }

      const box = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
      const boxArea = box.width * box.height;
      const frameArea = width * height;
      const fill = area / Math.max(boxArea, 1);
      const aspect = box.height / Math.max(box.width, 1);
      const reverseAspect = box.width / Math.max(box.height, 1);
      const skinRatio = skinPixels / Math.max(area, 1);
      const touchesBorder = box.x <= 3 || box.y <= 3 || box.x + box.width >= width - 3 || box.y + box.height >= height - 3;
      const overlapsFace = faceBoxes.some(face => boxOverlapRatio(box, face) > 0.22);
      const validShape = (aspect >= 1.35 && aspect <= 3.4) || (reverseAspect >= 1.35 && reverseAspect <= 2.6);
      const validSize = boxArea / frameArea >= 0.012 && boxArea / frameArea <= 0.24 && box.width >= width * 0.055 && box.height >= height * 0.09;

      if (!touchesBorder && !overlapsFace && validShape && validSize && fill >= 0.34 && skinRatio < 0.08) {
        if (!best || area > best.area) best = { box, area, fill, aspect, skinRatio };
      }
    }
  }

  return best;
}

function analyzeFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, faceBoxes: FaceBox[] = [], detectFallbackPhone = false): FrameAnalysis {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || video.videoWidth === 0 || video.videoHeight === 0) return { status: "unavailable", confidence: 0, metadata: {} };
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const frame = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let totalBrightness = 0;
  let skinLeft = 0;
  let skinCenter = 0;
  let skinRight = 0;
  const scaleX = canvas.width / Math.max(video.videoWidth, 1);
  const scaleY = canvas.height / Math.max(video.videoHeight, 1);
  const scaledFaces = faceBoxes.map(face => ({
    x: face.x * scaleX,
    y: face.y * scaleY,
    width: face.width * scaleX,
    height: face.height * scaleY,
  }));

  for (let y = 0; y < canvas.height; y += 3) {
    for (let x = 0; x < canvas.width; x += 3) {
      const index = (y * canvas.width + x) * 4;
      const red = frame[index];
      const green = frame[index + 1];
      const blue = frame[index + 2];
      const brightness = (red + green + blue) / 3;
      totalBrightness += brightness;
      if (isSkinPixel(red, green, blue)) {
        if (x < canvas.width * 0.36) skinLeft += 1;
        else if (x > canvas.width * 0.64) skinRight += 1;
        else skinCenter += 1;
      }
    }
  }

  const samples = (canvas.width / 3) * (canvas.height / 3);
  const averageBrightness = totalBrightness / samples;
  const skinTotal = skinLeft + skinCenter + skinRight;
  const phone = detectFallbackPhone ? detectPhoneLikeObject(frame, canvas.width, canvas.height, scaledFaces) : null;
  if (phone) {
    return {
      status: "mobile_detected",
      confidence: Math.min(1.4, 0.75 + phone.fill),
      metadata: {
        object_area: phone.area,
        object_fill: Number(phone.fill.toFixed(2)),
        object_aspect: Number(phone.aspect.toFixed(2)),
      },
    };
  }

  const metadata = {
    average_brightness: Number(averageBrightness.toFixed(1)),
    skin_pixels: skinTotal,
    skin_left: skinLeft,
    skin_center: skinCenter,
    skin_right: skinRight,
  };
  if (averageBrightness < 14 || skinTotal < 12) return { status: "no_face", confidence: 0.8, metadata };
  if ((skinLeft > skinCenter * 2.35 || skinRight > skinCenter * 2.35) && skinCenter < 28 && skinTotal > 42) {
    return { status: "look_away", confidence: 0.75, metadata };
  }
  return { status: "ok", confidence: 1, metadata };
}

function pointAt(points: Keypoint[], index: number) {
  const point = points[index];
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return point;
}

function averageKeypoints(points: Keypoint[], indexes: number[]) {
  const selected = indexes.map(index => pointAt(points, index)).filter((point): point is Keypoint => Boolean(point));
  if (!selected.length) return null;
  return {
    x: selected.reduce((sum, point) => sum + point.x, 0) / selected.length,
    y: selected.reduce((sum, point) => sum + point.y, 0) / selected.length,
  };
}

function getLandmarkGazeAnalysis(face: Face, videoWidth: number, videoHeight: number): FrameAnalysis | null {
  const points = face.keypoints ?? [];
  const nose = pointAt(points, 1) ?? pointAt(points, 4);
  const leftEyeOuter = pointAt(points, 33);
  const leftEyeInner = pointAt(points, 133);
  const rightEyeInner = pointAt(points, 362);
  const rightEyeOuter = pointAt(points, 263);
  const leftIris = averageKeypoints(points, [468, 469, 470, 471, 472]);
  const rightIris = averageKeypoints(points, [473, 474, 475, 476, 477]);

  const faceCenterX = face.box.xMin + face.box.width / 2;
  const faceCenterY = face.box.yMin + face.box.height / 2;
  const normalizedFaceX = faceCenterX / Math.max(videoWidth, 1);
  const normalizedFaceY = faceCenterY / Math.max(videoHeight, 1);
  const faceAreaRatio = (face.box.width * face.box.height) / Math.max(videoWidth * videoHeight, 1);
  const noseBoxRatio = nose ? (nose.x - faceCenterX) / Math.max(face.box.width, 1) : 0;

  if (normalizedFaceX < 0.18 || normalizedFaceX > 0.82 || normalizedFaceY < 0.12 || normalizedFaceY > 0.9) {
    return {
      status: "look_away",
      confidence: 0.8,
      metadata: {
        source: "mediapipe_face_position",
        center_x: Number(normalizedFaceX.toFixed(2)),
        center_y: Number(normalizedFaceY.toFixed(2)),
        face_area_ratio: Number(faceAreaRatio.toFixed(3)),
      },
    };
  }

  if (nose && leftEyeOuter && rightEyeOuter) {
    const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
    const eyeDistance = Math.max(Math.abs(rightEyeOuter.x - leftEyeOuter.x), 1);
    const yawRatio = (nose.x - eyeMidX) / eyeDistance;
    const pitchRatio = (nose.y - eyeMidY) / Math.max(face.box.height, 1);
    if (Math.abs(yawRatio) > 0.08 || Math.abs(noseBoxRatio) > 0.045 || pitchRatio < 0.15 || pitchRatio > 0.48) {
      return {
        status: "look_away",
        confidence: Math.min(1.35, 0.95 + Math.max(Math.abs(yawRatio), Math.abs(noseBoxRatio))),
        metadata: {
          source: "mediapipe_head_pose",
          yaw_ratio: Number(yawRatio.toFixed(2)),
          nose_box_ratio: Number(noseBoxRatio.toFixed(2)),
          pitch_ratio: Number(pitchRatio.toFixed(2)),
          face_area_ratio: Number(faceAreaRatio.toFixed(3)),
        },
      };
    }
  }

  if (leftEyeOuter && leftEyeInner && rightEyeInner && rightEyeOuter && leftIris && rightIris) {
    const leftRatio = (leftIris.x - leftEyeOuter.x) / Math.max(leftEyeInner.x - leftEyeOuter.x, 1);
    const rightRatio = (rightIris.x - rightEyeInner.x) / Math.max(rightEyeOuter.x - rightEyeInner.x, 1);
    const averageRatio = (leftRatio + rightRatio) / 2;
    if (averageRatio < 0.38 || averageRatio > 0.62) {
      return {
        status: "look_away",
        confidence: 1.15,
        metadata: {
          source: "mediapipe_iris_direction",
          iris_ratio: Number(averageRatio.toFixed(2)),
          left_iris_ratio: Number(leftRatio.toFixed(2)),
          right_iris_ratio: Number(rightRatio.toFixed(2)),
        },
      };
    }
  }

  return null;
}

function analyzeModelObjects(objects: DetectedObject[], videoWidth: number, videoHeight: number, faceBoxes: FaceBox[]): FrameAnalysis | null {
  const frameArea = Math.max(videoWidth * videoHeight, 1);
  const phones = objects.filter(item => {
    const [x, y, width, height] = item.bbox;
    const box = { x, y, width, height };
    const areaRatio = (width * height) / frameArea;
    return item.class === "cell phone" && item.score >= 0.28 && areaRatio >= 0.0035 && !faceBoxes.some(face => boxOverlapRatio(box, face) > 0.3);
  });
  if (phones.length) {
    const best = phones.sort((a, b) => b.score - a.score)[0];
    const [x, y, width, height] = best.bbox;
    return {
      status: "mobile_detected",
      confidence: Math.min(1.6, 1.1 + best.score),
      metadata: {
        source: "coco_ssd",
        object_class: best.class,
        object_score: Number(best.score.toFixed(2)),
        object_x: Math.round(x),
        object_y: Math.round(y),
        object_width: Math.round(width),
        object_height: Math.round(height),
      },
    };
  }

  const people = objects.filter(item => {
    const [, , width, height] = item.bbox;
    const areaRatio = (width * height) / frameArea;
    return item.class === "person" && item.score >= 0.58 && areaRatio >= 0.035;
  });
  if (people.length > 1) {
    return {
      status: "multiple",
      confidence: 1.1,
      metadata: {
        source: "coco_ssd",
        person_count: people.length,
        best_person_score: Number(Math.max(...people.map(person => person.score)).toFixed(2)),
      },
    };
  }

  return null;
}
export function AIInterviewSession({ interviewId, accessCode, publicMode = false }: { interviewId: string; accessCode?: string; publicMode?: boolean }) {
  const [stage, setStage] = useState<Stage>("loading");
  const [interview, setInterview] = useState<AIInterview | null>(null);
  const [question, setQuestion] = useState<AIInterviewQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [selectedOption, setSelectedOption] = useState("");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("loading");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [warning, setWarning] = useState("");
  const [messages, setMessages] = useState<AIInterview["admin_messages"]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [visionStatus, setVisionStatus] = useState<VisionStatus>("idle");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedRef = useRef(false);
  const questionStartedAtRef = useRef<number | null>(null);
  const eventCooldownRef = useRef<Record<string, number>>({});
  const warningCooldownRef = useRef<Record<string, number>>({});
  const repeatedStatusRef = useRef<Record<string, number>>({});
  const analysisInFlightRef = useRef(false);
  const visionModelsRef = useRef<VisionModels>({ objectDetector: null, faceDetector: null });
  const visionPromiseRef = useRef<Promise<void> | null>(null);

  const options = useMemo(() => getQuestionOptions(question), [question]);
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const interviewApiPath = useCallback((suffix = "") => {
    const base = `/candidate/interviews/ai/${interviewId}${suffix}`;
    return accessCode ? `${base}?access_code=${encodeURIComponent(accessCode)}` : base;
  }, [accessCode, interviewId]);
  const withAccessCode = useCallback((body: Record<string, unknown> = {}) => (
    accessCode ? { ...body, access_code: accessCode } : body
  ), [accessCode]);

  const loadInterview = useCallback(async () => {
    try {
      const data = await api<{ interview: AIInterview }>(interviewApiPath());
      setInterview(data.interview);
      setMessages(data.interview.admin_messages ?? []);
      setTotalQuestions(data.interview.mcq_config?.total_questions ?? data.interview.question_count ?? 30);
      if (data.interview.status === "completed" || data.interview.status === "reviewed") setStage("completed");
      else setStage("ready");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load interview");
      setStage("error");
    }
  }, [interviewApiPath]);

  const showWarning = useCallback((message: string) => {
    setWarning(message);
    window.setTimeout(() => setWarning(""), 4200);
  }, []);

  const logEvent = useCallback(async (event_type: string, severity: Severity, description: string, metadata?: Record<string, unknown>) => {
    const now = Date.now();
    const cooldown = event_type === "mobile_detected" ? 7000 : event_type === "look_away" ? 10000 : severity === "high" ? 45000 : severity === "medium" ? 30000 : 45000;
    if (now - (eventCooldownRef.current[event_type] ?? 0) < cooldown) return;
    eventCooldownRef.current[event_type] = now;
    setFlagCount(value => value + 1);
    try {
      await api(interviewApiPath("/proctoring/event"), {
        method: "POST",
        body: withAccessCode({ event_type, severity, description, metadata: metadata ?? {} }),
      });
    } catch {
      // Security logging should never block answering a question.
    }
  }, [interviewApiPath, withAccessCode]);

  const loadVisionModels = useCallback(async () => {
    if (visionPromiseRef.current) return visionPromiseRef.current;
    setVisionStatus("loading");
    visionPromiseRef.current = (async () => {
      let objectDetector: ObjectDetection | null = null;
      let faceDetector: FaceLandmarksDetector | null = null;
      try {
        const [tf, cocoSsd, faceLandmarks] = await Promise.all([
          import("@tensorflow/tfjs"),
          import("@tensorflow-models/coco-ssd"),
          import("@tensorflow-models/face-landmarks-detection"),
          import("@tensorflow/tfjs-backend-webgl"),
        ]);
        await tf.setBackend("webgl").catch(async () => { await tf.setBackend("cpu"); });
        await tf.ready();

        const [objectResult, faceResult] = await Promise.allSettled([
          cocoSsd.load({ base: "lite_mobilenet_v2" }),
          faceLandmarks.createDetector(faceLandmarks.SupportedModels.MediaPipeFaceMesh, {
            runtime: "mediapipe",
            refineLandmarks: true,
            maxFaces: 2,
            solutionPath: `${window.location.origin}/mediapipe/face_mesh`,
          }),
        ]);

        if (objectResult.status === "fulfilled") objectDetector = objectResult.value;
        else console.warn("COCO-SSD object detector failed; phone detection disabled until it loads.", objectResult.reason);

        if (faceResult.status === "fulfilled") {
          faceDetector = faceResult.value;
        } else {
          console.warn("MediaPipe FaceMesh failed; trying TFJS FaceMesh fallback.", faceResult.reason);
          try {
            faceDetector = await faceLandmarks.createDetector(faceLandmarks.SupportedModels.MediaPipeFaceMesh, {
              runtime: "tfjs",
              refineLandmarks: true,
              maxFaces: 2,
            });
          } catch (tfjsFaceErr) {
            console.warn("TFJS FaceMesh fallback failed; using browser face fallback.", tfjsFaceErr);
          }
        }
      } catch (err) {
        console.warn("Vision proctoring imports failed; using browser fallback.", err);
      }

      visionModelsRef.current = { objectDetector, faceDetector };
      if (objectDetector && faceDetector) setVisionStatus("active");
      else if (objectDetector || faceDetector) setVisionStatus("partial");
      else setVisionStatus("fallback");
    })();
    return visionPromiseRef.current;
  }, []);
  useEffect(() => { loadInterview(); }, [loadInterview]);

  useEffect(() => {
    if (stage !== "question") return;
    const timer = window.setInterval(() => {
      setRemainingSeconds(value => {
        if (value <= 1) {
          window.clearInterval(timer);
          void completeInterview();
          return 0;
        }
        return value - 1;
      });
      if (questionStartedAtRef.current) setQuestionSeconds(Math.floor((Date.now() - questionStartedAtRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (stage !== "question") return;
    const poll = window.setInterval(async () => {
      try {
        const data = await api<{ messages: AIInterview["admin_messages"] }>(interviewApiPath("/messages"));
        setMessages(data.messages ?? []);
      } catch {}
    }, 6000);
    return () => window.clearInterval(poll);
  }, [interviewApiPath, stage]);

  useEffect(() => {
    if (stage !== "question") return;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        logEvent("tab_switch", "high", "Candidate switched tabs or minimized the interview window");
        showWarning("Tab switch or minimize detected. Stay on the interview screen.");
      }
    };
    const handleBlur = () => {
      window.setTimeout(() => {
        if (document.visibilityState !== "visible" || !document.hasFocus()) {
          logEvent("focus_loss", "medium", "Interview window lost focus");
          showWarning("Window focus was lost. Keep the interview window active.");
        }
      }, 1500);
    };
    const handleFullscreen = () => {
      const full = Boolean(document.fullscreenElement);
      setIsFullscreen(full);
      if (!full) {
        logEvent("fullscreen_exit", "medium", "Candidate exited fullscreen mode");
        showWarning("Please return to fullscreen mode.");
      }
    };
    const handleCopyPaste = () => {
      logEvent("copy_paste", "medium", "Copy, cut, or paste detected during interview");
      showWarning("Copy and paste are not allowed during the MCQ interview.");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
    };
  }, [logEvent, showWarning, stage]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (typeof MediaRecorder !== "undefined") {
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
        recorderRef.current = recorder;
        recorder.start(2000);
      }
    } catch {
      setFaceStatus("camera_denied");
      await logEvent("camera_disabled", "high", "Camera access denied or unavailable");
      throw new Error("Camera access is required before starting the interview.");
    }
  }, [logEvent]);

  useEffect(() => {
    if (stage !== "question") return;
    const canvas = document.createElement("canvas");
    canvas.width = 224;
    canvas.height = 168;
    canvasRef.current = canvas;
    void loadVisionModels();

    const warnOnce = (key: string, message: string, cooldownMs = 18000) => {
      const now = Date.now();
      if (now - (warningCooldownRef.current[key] ?? 0) < cooldownMs) return;
      warningCooldownRef.current[key] = now;
      showWarning(message);
    };

    const publishAnalysis = (analysis: FrameAnalysis) => {
      const status = analysis.status;

      if (status === "ok") {
        repeatedStatusRef.current = {};
        setFaceStatus("ok");
        return;
      }
      if (status === "loading" || status === "unavailable" || status === "camera_denied") {
        setFaceStatus(status);
        return;
      }

      for (const key of Object.keys(repeatedStatusRef.current)) {
        if (key !== status) repeatedStatusRef.current[key] = Math.max(0, repeatedStatusRef.current[key] - 1.6);
      }
      const nextScore = (repeatedStatusRef.current[status] ?? 0) + Math.max(0.5, analysis.confidence);
      repeatedStatusRef.current[status] = nextScore;

      const thresholds: Record<string, { warn: number; flag: number; severity: Severity; eventType: string; description: string; warning: string }> = {
        no_face: {
          warn: 2.2,
          flag: 4.4,
          severity: "medium",
          eventType: "face_not_detected",
          description: "No face detected in camera view for multiple checks",
          warning: "Face not visible. Keep your face clearly inside the camera frame.",
        },
        multiple: {
          warn: 2.4,
          flag: 4.2,
          severity: "high",
          eventType: "multiple_faces",
          description: "Multiple clear faces detected in camera view across repeated checks",
          warning: "Only one candidate should be visible in the camera frame.",
        },
        look_away: {
          warn: 0.75,
          flag: 2.4,
          severity: "low",
          eventType: "look_away",
          description: "Candidate continued looking away from the screen after warning",
          warning: "Please keep your attention on the interview screen.",
        },
        mobile_detected: {
          warn: 0.9,
          flag: 1.15,
          severity: "high",
          eventType: "mobile_detected",
          description: "Cell phone detected by object model across repeated checks",
          warning: "Phone or second device detected. Remove it from the camera view.",
        },
      };
      const config = thresholds[status];
      if (!config) return;

      if (nextScore < config.warn) {
        setFaceStatus("ok");
        return;
      }
      setFaceStatus(status);
      warnOnce(status, config.warning, status === "mobile_detected" ? 3500 : status === "look_away" ? 5000 : 18000);
      if (nextScore < config.flag) return;
      logEvent(config.eventType, config.severity, config.description, { ...analysis.metadata, evidence_score: Number(nextScore.toFixed(1)) });
    };

    const analyzeWithVisionModels = async (video: HTMLVideoElement): Promise<FrameAnalysis> => {
      const videoWidth = video.videoWidth || 1;
      const videoHeight = video.videoHeight || 1;
      const frameArea = videoWidth * videoHeight;
      const models = visionModelsRef.current;
      let landmarkFaces: Face[] = [];

      if (models.objectDetector) {
        try {
          const objects = await models.objectDetector.detect(video, 12, 0.25);
          const objectAnalysis = analyzeModelObjects(objects, videoWidth, videoHeight, []);
          if (objectAnalysis) return objectAnalysis;
        } catch (err) {
          console.warn("Object detection failed; using fallback object checks.", err);
        }
      }

      if (models.faceDetector) {
        try {
          landmarkFaces = await models.faceDetector.estimateFaces(video, { flipHorizontal: false, staticImageMode: false });
        } catch (err) {
          console.warn("Face landmark estimate failed; using fallback face checks.", err);
        }
      }

      if (landmarkFaces.length) {
        const meaningfulFaces = landmarkFaces.filter(face => {
          const areaRatio = (face.box.width * face.box.height) / Math.max(frameArea, 1);
          return areaRatio >= 0.012 && face.box.width >= videoWidth * 0.075 && face.box.height >= videoHeight * 0.095;
        });
        if (meaningfulFaces.length > 1) {
          return {
            status: "multiple",
            confidence: 1.2,
            metadata: { source: "mediapipe_face_mesh", clear_faces: meaningfulFaces.length, raw_faces: landmarkFaces.length },
          };
        }
        if (meaningfulFaces.length === 1) {
          const face = meaningfulFaces[0];
          const gazeAnalysis = getLandmarkGazeAnalysis(face, videoWidth, videoHeight);
          if (gazeAnalysis) return gazeAnalysis;
          return {
            status: "ok",
            confidence: 1,
            metadata: {
              source: "mediapipe_face_mesh",
              clear_faces: 1,
              face_area_ratio: Number(((face.box.width * face.box.height) / Math.max(frameArea, 1)).toFixed(3)),
            },
          };
        }
        return { status: "no_face", confidence: 0.65, metadata: { source: "mediapipe_face_mesh", raw_faces: landmarkFaces.length, reason: "face_too_small_or_unclear" } };
      }

      if (window.FaceDetector) {
        try {
          const detector = new window.FaceDetector({ maxDetectedFaces: 5, fastMode: false });
          const faces = await detector.detect(video);
          const faceBoxes = faces.map(face => ({
            x: face.boundingBox.x,
            y: face.boundingBox.y,
            width: face.boundingBox.width,
            height: face.boundingBox.height,
          }));
          const meaningfulFaces = faceBoxes.filter(face => {
            const areaRatio = (face.width * face.height) / frameArea;
            return areaRatio >= 0.012 && face.width >= videoWidth * 0.075 && face.height >= videoHeight * 0.095;
          });
          const frameAnalysis = analyzeFrame(video, canvas, meaningfulFaces, false);

          if (meaningfulFaces.length > 1) {
            return {
              status: "multiple",
              confidence: 1.15,
              metadata: { raw_faces: faces.length, clear_faces: meaningfulFaces.length, source: "native_face_detector" },
            };
          }
          if (meaningfulFaces.length === 1) {
            const face = meaningfulFaces[0];
            const centerX = (face.x + face.width / 2) / videoWidth;
            const centerY = (face.y + face.height / 2) / videoHeight;
            const areaRatio = (face.width * face.height) / frameArea;
            if (centerX < 0.2 || centerX > 0.8 || centerY < 0.14 || centerY > 0.88 || frameAnalysis.status === "look_away") {
              return {
                status: "look_away",
                confidence: frameAnalysis.status === "look_away" ? 1 : 0.75,
                metadata: { center_x: Number(centerX.toFixed(2)), center_y: Number(centerY.toFixed(2)), face_area_ratio: Number(areaRatio.toFixed(3)), source: "face_position" },
              };
            }
            return { status: "ok", confidence: 1, metadata: { clear_faces: 1, face_area_ratio: Number(areaRatio.toFixed(3)), source: "native_face_detector" } };
          }
          if (faces.length > 0) {
            return { status: "no_face", confidence: 0.55, metadata: { raw_faces: faces.length, clear_faces: 0, reason: "face_too_small_or_unclear", source: "native_face_detector" } };
          }
          return { ...frameAnalysis, status: frameAnalysis.status === "look_away" ? "no_face" : frameAnalysis.status, metadata: { ...frameAnalysis.metadata, source: "frame_heuristic" } };
        } catch {
          return analyzeFrame(video, canvas, [], false);
        }
      }

      return analyzeFrame(video, canvas, [], false);
    };
    const interval = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || analysisInFlightRef.current) return;
      analysisInFlightRef.current = true;
      try {
        publishAnalysis(await analyzeWithVisionModels(video));
      } finally {
        analysisInFlightRef.current = false;
      }
    }, 250);

    const frameInterval = window.setInterval(async () => {
      const video = videoRef.current;
      const context = canvas.getContext("2d");
      if (!video || !context || video.videoWidth === 0) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        await api(interviewApiPath("/live-frame"), {
          method: "POST",
          body: withAccessCode({ frame_data_url: canvas.toDataURL("image/jpeg", 0.42) }),
        });
      } catch {}
    }, 2000);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(frameInterval);
    };
  }, [interviewApiPath, loadVisionModels, logEvent, showWarning, stage, withAccessCode]);
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {});
  }, [stage]);
  async function startInterview() {
    if (startedRef.current) return;
    startedRef.current = true;
    setError("");
    try {
      await startCamera();
      await document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(Boolean(document.fullscreenElement));
      const data = await api<StartResponse>(interviewApiPath("/start"), { method: "POST", body: withAccessCode() });
      setInterview(data.interview);
      setQuestion(data.next_question ?? null);
      setTotalQuestions(data.total_questions ?? 30);
      setRemainingSeconds(data.time_limit_seconds ?? 3600);
      setQuestionIndex(data.next_question?.order ?? 1);
      setQuestionSeconds(0);
      setSelectedOption("");
      questionStartedAtRef.current = null;
      setStage("instructions");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start interview");
      startedRef.current = false;
    }
  }

  function beginQuestions() {
    questionStartedAtRef.current = Date.now();
    setQuestionSeconds(0);
    setStage("question");
  }

  async function uploadRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    await new Promise(resolve => window.setTimeout(resolve, 400));
    if (!chunksRef.current.length) return;
    const form = new FormData();
    form.append("recording", new Blob(chunksRef.current, { type: "video/webm" }), `interview-${interviewId}.webm`);
    if (accessCode) form.append("access_code", accessCode);
    try { await api(interviewApiPath("/recording"), { method: "POST", body: form }); } catch {}
  }

  async function completeInterview() {
    setSubmitting(true);
    try {
      await uploadRecording();
      await api(interviewApiPath("/complete"), { method: "POST", body: withAccessCode() });
      streamRef.current?.getTracks().forEach(track => track.stop());
      await loadInterview();
      setStage("completed");
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAnswer() {
    if (!question || submitting) return;
    if (!selectedOption) {
      setError("Select an answer before continuing.");
      return;
    }
    const durationSeconds = questionStartedAtRef.current ? Math.max(1, Math.floor((Date.now() - questionStartedAtRef.current) / 1000)) : Math.max(1, questionSeconds);
    setSubmitting(true);
    setError("");
    try {
      const data = await api<SubmitResponse>(interviewApiPath("/respond"), {
        method: "POST",
        body: withAccessCode({ question_id: question.id, response_text: selectedOption, duration_seconds: durationSeconds }),
      });
      setAnsweredCount(value => Math.min(totalQuestions, value + 1));
      if (data.completed || !data.next_question) {
        await completeInterview();
        return;
      }
      setQuestion(data.next_question);
      setQuestionIndex(data.next_question.order ?? questionIndex + 1);
      setSelectedOption("");
      setQuestionSeconds(0);
      questionStartedAtRef.current = Date.now();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "loading") return <div className="secure-interview-room center"><LoadingBlock label="Loading interview" /></div>;
  if (stage === "error") return <div className="secure-interview-room center"><Feedback tone="error">{error}</Feedback></div>;

  if (stage === "completed") {
    return (
      <div className="secure-interview-room center">
        <section className="secure-complete-panel">
          <div className="secure-success-mark"><CheckCircle2 size={34} /></div>
          <StatusBadge value={interview?.status ?? "completed"} />
          <h1>Round one submitted</h1>
          <p>{interview?.ai_summary?.overall ?? "Your MCQ interview has been submitted for human review."}</p>
          <div className="secure-score-grid">
            {Object.entries(interview?.ai_scores ?? {}).map(([key, value]) => (
              <div key={key}><span>{CATEGORY_LABELS[key] ?? key}</span><strong>{value}/10</strong></div>
            ))}
          </div>
          {publicMode ? null : <Link className="button button-primary" href="/candidate/interviews/ai">Back to interviews</Link>}
        </section>
      </div>
    );
  }

  if (stage === "ready") {
    return (
      <div className="secure-interview-room center">
        <section className="secure-start-panel">
          <div className="secure-start-icon"><ShieldCheck size={30} /></div>
          <p className="secure-kicker">Secured round one</p>
          <h1>{interview?.job_title ? `${interview.job_title} MCQ interview` : "MCQ interview"}</h1>
          <p>30 questions in 60 minutes: 12 aptitude, 6 general knowledge, and 12 role-based technical questions. Camera and fullscreen monitoring are required throughout.</p>
          <div className="secure-rule-grid">
            <div><ListChecks size={18} /><span>60% common questions</span></div>
            <div><Radio size={18} /><span>40% technical by role</span></div>
            <div><Camera size={18} /><span>Camera stays visible</span></div>
            <div><Eye size={18} /><span>Security events are logged</span></div>
          </div>
          <button className="button button-primary button-wide" onClick={startInterview}>Start secure MCQ interview</button>
          {error ? <Feedback tone="error">{error}</Feedback> : null}
        </section>
      </div>
    );
  }

  if (stage === "instructions") {
    return (
      <div className="secure-interview-room center">
        <video ref={videoRef} className="secure-hidden-video" muted playsInline />
        <section className="secure-start-panel">
          <div className="secure-start-icon"><CheckCircle2 size={30} /></div>
          <p className="secure-kicker">Camera verified</p>
          <h1>Ready for question 1</h1>
          <p>The interview is now live for admins. Stay on this page, keep your face visible, and do not use another device or switch windows.</p>
          <button className="button button-primary button-wide" onClick={beginQuestions} disabled={!question}>Begin MCQ round</button>
        </section>
      </div>
    );
  }

  const latestMessage = messages?.[messages.length - 1];

  return (
    <div className="secure-interview-room">
      <header className="secure-interview-topbar">
        <div>
          <p className="secure-kicker">Live proctored MCQ</p>
          <h1>{interview?.job_title ?? "Round one interview"}</h1>
        </div>
        <div className="secure-timer-stack">
          <span><Clock size={15} /> {formatTime(remainingSeconds)} left</span>
          <span>Question {questionIndex}/{totalQuestions}</span>
        </div>
      </header>

      <main className="secure-interview-layout">
        <aside className="secure-proctor-rail">
          <video ref={videoRef} className={`secure-camera ${faceStatus}`} muted playsInline />
          <div className="secure-proctor-status">
            <div><span className={isFullscreen ? "ok" : "bad"} />{isFullscreen ? "Fullscreen" : "Fullscreen off"}</div>
            <div><span className={faceStatus === "ok" ? "ok" : "bad"} />{faceStatus.replaceAll("_", " ")}</div>
            <div><span className={visionStatus === "active" || visionStatus === "partial" ? "ok" : "bad"} />AI vision {visionStatus === "active" ? "active" : visionStatus === "partial" ? "partial" : visionStatus === "loading" ? "loading" : "fallback"}</div>
            <div><AlertTriangle size={14} /> {flagCount} security flag{flagCount === 1 ? "" : "s"}</div>
          </div>
          {!isFullscreen ? <button className="button button-secondary button-small button-wide" onClick={() => document.documentElement.requestFullscreen().catch(() => {})}><Maximize size={15} /> Fullscreen</button> : null}
          <div className="secure-progress-card">
            <span>Progress</span>
            <strong>{answeredCount}/{totalQuestions}</strong>
            <div><i style={{ width: `${progressPct}%` }} /></div>
          </div>
        </aside>

        <section className="secure-question-panel">
          {question ? (
            <>
              <div className="secure-question-head">
                <span>{CATEGORY_LABELS[question.category ?? question.question_type] ?? question.question_type}</span>
                <strong>Question {questionIndex}</strong>
              </div>
              <h2>{question.content}</h2>
              <div className="secure-options">
                {options.map((option, index) => {
                  const id = `${question.id}-${index}`;
                  return (
                    <label key={id} className={selectedOption === option ? "selected" : ""} htmlFor={id}>
                      <input id={id} type="radio" name={question.id} checked={selectedOption === option} onChange={() => setSelectedOption(option)} />
                      <b>{String.fromCharCode(65 + index)}</b>
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
              {error ? <Feedback tone="error">{error}</Feedback> : null}
              <div className="secure-question-actions">
                <span>Question time: {formatTime(questionSeconds)}</span>
                <button className="button button-primary" onClick={submitAnswer} disabled={submitting || !selectedOption}>
                  {submitting ? <LoaderCircle className="spin" size={16} /> : questionIndex >= totalQuestions ? <Send size={16} /> : <ChevronRight size={16} />}
                  {questionIndex >= totalQuestions ? "Submit interview" : "Save and continue"}
                </button>
              </div>
            </>
          ) : <Feedback tone="error">No question is available.</Feedback>}
        </section>
      </main>

      {latestMessage ? (
        <div className="secure-admin-toast">
          <MessageSquare size={18} />
          <div><strong>{latestMessage.sender_name}</strong><p>{latestMessage.message}</p></div>
        </div>
      ) : null}

      {warning ? <div className="secure-warning"><AlertTriangle size={20} /><span>{warning}</span></div> : null}
      <button className="secure-camera-note" type="button"><CameraOff size={14} /> Recording and live preview active</button>
    </div>
  );
}





