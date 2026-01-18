
import React from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import '../page.css';

interface ReviewStepProps {
  imageSrc: string;
  onRetake: () => void;
  onConfirm: () => void;
}

export default function ReviewStep({ imageSrc, onRetake, onConfirm }: ReviewStepProps) {
  return (
    <div className="camera-container" style={{ background: 'white' }}>
      {/* Header */}
      <div className="camera-header" style={{ background: 'white', borderBottom: '1px solid #eee' }}>
        <button onClick={onRetake} className="icon-button">
          <ArrowLeft color="black" size={24} />
        </button>
        <span className="camera-title" style={{ color: 'black' }}>Review Photo</span>
        <div style={{ width: 24 }}></div>
      </div>

      {/* Content */}
      <div className="review-content" style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Image Card */}
        <div style={{ 
            borderRadius: 16, 
            overflow: 'hidden', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: 24,
            maxHeight: '50vh'
        }}>
            <img 
                src={imageSrc} 
                alt="Review" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
        </div>

        {/* Checklist */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, color: '#1F2937' }}>
            Check photo quality
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: 20, lineHeight: 1.5 }}>
            To get the best accurate AI analysis results, please ensure:
        </p>

        <div className="checklist" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="check-item" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ background: '#DEF7EC', padding: 4, borderRadius: '50%' }}>
                    <CheckCircle2 size={16} color="#03543F" />
                </div>
                <span style={{ fontSize: '0.95rem', color: '#374151' }}>Text is clear and readable</span>
            </div>
            <div className="check-item" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ background: '#DEF7EC', padding: 4, borderRadius: '50%' }}>
                    <CheckCircle2 size={16} color="#03543F" />
                </div>
                <span style={{ fontSize: '0.95rem', color: '#374151' }}>Label details are in the frame</span>
            </div>
            <div className="check-item" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ background: '#DEF7EC', padding: 4, borderRadius: '50%' }}>
                    <CheckCircle2 size={16} color="#03543F" />
                </div>
                <span style={{ fontSize: '0.95rem', color: '#374151' }}>Photo is not too bright/dark</span>
            </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div style={{ padding: 20, display: 'flex', gap: 12, borderTop: '1px solid #f3f4f6' }}>
        <button 
            onClick={onRetake}
            className="action-button secondary" 
            style={{ flex: 1, height: 50, borderRadius: 12, border: '1px solid #E5E7EB', background: 'white', fontWeight: 600 }}
        >
            <span style={{ color: '#374151' }}>재촬영</span>
        </button>
        <button 
            onClick={onConfirm}
            className="action-button primary" 
            style={{ flex: 2, height: 50, borderRadius: 12, background: '#0FA5A5', color: 'white', border: 'none', fontWeight: 600 }}
        >
            <span>분석하기</span>
        </button>
      </div>
    </div>
  );
}
