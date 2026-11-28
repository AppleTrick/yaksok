'use client';

import { useEffect, useState } from 'react';
import { ScanResult } from './types';

export const COLORS = ['#A68BFF', '#7DD3FC', '#A3E635', '#F472B6', '#FACC15']; // 첫 제품은 AI 보라
export type Phase = 'ready' | 'analyzing' | 'detect' | 'read' | 'done';

/** 서버가 돌려준 실제 탐지 상자와 글자 위치를 사진 위에 순서대로 그린다 */
export default function ScanStage({ src, phase, result, selected, onSelect }: {
    src: string; phase: Phase; result: ScanResult | null; selected: number; onSelect: (i: number) => void;
}) {
    const [ratio, setRatio] = useState(3 / 4);
    const products = result?.products ?? [];
    const showBox = phase === 'detect' || phase === 'read' || phase === 'done';
    const showText = phase === 'read' || phase === 'done';
    const dim = (i: number) => phase === 'done' && i !== selected;

    return (
        <div className="sc-stage">
            <div className="sc-photo" style={{ aspectRatio: ratio, width: `min(100%, calc(54dvh * ${ratio}))` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="찍은 영양제 사진" onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} />
                {phase === 'analyzing' && <div className="sc-sweep" aria-hidden />}
                <svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden>
                    {showBox && products.map(({ box: [x0, y0, x1, y1] }, i) => (
                        <rect key={i} className="sc-box" x={x0} y={y0} width={x1 - x0} height={y1 - y0}
                            style={{ stroke: COLORS[i % COLORS.length], opacity: dim(i) ? 0.35 : 1 }} />
                    ))}
                    {showText && products.flatMap((p, i) => p.texts.map((t, k) => (
                        <polygon key={`${i}-${k}`} className="sc-quad" points={t.quad.map((q) => q.join(',')).join(' ')}
                            style={{
                                stroke: COLORS[i % COLORS.length], fill: COLORS[i % COLORS.length],
                                animationDelay: `${Math.min(k * 60, 900)}ms`, opacity: dim(i) ? 0.25 : 1,
                            }} />
                    )))}
                </svg>
                {showBox && products.map((p, i) => (
                    <button key={i} className="sc-tag" aria-label={`${i + 1}번 영양제 보기`} aria-pressed={i === selected} onClick={() => onSelect(i)}
                        style={{ left: `${p.box[0] * 100}%`, top: `${p.box[1] * 100}%`, background: COLORS[i % COLORS.length] }}>
                        {i + 1}{p.confidence > 0 && ` · ${Math.round(p.confidence * 100)}%`}
                    </button>
                ))}
            </div>
        </div>
    );
}

/** 단계를 차례로 보여 준다. 움직임을 줄이도록 설정한 사람에게는 바로 결과를 보인다. */
export function usePhases(result: ScanResult | null, analyzing: boolean): Phase {
    const [step, setStep] = useState(0);
    useEffect(() => {
        if (!result) return;
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const a = setTimeout(() => setStep(1), calm ? 0 : 900);
        const b = setTimeout(() => setStep(2), calm ? 0 : 2300);
        return () => { clearTimeout(a); clearTimeout(b); };
    }, [result]);
    if (analyzing) return 'analyzing';
    return result ? (['detect', 'read', 'done'] as const)[step] : 'ready';
}
