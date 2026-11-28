'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, CircleHelp, RotateCcw, ScanLine, ScanText, Search, Sparkles, TriangleAlert, X } from 'lucide-react';
import ScanStage, { COLORS, Phase, usePhases } from './ScanStage';
import { Candidate, Found, ReportItem, ScanError, ScanResult, analyze } from './types';
import './scan.css';

const STEPS: { key: string; label: string; icon: React.ReactNode; phases: Phase[] }[] = [
    { key: 'detect', label: '병 찾기', icon: <ScanLine size={16} />, phases: ['detect', 'read', 'done'] },
    { key: 'ocr', label: '글자 읽기', icon: <ScanText size={16} />, phases: ['read', 'done'] },
    { key: 'match', label: '제품 찾기', icon: <Search size={16} />, phases: ['done'] },
];

const sec = (ms: number) => `${(ms / 1000).toFixed(2)}초`;

/** 예전 AI 결과이거나 서버가 유력하다고 본 제품은 미리 골라 둔다 */
const initialPick = (p: Found): string | null =>
    p.candidates.length === 1 && p.candidates[0].score === null ? p.candidates[0].name : p.name;

/**
 * 사진 확인 → AI 분석 → 분석 결과 (예전 흐름의 2·3단계).
 * 확실하지 않은 제품만 후보에서 고르게 하고, 고른 것을 리포트로 넘긴다. 등록은 리포트에서 한다.
 */
