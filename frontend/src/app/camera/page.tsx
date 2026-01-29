"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/features/camera/styles.css";
import CaptureStep from "@/features/camera/components/CaptureStep";
import ReviewStep from "@/features/camera/components/ReviewStep";
import ResultStep from "@/features/camera/components/ResultStep";
import { useReportContext } from "@/features/report/contexts/ReportContext";

type CameraFlowStep = 'capture' | 'review' | 'result';

export default function CameraPage() {
  const router = useRouter();
  const { setReportData } = useReportContext();

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

      console.log("[DEBUG] Fetching blob from captured image (No compression)...");
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      console.log("[DEBUG] Blob size to send:", (blob.size / 1024).toFixed(2), "KB");

      const formData = new FormData();
      formData.append("file", blob, "captured.jpg");

      // 개발환경: FastAPI 직접 호출 (Next.js 프록시 타임아웃 문제 회피)
      // 프로덕션: 프록시 경로 사용
      const apiUrl = process.env.NODE_ENV === 'development'
        ? "http://localhost:8000/v1/analyze"
        : "/ai/v1/analyze";

      console.log("[DEBUG] Fetching", apiUrl);
      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      console.log("[DEBUG] Response status:", apiResponse.status);
      console.log("[DEBUG] Response headers:", Object.fromEntries(apiResponse.headers.entries()));

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("[DEBUG] Error response body:", errorText);
        throw new Error(`HTTP error! status: ${apiResponse.status}, body: ${errorText}`);
      }

      const rawText = await apiResponse.text();
      console.log("[DEBUG] Raw response text length:", rawText.length);
      console.log("[DEBUG] Raw response preview:", rawText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(rawText);
        console.log("[DEBUG] JSON parsed successfully");
      } catch (parseError) {
        console.error("[DEBUG] JSON parse error:", parseError);
        console.error("[DEBUG] Full raw response:", rawText);
        throw new Error(`JSON 파싱 실패: ${parseError}`);
      }

      console.log("[DEBUG] Analysis data keys:", Object.keys(data));
      console.log("[DEBUG] frontend_data:", data.frontend_data);
      console.log("[DEBUG] success:", data.success);

      setAnalysisResult(data);
      console.log("[DEBUG] setAnalysisResult 완료, setStep('result') 호출 예정");
      setStep('result');
      console.log("[DEBUG] setStep('result') 완료");
    } catch (error: any) {
      console.error("[DEBUG] Full error object:", error);
      console.error("[DEBUG] Error name:", error?.name);
      console.error("[DEBUG] Error message:", error?.message);
      console.error("[DEBUG] Error stack:", error?.stack);
      alert(`분석 중 오류가 발생했습니다: ${error.message || error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegister = () => {
    // Context에 분석 결과 저장 후 리포트 페이지로 이동
    setReportData({
      analysisResult,
      capturedImage,
    });
    router.push('/report');
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
