'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Check, Clock, Pill } from 'lucide-react';
import Modal from '@/components/Modal';
import { useReportContext } from '@/features/report/contexts/ReportContext';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { Ingredient, ScanError, register } from '@/features/scan/types';
import '@/features/report/report.css';

const CATEGORIES = [
    { value: 'BEFOREMEAL', label: '식전' },
    { value: 'AFTERMEAL', label: '식후' },
    { value: 'BEFORESLEEP', label: '자기 전' },
];

const num = (v?: string) => Number(v ?? 0) || 0;
const fmt = (v: number) => (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2).replace(/\.?0+$/, ''));

/**
 * 영양제 리포트 (예전 흐름의 4단계). 성분별 섭취량을 보여 주고 한 번에 등록한다.
 * 상한을 넘는 성분이 있으면 등록하지 않고 경고한다 (예전 동작 그대로).
 */
export default function ReportPage() {
    const router = useRouter();
    const { reportData, clearReportData } = useReportContext();
    const { refreshSchedules } = useScheduleContext();
    const items = reportData.items;
    const [tab, setTab] = useState(0);
    const [times, setTimes] = useState(() => items.map((x) => ({
        time: x.intakeTime?.slice(0, 5) ?? '09:00',
        category: x.intakeCategory ?? 'AFTERMEAL',
    })));
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [warning, setWarning] = useState<string[] | null>(null);
    const [done, setDone] = useState<number | null>(null);
    const leaving = useRef(false);

    useEffect(() => {
        if (!items.length && !leaving.current) router.replace('/camera');
    }, [items.length, router]);
    if (!items.length) return null;

    const all = items.flatMap((x) => x.ingredients);
    const warned = [...new Set(all.filter((g) => g.status === 'warning').map((g) => g.name))];
    const registrable = items.filter((x) => x.productId !== null);
    const item = items[tab];

    const leave = (to: string) => {
        leaving.current = true;
        clearReportData();
        router.push(to);
    };

    const registerAll = async () => {
        if (warned.length) {
            setWarning(warned);
            return;
        }
        setBusy(true);
        const failed: string[] = [];
        let ok = 0;
        for (const [i, x] of items.entries()) {
            if (x.productId === null) continue;
            try {
                await register(x, times[i].time, times[i].category);
                ok += 1;
            } catch (e) {
                failed.push(e instanceof ScanError ? e.message : `${x.name}: 등록하지 못했어요.`);
            }
        }
        setBusy(false);
        setErrors(failed);
        if (ok) {
            await refreshSchedules();
            setDone(ok);
        }
    };

    return (
        <div className="rp-page">
            <header className="rp-top">
                <button aria-label="다시 찍기" onClick={() => leave('/camera')}><ArrowLeft size={22} /></button>
                <h1>영양제 리포트</h1>
                <span />
            </header>

            <section className="rp-hero">
                <div><b>{items.length}</b><span>영양제</span></div>
                <div><b>{all.length}</b><span>성분</span></div>
                <div className={warned.length ? 'warn' : 'ok'}>
                    <b>{warned.length || <Check size={22} />}</b><span>{warned.length ? '주의 성분' : '모두 안전'}</span>
                </div>
            </section>

            {items.length > 1 && (
                <div className="rp-tabs" role="tablist">
                    {items.map((x, i) => (
                        <button key={x.name} role="tab" aria-selected={i === tab} onClick={() => setTab(i)}>{x.name}</button>
                    ))}
                </div>
            )}

            <section className="rp-card">
                <div className="rp-product">
                    <span className="rp-icon"><Pill size={22} /></span>
                    <div>
                        <h2>{item.name}</h2>
                        <p>{item.productId === null ? 'DB에 없는 제품이라 등록할 수 없어요' : `성분 ${item.ingredients.length}개`}</p>
                    </div>
                </div>

                <h3>성분별 섭취량</h3>
                {item.ingredients.length ? (
                    <ul className="rp-ings">{item.ingredients.map((g) => <IngredientRow key={g.name} g={g} />)}</ul>
                ) : (
                    <p className="rp-muted">이 제품의 성분 정보가 아직 없어요. 추측해서 채우지 않아요.</p>
                )}

                {item.productId !== null && (
                    <>
                        <h3><Clock size={16} /> 복용 알림</h3>
                        <div className="rp-when">
                            <input type="time" aria-label="복용 시간" value={times[tab].time}
                                onChange={(e) => setTimes((v) => v.map((t, i) => (i === tab ? { ...t, time: e.target.value } : t)))} />
                            <div className="rp-seg" role="group" aria-label="먹는 때">
                                {CATEGORIES.map((c) => (
                                    <button key={c.value} aria-pressed={times[tab].category === c.value}
                                        onClick={() => setTimes((v) => v.map((t, i) => (i === tab ? { ...t, category: c.value } : t)))}>{c.label}</button>
                                ))}
                            </div>
                        </div>
                        {!items[tab].intakeTime && <p className="rp-muted">추천 시간이 없어 기본값을 넣었어요. 바꿔도 돼요.</p>}
                    </>
                )}
            </section>

            {errors.length > 0 && <div className="rp-error" role="alert">{errors.map((m) => <p key={m}>{m}</p>)}</div>}

            <div className="rp-bottom">
                <button className="rp-btn" disabled={busy || !registrable.length || times.some((t) => !t.time)} onClick={registerAll}>
                    {busy ? '등록 중' : registrable.length ? `${registrable.length}개 영양제 등록하기` : '등록할 수 있는 영양제가 없어요'}
                </button>
            </div>

            <Modal isOpen={done !== null} onClose={() => leave('/my-supplements')} title="등록 완료" hideCloseButton type="alert"
                onConfirm={() => leave('/my-supplements')} confirmText="내 영양제 보기">
                <p className="rp-modal">영양제 <strong>{done}개</strong>를 등록했어요.<br />복용 시간에 알려 드릴게요.</p>
            </Modal>

            <Modal isOpen={warning !== null} onClose={() => setWarning(null)} title="섭취량 주의" type="confirm"
                onConfirm={() => leave('/camera')} confirmText="다시 찍기" cancelText="닫기">
                <div className="rp-modal">
                    <AlertTriangle size={28} color="#D83A08" />
                    <p>지금 드시는 영양제와 합치면 아래 성분이<br /><strong>상한 섭취량을 넘어요.</strong></p>
                    <ul>{warning?.map((n) => <li key={n}>{n}</li>)}</ul>
                    <p className="rp-muted">과다 섭취는 부작용이 생길 수 있어요. 섭취량을 조절해 주세요.</p>
                </div>
            </Modal>
        </div>
    );
}

/** 이미 먹는 양과 이번에 더해지는 양을 한 막대로 보여 준다 */
function IngredientRow({ g }: { g: Ingredient }) {
    const mine = num(g.myAmount);
    const add = num(g.amount);
    const total = Math.max(num(g.totalAmount), mine + add) || 1;
    return (
        <li className={g.status}>
            <div className="rp-ing-head">
                <strong>{g.name}</strong>
                <span className="rp-badge">{g.status === 'warning' ? '과다 주의' : g.status === 'unknown' ? '상한 정보 없음' : '안전'}</span>
            </div>
            <div className="rp-bar" aria-hidden>
                <i className="mine" style={{ width: `${(mine / total) * 100}%` }} />
                <i className="add" style={{ width: `${(add / total) * 100}%` }} />
            </div>
            <p className="rp-ing-num">
                {mine > 0 && <>지금 {fmt(mine)} + </>}이 제품 {fmt(add)} = <b>{fmt(mine + add)} {g.unit}</b>
            </p>
        </li>
    );
}
