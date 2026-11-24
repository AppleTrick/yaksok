'use client';

import { useEffect, useState } from 'react';
import { Check, CircleHelp, RotateCcw, ScanLine, ScanText, Search, Sparkles, TriangleAlert, X } from 'lucide-react';
import ScanStage, { COLORS, Phase, usePhases } from './ScanStage';
import { Candidate, ScanError, ScanResult, analyze, register } from './types';
import './scan.css';

const STEPS: { key: string; label: string; icon: React.ReactNode; phases: Phase[] }[] = [
    { key: 'detect', label: '병 찾기', icon: <ScanLine size={16} />, phases: ['detect', 'read', 'done'] },
    { key: 'ocr', label: '글자 읽기', icon: <ScanText size={16} />, phases: ['read', 'done'] },
    { key: 'match', label: '제품 찾기', icon: <Search size={16} />, phases: ['done'] },
];

const sec = (ms: number) => `${(ms / 1000).toFixed(2)}초`;

export default function ScanScreen({ src, onRetake, onDone }: { src: string; onRetake: () => void; onDone: () => void }) {
    const [result, setResult] = useState<ScanResult | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [wait, setWait] = useState(0);
    const [selected, setSelected] = useState(0);
    const [saved, setSaved] = useState<Record<number, string>>({});
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
            setResult(await analyze(await (await fetch(src)).blob()));
        } catch (e) {
            setError(e instanceof ScanError ? e.message : '분석하지 못했어요.');
            if (e instanceof ScanError) setWait(e.retryAfter);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="sc-page">
            <header className="sc-top">
                <button aria-label="닫기" onClick={onRetake}><X size={22} /></button>
                <strong>{phase === 'done' && result?.products.length ? '이 제품이 맞나요?' : 'AI 스캔'}</strong>
                <span />
            </header>

            <ScanStage src={src} phase={phase} result={result} selected={selected} onSelect={setSelected} />

            <ol className="sc-steps">
                {STEPS.map((s) => {
                    const on = s.phases.includes(phase);
                    return (
                        <li key={s.key} className={on ? 'on' : analyzing ? 'wait' : ''}>
                            {s.icon}<span>{s.label}</span>
                            <b>{on && result ? sec(result.timings[s.key] ?? 0) : '–'}</b>
                        </li>
                    );
                })}
            </ol>

            {error && <div className="sc-error" role="alert"><TriangleAlert size={18} />{error}{wait > 0 && ` (${wait}초 뒤 다시)`}</div>}

            {!result && (
                <div className="sc-actions">
                    <button className="sc-btn" onClick={onRetake} disabled={analyzing}><RotateCcw size={18} /> 다시 찍기</button>
                    <button className="sc-btn primary" onClick={start} disabled={analyzing || wait > 0}><Sparkles size={18} /> {analyzing ? '분석 중' : '분석하기'}</button>
                </div>
            )}

            {phase === 'done' && result && (
                <section className="sc-result">
                    {result.products.length === 0 ? (
                        <div className="sc-empty"><CircleHelp size={28} /><strong>영양제 병이나 상자를 찾지 못했어요</strong><p>알약만으로는 제품을 알 수 없어요. 이름이 보이는 병 앞면을 찍어 주세요.</p></div>
                    ) : (
                        <>
                            <p className="sc-summary" role="status">
                                {result.products.length}개를 찾고 글자 {result.products.reduce((n, p) => n + p.texts.length, 0)}줄을 읽었어요 · 전체 {sec(result.totalMs)}
                            </p>
                            {result.products.length > 1 && (
                                <div className="sc-tabs" role="tablist">
                                    {result.products.map((_, i) => (
                                        <button key={i} role="tab" aria-selected={i === selected} onClick={() => setSelected(i)}>
                                            <i style={{ background: COLORS[i % COLORS.length] }} />{i + 1}번{saved[i] && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {found && (saved[selected]
                                ? <div className="sc-saved"><Check size={20} /> {saved[selected]} 등록했어요</div>
                                : <Picker key={selected} candidates={found.candidates} sure={found.name} onSaved={(name) => setSaved((s) => ({ ...s, [selected]: name }))} />)}
                        </>
                    )}
                    <div className="sc-actions">
                        <button className="sc-btn" onClick={onRetake}><RotateCcw size={18} /> 다시 찍기</button>
                        <button className="sc-btn" onClick={onDone}>{Object.keys(saved).length ? '알림 보기' : '나가기'}</button>
                    </div>
                </section>
            )}
        </div>
    );
}

/** 사람이 고르기 전에는 아무것도 등록하지 않는다 */
function Picker({ candidates, sure, onSaved }: { candidates: Candidate[]; sure: string | null; onSaved: (name: string) => void }) {
    const [picked, setPicked] = useState<string | null>(null);
    const [time, setTime] = useState('09:00');
    const [category, setCategory] = useState('AFTERMEAL');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const c = candidates.find((x) => x.name === picked);

    if (!candidates.length) {
        return <div className="sc-empty"><CircleHelp size={28} /><strong>이 사진으로는 제품을 알 수 없어요</strong><p>병이나 상자에서 이름을 읽지 못했어요. 이름이 크게 보이게 다시 찍어 주세요.</p></div>;
    }

    const save = async () => {
        if (!c) return;
        setBusy(true);
        setError('');
        try {
            await register(c, time, category);
            onSaved(c.name);
        } catch (e) {
            setError(e instanceof ScanError ? e.message : '등록하지 못했어요.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <ul className="sc-cands">
                {candidates.map((x) => (
                    <li key={x.name}>
                        <button aria-pressed={picked === x.name} onClick={() => setPicked(x.name)}>
                            <span className="sc-radio">{picked === x.name && <Check size={14} />}</span>
                            <span className="sc-cand-name">{x.name}{sure === x.name && <em>유력</em>}</span>
                            <span className="sc-score">{Math.round(x.score * 100)}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <p className="sc-hint">숫자는 사진의 글자와 겹치는 정도예요. 포장의 이름과 함량을 꼭 비교해 주세요.</p>
            {c && (
                <div className="sc-detail">
                    {c.ingredients.length ? (
                        <table>
                            <thead><tr><th>성분</th><th>이 제품</th><th>드시는 것과 합계</th></tr></thead>
                            <tbody>
                                {c.ingredients.map((g) => (
                                    <tr key={g.name}>
                                        <td>{g.name}</td>
                                        <td>{Number(g.amount)} {g.unit}</td>
                                        <td className={g.status}>
                                            {Number(g.totalAmount)} {g.unit}
                                            {g.status === 'warning' && ' · 상한 넘음'}{g.status === 'unknown' && ' · 상한 정보 없음'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="sc-hint">이 제품의 성분 정보가 아직 없어요. 추측해서 채우지 않아요.</p>}
                    <div className="sc-when">
                        <input type="time" aria-label="복용 시간" value={time} onChange={(e) => setTime(e.target.value)} />
                        <select aria-label="먹는 때" value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="BEFOREMEAL">식전</option>
                            <option value="AFTERMEAL">식후</option>
                            <option value="BEFORESLEEP">자기 전</option>
                        </select>
                    </div>
                    {error && <div className="sc-error" role="alert"><TriangleAlert size={18} />{error}</div>}
                    <button className="sc-btn primary wide" disabled={busy || !c.productId || !time} onClick={save}>{busy ? '등록 중' : '맞아요, 등록하기'}</button>
                </div>
            )}
        </>
    );
}
