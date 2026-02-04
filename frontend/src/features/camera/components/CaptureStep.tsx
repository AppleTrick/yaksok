"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, HelpCircle } from 'lucide-react';
import '../styles.css';
import CameraHeader from './common/CameraHeader';
import RatioBox from './common/RatioBox';

interface CaptureStepProps {
    onCapture: (imageSrc: string) => void;
    onFileUpload: (imageSrc: string) => void;
}

export default function CaptureStep({ onCapture, onFileUpload }: CaptureStepProps) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const guideBoxRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false,
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream; // Store stream in ref for reliable cleanup

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
            }
        } catch (err) {
            console.error("Camera access error:", err);
            alert("카메라 권한이 필요합니다.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log(`[CaptureStep] Track ${track.label} stopped`);
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current || !guideBoxRef.current || !isStreaming) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const guideBox = guideBoxRef.current;

        // 1. Get dimensions of the displayed video element (container)
        const videoRect = video.getBoundingClientRect();
        const guideRect = guideBox.getBoundingClientRect();

        // 2. Get actual video stream dimensions
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // 3. Calculate Scale Factors (object-fit: cover logic)
        // 'cover' scales the video to fill the container, maintaining aspect ratio.
        const scaleX = videoRect.width / videoWidth;
        const scaleY = videoRect.height / videoHeight;
        const scale = Math.max(scaleX, scaleY); // The actual scale used by 'cover'

        // 4. Calculate the rendered dimensions of the video content
        const renderedWidth = videoWidth * scale;
        const renderedHeight = videoHeight * scale;

        // 5. Calculate offsets (centering logic of object-fit)
        // (rendered - visible) / 2 is the amount hidden on each side
        const offsetX = (renderedWidth - videoRect.width) / 2;
        const offsetY = (renderedHeight - videoRect.height) / 2;

        // 6. Map Guide Box Screen Coordinates -> Video Stream Coordinates
        // Formula: (GuidePos + Offset) / Scale
        // GuidePos: Position relative to the *video element top-left*
        const guideNativeX = (guideRect.left - videoRect.left + offsetX) / scale;
        const guideNativeY = (guideRect.top - videoRect.top + offsetY) / scale;
        const guideNativeW = guideRect.width / scale;
        const guideNativeH = guideRect.height / scale;

        // 7. Configure Canvas
        canvas.width = guideNativeW;
        canvas.height = guideNativeH;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(
                video,
                guideNativeX, guideNativeY, guideNativeW, guideNativeH, // Source Crop
                0, 0, guideNativeW, guideNativeH                        // Destination
            );
            const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
            onCapture(dataUrl);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    onFileUpload(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="camera-container theme-dark">
            <CameraHeader
                title="영양제 촬영"
                stepInfo="Step 1/3"
                onClose={() => router.push('/')}
            />

            <div className="camera-content-center">
                <RatioBox>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="camera-video"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    <div ref={guideBoxRef} className="guide-box">
                        <p className="guide-text">
                            영양제가 잘 보이도록<br />
                            <span>카메라에 비춰주세요</span>
                        </p>
                    </div>
                </RatioBox>
            </div>

            <footer className="pwa-controls">
                <button className="glass-ctrl-btn" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon size={28} />
                    <span>갤러리</span>
                </button>

                <div className="shutter-ring" onClick={handleCapture}>
                    <div className="shutter-ball"></div>
                </div>

                <div className="glass-ctrl-btn">
                    <HelpCircle size={28} />
                    <span>도움말</span>
                </div>
            </footer>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </div>
    );
}
