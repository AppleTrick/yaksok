
"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowLeft, Camera, Image as ImageIcon, RotateCcw, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./page.css";

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start Camera on Mount
  useEffect(() => {
    // Check if we are in a secure context or localhost
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
        setError("보안 문제로 카메라를 실행할 수 없습니다. (HTTPS 필요)");
        return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let msg = "카메라에 접근할 수 없습니다.";
      if (err.name === 'NotAllowedError') msg = "카메라 권한이 거부되었습니다. 설정에서 허용해주세요.";
      else if (err.name === 'NotFoundError') msg = "카메라를 찾을 수 없습니다.";
      else if (err.name === 'NotReadableError') msg = "카메라를 다른 앱이 사용 중입니다.";
      else if (!window.isSecureContext) msg = "HTTPS 환경에서만 카메라를 사용할 수 있습니다.";
      
      setError(msg);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setCapturedImage(event.target.result);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/png");
        setCapturedImage(imageDataUrl);
        // Stop camera stream to save battery/resources while previewing
        // stopCamera(); // Optional: keep it running if we want fast retake? Let's stop it for now.
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(); // Restart camera
  };

  const confirmPhoto = () => {
    // TODO: Send to AI Server
    alert("사진이 캡처되었습니다! (기능 구현 예정)");
    // router.push("/result?image=...");
  };

  return (
    <div className="camera-container">
      {/* Top Bar */}
      <div className="camera-header">
        <Link href="/" className="icon-button">
          <ArrowLeft color="white" size={28} />
        </Link>
        <span className="camera-title">영양제 등록</span>
        <div style={{ width: 28 }}></div> {/* Spacer for centering */}
      </div>

      {/* Main Viewport */}
      <div className="camera-viewport">
        {error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={startCamera} className="retry-button">다시 시도</button>
          </div>
        ) : (
          <>
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`camera-video ${capturedImage ? "hidden" : ""}`}
            />
            {/* Captured Image Preview */}
            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="captured-image" />
            )}
            {/* Hidden Canvas for Capture */}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
      </div>

      {/* Control Bar */}
      <div className="camera-controls">
        {!capturedImage ? (
          <>
            <input 
                type="file" 
                accept="image/*" 
                hidden 
                ref={fileInputRef} 
                onChange={handleFileUpload}
            />
            <button className="control-btn secondary" onClick={triggerFileInput}>
              <ImageIcon size={24} color="white" />
            </button>
            <button className="shutter-button" onClick={capturePhoto}>
              <div className="shutter-inner"></div>
            </button>
            <div style={{ width: 48 }}></div> {/* Spacer */}
          </>
        ) : (
          <div className="preview-controls">
            <button className="control-btn text-btn" onClick={retakePhoto}>
              <RotateCcw size={20} />
              <span>재촬영</span>
            </button>
            <button className="control-btn primary-btn" onClick={confirmPhoto}>
              <Check size={24} />
              <span>사용하기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
