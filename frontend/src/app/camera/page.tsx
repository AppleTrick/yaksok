"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/features/camera/styles.css";
import CaptureStep from "@/features/camera/components/CaptureStep";
import ReviewStep from "@/features/camera/components/ReviewStep";
import ResultStep from "@/features/camera/components/ResultStep";
import { useReportContext } from "@/features/report/contexts/ReportContext";
import Modal from '@/components/Modal';
import Button from '@/components/Button';

import { Lock } from 'lucide-react';

type CameraFlowStep = 'capture' | 'review' | 'result';

export default function CameraPage() {
  const router = useRouter();
  const { setReportData } = useReportContext();

  const [step, setStep] = useState<CameraFlowStep>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // 간단한 로그인 체크
    const userName = localStorage.getItem("userName");
    if (!userName) {
      setIsLoginModalOpen(true);
    }
  }, []);

  const handleLoginRedirect = () => {
    setIsLoginModalOpen(false);
    router.push("/login");
  };

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

      // 개발환경: Spring Boot 로컬 서버 호출 (8080 포트)
      // 프로덕션: nginx가 /api를 백엔드로 라우팅함
      const apiUrl = "/api/v1/analyze";

      console.log("[DEBUG] Fetching", apiUrl);
      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`HTTP error! status: ${apiResponse.status}, body: ${errorText}`);
      }

      const responseJson = await apiResponse.json();
      console.log("[DEBUG] Raw response:", responseJson);

      // Spring Boot의 ApiResponse 구조: { success: boolean, data: SupplementAnalysisResponse, message: string }
      if (!responseJson.success) {
        throw new Error(responseJson.message || "분석 실패");
      }

      const unifiedResult = responseJson.data;
      console.log("[DEBUG] Unified analysis result:", unifiedResult);

      setAnalysisResult(unifiedResult);
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
  return (
    <>
      {!isLoginModalOpen && (() => {
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
      })()}

      <Modal
        isOpen={isLoginModalOpen}
        onClose={handleLoginRedirect}
        title="인증 확인"
        hideCloseButton={true}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '1.5rem 0'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: 'var(--sub-background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            color: 'var(--primary-color)'
          }}>
            <Lock size={32} />
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            marginBottom: '0.75rem',
            color: 'var(--foreground-color)'
          }}>
            로그인이 필요한 서비스입니다
          </h3>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginBottom: '2rem'
          }}>
            맞춤형 영양제 정보를 확인하시려면<br />
            먼저 로그인을 진행해 주세요.
          </p>
          <Button
            variant="primary"
            size="large"
            onClick={handleLoginRedirect}
            style={{ width: '100%' }}
          >
            로그인하러 가기
          </Button>
        </div>
      </Modal>
    </>
  );
}
