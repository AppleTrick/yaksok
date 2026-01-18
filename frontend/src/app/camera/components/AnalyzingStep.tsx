
import React from 'react';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import '../page.css'; // Shared styles

interface AnalyzingStepProps {
  imageSrc: string;
  onBack: () => void;
}

export default function AnalyzingStep({ imageSrc, onBack }: AnalyzingStepProps) {
  return (
    <div className="camera-container analyzing-container">
      {/* Background with blur */}
      <div 
        className="analyzing-bg" 
        style={{ backgroundImage: `url(${imageSrc})` }} 
      />
      <div className="analyzing-overlay" />

      {/* Header */}
      <div className="camera-header">
        <button onClick={onBack} className="icon-button">
          <ArrowLeft color="white" size={24} />
        </button>
        <span className="camera-title">AI Analyzing Info</span>
        <div style={{ width: 24 }}></div>
      </div>

      {/* Progress Bar (Mock) */}
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: '60%' }}></div>
      </div>

      {/* Content */}
      <div className="analyzing-content">
        <div className="spinner-circle">
          <Sparkles className="sparkle-icon" size={32} color="#0FA5A5" />
          <Loader2 className="spinner-ring" size={80} color="#0FA5A5" />
        </div>

        <h2 className="analyzing-title">
          AI가 영양제 정보를<br />분석 중입니다...
        </h2>
        <p className="analyzing-subtitle">
          약 3~5초 정도 소요될 수 있습니다.
        </p>

        <div className="analyzing-steps">
          <div className="step-item completed">
            <span className="step-dot"></span>
            <span>Image Uploaded</span>
          </div>
          <div className="step-item active">
            <span className="step-dot"></span>
            <span>Validating Information</span>
          </div>
          <div className="step-item">
            <span className="step-dot"></span>
            <span>Database Matching</span>
          </div>
        </div>
      </div>
    </div>
  );
}
