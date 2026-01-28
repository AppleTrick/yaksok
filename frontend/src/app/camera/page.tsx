"use client";

import { useState } from "react";
import "@/features/camera/styles.css";
import CaptureStep from "@/features/camera/components/CaptureStep";
import ReviewStep from "@/features/camera/components/ReviewStep";

import ResultStep from "@/features/camera/components/ResultStep";

type CameraFlowStep = 'capture' | 'review' | 'result';

export default function CameraPage() {
  const [step, setStep] = useState<CameraFlowStep>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCapture = (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl);
    setStep('review');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setStep('capture');
    setIsAnalyzing(false);
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    try {
      /* [주석 처리] 클라이언트 사이드 이미지 압축/리사이징 필요 시 아래 주석을 해제하세요.
      const compressImage = (dataUrl: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = dataUrl;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 1280;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error("Canvas context is null"));
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
              if (blob) {
                console.log(`[DEBUG] Image compressed: size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
                resolve(blob);
              } else {
                reject(new Error("Blob conversion failed"));
              }
            }, 'image/jpeg', 0.8);
          };
          img.onerror = (e) => reject(e);
        });
      };
      
      console.log("[DEBUG] Starting image compression...");
      const blob = await compressImage(capturedImage);
      */

      // 현재는 원본 이미지를 그대로 사용합니다.
      console.log("[DEBUG] Fetching blob from captured image (No compression)...");
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      console.log("[DEBUG] Blob size to send:", (blob.size / 1024).toFixed(2), "KB");

      const formData = new FormData();
      formData.append("file", blob, "captured.jpg");

      console.log("[DEBUG] Fetching /ai/v1/analyze...");
      const apiResponse = await fetch("/ai/v1/analyze", {
        method: "POST",
        body: formData,
      });

      console.log("[DEBUG] Response status:", apiResponse.status);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("[DEBUG] Error response body:", errorText);
        throw new Error(`HTTP error! status: ${apiResponse.status}, body: ${errorText}`);
      }

      const data = await apiResponse.json();
      console.log("[DEBUG] Analysis data received:", data);
      setAnalysisResult(data);
      setStep('result');
    } catch (error: any) {
      console.error("Upload error detail:", error);
      alert(`분석 중 오류가 발생했습니다: ${error.message || error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegister = () => {
    alert("영양제가 등록되었습니다! (홈으로 이동)");
    window.location.href = "/";
  };

  // Render Steps
  switch (step) {
    case 'capture':
      return (
        <CaptureStep
          onCapture={handleCapture}
          onFileUpload={handleCapture}
        />
      );
    case 'review':
      return capturedImage && (
        <ReviewStep
          imageSrc={capturedImage}
          isAnalyzing={isAnalyzing}
          onRetake={handleRetake}
          onConfirm={handleConfirm}
        />
      );
    case 'result':
      return capturedImage && analysisResult && (
        <ResultStep
          imageSrc={capturedImage}
          result={analysisResult}
          onRetake={handleRetake}
          onRegister={handleRegister}
        />
      );
    default:
      return null;
  }
}
