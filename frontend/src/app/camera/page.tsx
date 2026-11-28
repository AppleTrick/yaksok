"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CaptureStep from "@/features/camera/components/CaptureStep";
import ScanScreen from "@/features/scan/ScanScreen";
import { useReportContext } from "@/features/report/contexts/ReportContext";
import "@/features/camera/styles.css";

/**
 * 촬영 → 사진 확인 → AI 분석 → 분석 결과 → 영양제 리포트(/report) → 등록.
 * 로그인 확인은 proxy.ts가 맡는다.
 */
export default function CameraPage() {
  const router = useRouter();
  const { setReportData } = useReportContext();
  const [image, setImage] = useState<string | null>(null);

  if (!image) return <CaptureStep onCapture={setImage} onFileUpload={setImage} />;
  return (
    <ScanScreen
      key={image}
      src={image}
      onRetake={() => setImage(null)}
      onReport={(items) => {
        setReportData({ items, capturedImage: image });
        router.push("/report");
      }}
    />
  );
}
