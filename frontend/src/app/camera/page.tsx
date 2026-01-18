"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./page.css";
import ReviewStep from "./components/ReviewStep";
import AnalyzingStep from "./components/AnalyzingStep";
import ErrorStep from "./components/ErrorStep";
import ResultStep from "./components/ResultStep";

type CameraStep = 'capture' | 'review' | 'analyzing' | 'error' | 'result';

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<CameraStep>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null); // TODO: Add proper type
  
  // ... (Camera init/stop/capture logic same as before) ...
  // Start Camera on Mount
  useEffect(() => {
    if (step === 'capture') {
        startCamera();
    } else {
        stopCamera();
    }
  }, [step]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
        throw new Error("HTTPS 환경에서만 카메라를 사용할 수 있습니다.");
      }

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
      if (err.name === 'NotAllowedError') msg = "카메라 권한이 거부되었습니다.";
      else if (err.name === 'NotFoundError') msg = "카메라를 찾을 수 없습니다.";
      else if (err.name === 'NotReadableError') msg = "카메라가 다른 앱에서 사용 중입니다.";
      else if (err.message) msg = err.message;
      
      setErrorMsg(msg);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageDataUrl);
        setStep('review');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setCapturedImage(event.target.result);
          setStep('review');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setStep('capture');
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;

    setStep('analyzing');

    try {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append("file", blob, "captured.jpg");

        const apiResponse = await fetch("http://localhost:8000/api/v1/analyze", {
            method: "POST",
            body: formData,
        });

        if (!apiResponse.ok) {
            throw new Error(`HTTP error! status: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        setAnalysisResult(data);
        
        // Wait a bit just to show the loading animation for UX (optional, but requested in mockups typically)
        setTimeout(() => {
            setStep('result');
        }, 800);

    } catch (error) {
        console.error("Upload error:", error);
        setStep('error');
    }
  };

  const handleRegister = () => {
      alert("영양제가 등록되었습니다! (홈으로 이동)");
      window.location.href = "/";
  };

  // 4. Render Steps
  if (step === 'review' && capturedImage) {
    return (
        <ReviewStep 
            imageSrc={capturedImage} 
            onRetake={handleRetake} 
            onConfirm={handleConfirm} 
        />
    );
  }

  if (step === 'analyzing' && capturedImage) {
    return (
        <AnalyzingStep 
            imageSrc={capturedImage} 
            onBack={() => setStep('review')} 
        />
    );
  }

  if (step === 'error') {
    return (
        <ErrorStep 
            onRetake={handleRetake} 
            onManualInput={() => alert("직접 입력 페이지로 이동 예정")} 
            onBack={() => setStep('capture')}
        />
    );
  }

  if (step === 'result' && capturedImage && analysisResult) {
      return (
          <ResultStep 
            imageSrc={capturedImage}
            result={analysisResult}
            onRetake={handleRetake}
            onRegister={handleRegister}
          />
      );
  }

  // Default: Capture Step
  return (
    <div className="camera-container">
    {/* ... (Existing Capture UI) ... */}
      {/* Top Bar */}
      <div className="camera-header">
        <Link href="/" className="icon-button">
          <ArrowLeft color="white" size={28} />
        </Link>
        <span className="camera-title">영양제 등록</span>
        <div style={{ width: 28 }}></div>
      </div>

      {/* Main Viewport */}
      <div className="camera-viewport">
        {errorMsg ? (
          <div className="error-message">
            <p>{errorMsg}</p>
            <button onClick={startCamera} className="retry-button">다시 시도</button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
      </div>

      {/* Control Bar */}
      <div className="camera-controls">
        <input 
            type="file" 
            accept="image/*" 
            hidden 
            ref={fileInputRef} 
            onChange={handleFileUpload}
        />
        <button className="control-btn secondary" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon size={24} color="white" />
        </button>
        <button className="shutter-button" onClick={handleCapture}>
            <div className="shutter-inner"></div>
        </button>
        <div style={{ width: 48 }}></div>
      </div>
    </div>
  );
}
