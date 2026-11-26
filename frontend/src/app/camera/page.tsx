"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CaptureStep from "@/features/camera/components/CaptureStep";
import ScanScreen from "@/features/scan/ScanScreen";
import "@/features/camera/styles.css";

// 로그인 확인은 proxy.ts가 맡는다 (localStorage의 이름으로 판단하지 않는다)
export default function CameraPage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);

  if (!image) return <CaptureStep onCapture={setImage} onFileUpload={setImage} />;
  return <ScanScreen key={image} src={image} onRetake={() => setImage(null)} onDone={() => router.push("/reminders")} />;
}