export default function ScanScreen({ src, onRetake, onReport }: {
    src: string; onRetake: () => void; onReport: (items: ReportItem[]) => void;
}) {
    const [result, setResult] = useState<ScanResult | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [wait, setWait] = useState(0);
    const [selected, setSelected] = useState(0);
    const [picks, setPicks] = useState<(string | null)[]>([]);
    const phase = usePhases(result, analyzing);
    const found = result?.products[selected];

    useEffect(() => {
        if (wait <= 0) return;
        const t = setTimeout(() => setWait((w) => w - 1), 1000);
        return () => clearTimeout(t);
    }, [wait]);

    const start = async () => {
        setError('');
        setAnalyzing(true);
        try {
            const r = await analyze(await (await fetch(src)).blob());
            setResult(r);
            setPicks(r.products.map(initialPick));
        } catch (e) {
            setError(e instanceof ScanError ? e.message : '분석하지 못했어요.');
            if (e instanceof ScanError) setWait(e.retryAfter);
        } finally {
            setAnalyzing(false);
        }
    };

    const items: ReportItem[] = (result?.products ?? []).flatMap((p, i) => {
        const c = p.candidates.find((x) => x.name === picks[i]);
        return c ? [{ productId: c.productId, name: c.name, ingredients: c.ingredients, intakeTime: p.intakeTime, intakeCategory: p.intakeCategory }] : [];
    });
    const title = analyzing ? 'AI 분석' : !result ? '사진 확인' : phase === 'done' ? '분석 결과' : 'AI 분석';

    return (
        <div className="sc-page">
            <header className="sc-top">
                <button aria-label="닫기" onClick={onRetake}><X size={22} /></button>
                <strong>{title}</strong>
                <span />
            </header>

            <ScanStage src={src} phase={phase} result={result} selected={selected} onSelect={setSelected} />

            {(analyzing || result) && (
                <ol className="sc-steps">
                    {STEPS.map((s) => {
                        const on = s.phases.includes(phase);
                        return (
                            <li key={s.key} className={on ? 'on' : analyzing ? 'wait' : ''}>
                                {s.icon}<span>{s.label}</span>
                                <b>{!on || !result ? '–' : s.key in result.timings ? sec(result.timings[s.key]) : '완료'}</b>
                            </li>
                        );
                    })}
                </ol>
            )}

            {error && <div className="sc-error" role="alert"><TriangleAlert size={18} />{error}{wait > 0 && ` (${wait}초 뒤 다시)`}</div>}

            {!result && (
                <>
                    {!analyzing && <p className="sc-guide">이 사진으로 분석할까요? 제품 이름이 잘 보여야 정확해요.</p>}
                    <div className="sc-actions">
                        <button className="sc-btn" onClick={onRetake} disabled={analyzing}><RotateCcw size={18} /> 다시 찍기</button>
                        <button className="sc-btn primary" onClick={start} disabled={analyzing || wait > 0}>
                            <Sparkles size={18} /> {analyzing ? '분석 중' : '분석 시작'}
                        </button>
                    </div>
                </>
            )}

            {phase === 'done' && result && (
                <section className="sc-result">
                    {result.products.length === 0 ? (
                        <div className="sc-empty"><CircleHelp size={28} /><strong>영양제 병이나 상자를 찾지 못했어요</strong><p>알약만으로는 제품을 알 수 없어요. 이름이 보이는 병 앞면을 찍어 주세요.</p></div>
                    ) : (
                        <>
                            <Summary result={result} items={items} />
                            {result.products.length > 1 && (
                                <div className="sc-tabs" role="tablist">
                                    {result.products.map((_, i) => (
                                        <button key={i} role="tab" aria-selected={i === selected} onClick={() => setSelected(i)}>
                                            <i style={{ background: COLORS[i % COLORS.length] }} />{i + 1}번{picks[i] && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {found && (
                                <Picker candidates={found.candidates} sure={found.name} legacy={result.legacy} picked={picks[selected]}
                                    onPick={(name) => setPicks((v) => v.map((x, i) => (i === selected ? name : x)))} />
                            )}
                        </>
                    )}
                    <div className="sc-actions">
                        <button className="sc-btn" onClick={onRetake}><RotateCcw size={18} /> 다시 찍기</button>
                        <button className="sc-btn primary" disabled={!items.length} onClick={() => onReport(items)}>
                            리포트 보기{items.length > 0 && ` (${items.length})`} <ArrowRight size={18} />
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}

/** 예전 결과 화면의 요약 (찾은 제품, 성분, 주의 성분) */
function Summary({ result, items }: { result: ScanResult; items: ReportItem[] }) {
    const ingredients = items.reduce((n, x) => n + x.ingredients.length, 0);
    const warnings = items.reduce((n, x) => n + x.ingredients.filter((g) => g.status === 'warning').length, 0);
    return (
        <>
            <div className="sc-summary-grid">
                <div><b>{result.products.length}</b><span>찾은 제품</span></div>
                <div><b>{ingredients}</b><span>확인된 성분</span></div>
                <div className={warnings ? 'warn' : ''}><b>{warnings || <Check size={20} />}</b><span>{warnings ? '주의 성분' : '주의 성분 없음'}</span></div>
            </div>
            <p className="sc-summary">
                {result.legacy ? '' : `글자 ${result.products.reduce((n, p) => n + p.texts.length, 0)}줄을 읽었어요 · `}전체 {sec(result.totalMs)}
            </p>
        </>
    );
}

/** 확실하지 않을 때만 사람이 고른다. 고르지 않은 제품은 리포트에 넣지 않는다. */
function Picker({ candidates, sure, legacy, picked, onPick }: {
    candidates: Candidate[]; sure: string | null; legacy: boolean; picked: string | null; onPick: (name: string | null) => void;
}) {
    if (!candidates.length) {
        return <div className="sc-empty"><CircleHelp size={28} /><strong>이 제품은 알 수 없어요</strong><p>병이나 상자에서 이름을 읽지 못했어요. 이름이 크게 보이게 다시 찍어 주세요.</p></div>;
    }
    return (
        <>
            <p className="sc-ask">{candidates.length === 1 ? '이 제품이 맞나요?' : '어느 제품인가요?'}</p>
            <ul className="sc-cands">
                {candidates.map((x) => (
                    <li key={x.name}>
                        <button aria-pressed={picked === x.name} onClick={() => onPick(picked === x.name ? null : x.name)}>
                            <span className="sc-radio">{picked === x.name && <Check size={14} />}</span>
                            <span className="sc-cand-name">{x.name}{sure === x.name && <em>유력</em>}</span>
                            {x.score !== null && <span className="sc-score">{Math.round(x.score * 100)}</span>}
                        </button>
                    </li>
                ))}
            </ul>
            <p className="sc-hint">
                {legacy ? '성분은 AI가 추정한 값일 수 있어요. ' : '숫자는 사진의 글자와 겹치는 정도예요. '}
                포장의 이름과 함량을 꼭 비교해 주세요. 다시 누르면 선택이 풀려요.
            </p>
        </>
    );
}
