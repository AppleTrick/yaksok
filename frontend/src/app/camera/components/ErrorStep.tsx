
import React from 'react';
import { ArrowLeft, AlertCircle, RefreshCw, PenTool } from 'lucide-react';
import '../page.css';

interface ErrorStepProps {
  onRetake: () => void;
  onManualInput: () => void;
  onBack: () => void;
}

export default function ErrorStep({ onRetake, onManualInput, onBack }: ErrorStepProps) {
  return (
    <div className="camera-container error-step-container">
      {/* Header */}
      <div className="camera-header" style={{ background: 'white', color: 'black' }}>
        <button onClick={onBack} className="icon-button">
          <ArrowLeft color="black" size={24} />
        </button>
        <span className="camera-title" style={{ color: 'black' }}>스캔 실패</span>
        <div style={{ width: 24 }}></div>
      </div>

      {/* Content */}
      <div className="error-content">
        <div className="error-icon-circle">
          <AlertCircle size={48} color="#EF4444" />
        </div>

        <h2 className="error-title">정보를 인식할 수 없습니다</h2>
        <p className="error-subtitle">
          사진이 흔들렸거나,<br />
          식별이 어려운 상태일 수 있습니다.
        </p>

        <div className="error-actions">
          <button className="action-button primary" onClick={onRetake}>
            <RefreshCw size={20} />
            <span>다시 촬영하기</span>
          </button>
          
          <button className="action-button secondary" onClick={onManualInput}>
            <PenTool size={20} />
            <span>직접 입력하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
