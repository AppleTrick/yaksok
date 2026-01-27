"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Image as ImageIcon, HelpCircle } from 'lucide-react';
import '../styles.css';
import CameraHeader from './common/CameraHeader';
import RatioBox from './common/RatioBox';

interface CaptureStepProps {
    onCapture: (imageSrc: string) => void;
    onFileUpload: (imageSrc: string) => void;
}

export default function CaptureStep({ onCapture, onFileUpload }: CaptureStepProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
        if (!videoRef.current || !canvasRef.current || !isStreaming) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Target 3:4 ratio
        const targetAspectRatio = 3 / 4;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const videoAspectRatio = videoWidth / videoHeight;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = videoWidth;
        let sourceHeight = videoHeight;

        if (videoAspectRatio > targetAspectRatio) {
            // Video is wider than 3:4 (e.g. 16:9), crop sides
            sourceWidth = videoHeight * targetAspectRatio;
            sourceX = (videoWidth - sourceWidth) / 2;
        } else {
            // Video is taller than 3:4, crop top/bottom
            sourceHeight = videoWidth / targetAspectRatio;
            sourceY = (videoHeight - sourceHeight) / 2;
        }

        // Set canvas to the cropped 3:4 size
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(
                video,
                sourceX, sourceY, sourceWidth, sourceHeight, // Source crop
                0, 0, sourceWidth, sourceHeight             // Destination
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
                onClose={() => window.history.back()}
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

                    <div className="guide-box">
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
