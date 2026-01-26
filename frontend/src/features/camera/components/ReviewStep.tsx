import { RotateCcw, Sparkles } from 'lucide-react';
import CameraHeader from './common/CameraHeader';
import RatioBox from './common/RatioBox';
import LoadingOverlay from './common/LoadingOverlay';
import ActionButton from './common/ActionButton';

interface ReviewStepProps {
    imageSrc: string;
    isAnalyzing: boolean;
    onRetake: () => void;
    onConfirm: () => void;
}

export default function ReviewStep({ imageSrc, isAnalyzing, onRetake, onConfirm }: ReviewStepProps) {
    return (
        <div className="camera-container theme-dark">
            <CameraHeader
                title="이 사진을 사용하시겠습니까?"
                stepInfo="Step 2/3"
                onBack={onRetake}
            />

            <div className="camera-content-center">
                <RatioBox>
                    <img
                        src={imageSrc}
                        alt="Captured"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    <LoadingOverlay
                        visible={isAnalyzing}
                        message="영양제 성분을 분석하고 있습니다"
                    />
                </RatioBox>
            </div>

            <div className="cam-btn-row">
                <ActionButton
                    onClick={onRetake}
                    variant="secondary"
                    disabled={isAnalyzing}
                >
                    <RotateCcw size={20} />
                    <span>재촬영</span>
                </ActionButton>

                <ActionButton
                    onClick={onConfirm}
                    variant="primary"
                    disabled={isAnalyzing}
                >
                    <Sparkles size={20} fill="white" />
                    <span>탐색 시작</span>
                </ActionButton>
            </div>
        </div>
    );
}
