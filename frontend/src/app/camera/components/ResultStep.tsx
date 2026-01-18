
import React, { useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Check, AlertCircle } from 'lucide-react';
import '../page.css';

interface DetectedObject {
  label: string;
  confidence: number;
  box: number[]; // [x1, y1, x2, y2]
}

interface AnalysisResult {
  is_supplement: boolean;
  detected_objects: DetectedObject[];
  message: string;
}

interface ResultStepProps {
  imageSrc: string;
  result: AnalysisResult;
  onRetake: () => void;
  onRegister: () => void;
}

export default function ResultStep({ imageSrc, result, onRetake, onRegister }: ResultStepProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw Bounding Boxes on Mount/ImageLoad
  useEffect(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !result.detected_objects) return;

    const drawBoxes = () => {
        // Set canvas resolution to match natural image size
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 4;
        ctx.font = "bold 24px Pretendard, sans-serif";

        result.detected_objects.forEach((obj, index) => {
            const [x1, y1, x2, y2] = obj.box;
            const w = x2 - x1;
            const h = y2 - y1;
            const color = index === 0 ? '#0FA5A5' : '#F59E0B'; // Teal for 1st, Amber for 2nd

            // Draw Box
            ctx.strokeStyle = color;
            ctx.strokeRect(x1, y1, w, h);

            // Draw Label Badge
            const badgeSize = 40;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x1, y1 - badgeSize/2, badgeSize, badgeSize, 20); // Circle-ish
            ctx.fill();
            
            // Draw Index Number
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText((index + 1).toString(), x1 + badgeSize/2, y1);
        });
    };

    if (img.complete) {
        drawBoxes();
    } else {
        img.onload = drawBoxes;
    }
  }, [imageSrc, result]);

  return (
    <div className="camera-container result-container">
      {/* Header */}
      <div className="camera-header" style={{ background: 'white', borderBottom: '1px solid #eee' }}>
        <button onClick={onRetake} className="icon-button">
          <ArrowLeft color="black" size={24} />
        </button>
        <span className="camera-title" style={{ color: 'black' }}>OCR Analysis Results</span>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="result-scroll-area">
        {/* Status Bar */}
        <div className="result-status-bar">
            <span className="analysis-complete">ANALYSIS COMPLETE</span>
            <span className="time-info">Just now</span>
        </div>

        {/* Image Preview with Overlay */}
        <div className="result-image-wrapper">
            <img ref={imageRef} src={imageSrc} alt="Analyzed" className="result-image" />
            <canvas ref={canvasRef} className="result-canvas" />
        </div>

        {/* Detected List */}
        <div className="detected-list">
            <h3 className="list-title">
                Detected Objects <span className="count">{result.detected_objects.length} found</span>
            </h3>

            {result.detected_objects.length === 0 ? (
                <div className="empty-state">
                    <AlertCircle color="#9CA3AF" size={32} />
                    <p>탐지된 영양제가 없습니다.</p>
                </div>
            ) : (
                result.detected_objects.map((obj, idx) => (
                    <div key={idx} className="detected-card">
                        <div className={`index-circle index-${idx === 0 ? 'teal' : 'amber'}`}>
                            {idx + 1}
                        </div>
                        <div className="card-info">
                            <h4 className="card-title">{obj.label.toUpperCase()}</h4>
                            <div className="confidence-row">
                                <span className="label">Confidence</span>
                                <div className="bar-bg">
                                    <div className={`bar-fill index-${idx === 0 ? 'teal' : 'amber'}`} style={{ width: `${obj.confidence * 100}%` }}></div>
                                </div>
                                <span className="value">{Math.round(obj.confidence * 100)}%</span>
                            </div>
                            <div className="badge-row">
                                <span className="status-badge match">DETECTED OBJECT</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="result-actions">
        <button onClick={onRetake} className="action-button secondary">
            <RefreshCw size={20} />
            <span>Retake</span>
        </button>
        <button onClick={onRegister} className="action-button primary">
            <span>등록하기</span>
            <Check size={20} />
        </button>
      </div>
    </div>
  );
}
