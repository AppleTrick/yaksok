'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, Clock, Moon, Trash2, X } from 'lucide-react';
import PushStatus from './PushStatus';
import {
    Alarm, AlarmCategory, CATEGORY_LABEL, DAY_LABELS, QuietHours, deleteAlarm, describeDays, fetchAlarms, fetchQuietHours,
    formatTime, parseDays, runsToday, saveAlarm, saveQuietHours, toggleAlarm,
} from './api';
import './alarms.css';

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
    return (
        <button type="button" role="switch" aria-checked={on} aria-label={label} className="al-switch" onClick={onChange}>
            <span />
        </button>
    );
}

export default function AlarmsScreen() {
    const [alarms, setAlarms] = useState<Alarm[] | null>(null);
    const [quiet, setQuiet] = useState<QuietHours | null>(null);
    const [editing, setEditing] = useState<Alarm | null>(null);
    const [error, setError] = useState('');
    const [now, setNow] = useState<Date | null>(null);

    const load = useCallback(async () => {
        try {
            const [a, q] = await Promise.all([fetchAlarms(), fetchQuietHours()]);
            setAlarms(a);
            setQuiet(q);
            setNow(new Date());
            setError('');
        } catch {
            setError('알림을 불러오지 못했어요.');
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    // 저장한 뒤 서버 상태를 다시 읽는다. 화면만 바뀌고 저장은 안 되던 문제를 막는다.
    const run = async (action: () => Promise<unknown>) => {
        try {
            await action();
            await load();
        } catch {
            setError('저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
        }
    };

    const sorted = [...(alarms ?? [])].sort((a, b) => (a.intakeTime ?? '').localeCompare(b.intakeTime ?? ''));
    const next = now && sorted.find((a) => a.enabled && !a.intaken && a.intakeTime && runsToday(a, now)
        && a.intakeTime.slice(0, 5) > now.toTimeString().slice(0, 5));

    return (
        <main className="al-page">
            <header className="al-header">
                <p>{now?.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }) ?? ' '}</p>
                <h1>알림</h1>
            </header>

            {error && <div className="al-error" role="alert">{error}<button onClick={load}>다시 시도</button></div>}

            {next && (
                <section className="al-next">
                    <span>오늘 다음 알림</span>
                    <strong>{formatTime(next.intakeTime!)}</strong>
                    <p>{next.nickname} · {CATEGORY_LABEL[next.category]}</p>
                </section>
            )}

            <PushStatus />

            <h2 className="al-section">복용 알림</h2>
            {alarms === null && !error && <div className="al-skeleton" />}
            {alarms?.length === 0 && (
                <div className="al-empty">
                    <p>아직 알림이 없어요.<br />영양제를 찍어 등록하면 알림이 만들어져요.</p>
                    <Link href="/camera" className="al-btn al-btn-primary"><Camera size={18} /> 영양제 찍기</Link>
                </div>
            )}
            <ul className="al-list">
                {sorted.map((a) => (
                    <li key={a.id} className={a.enabled ? '' : 'off'}>
                        <button className="al-item" onClick={() => setEditing(a)}>
                            <span className="al-time">{a.intakeTime ? formatTime(a.intakeTime) : '시간 없음'}</span>
                            <span className="al-name">{a.nickname}</span>
                            <span className="al-meta">
                                {describeDays(parseDays(a.daysOfWeek))} · {CATEGORY_LABEL[a.category]}{a.intaken ? ' · 오늘 먹음' : ''}
                            </span>
                        </button>
                        <Switch on={a.enabled} label={`${a.nickname} 알림`} onChange={() => run(() => toggleAlarm(a.id))} />
                    </li>
                ))}
            </ul>

            {quiet && (
                <>
                    <h2 className="al-section">방해금지</h2>
                    <section className="al-quiet">
                        <div className="al-quiet-row">
                            <Moon size={20} />
                            <div><strong>이 시간에는 울리지 않기</strong><p>끝나면 밀린 알림을 한 번에 알려 드려요</p></div>
                            <Switch on={quiet.enabled} label="방해금지" onChange={() => run(() => saveQuietHours({ ...quiet, enabled: !quiet.enabled }))} />
                        </div>
                        {quiet.enabled && (
                            <div className="al-quiet-times">
                                <input type="time" aria-label="방해금지 시작" value={(quiet.quietStart ?? '22:00').slice(0, 5)}
                                    onChange={(e) => e.target.value && run(() => saveQuietHours({ ...quiet, quietStart: `${e.target.value}:00` }))} />
                                <span>부터</span>
                                <input type="time" aria-label="방해금지 끝" value={(quiet.quietEnd ?? '07:00').slice(0, 5)}
                                    onChange={(e) => e.target.value && run(() => saveQuietHours({ ...quiet, quietEnd: `${e.target.value}:00` }))} />
                                <span>까지</span>
                            </div>
                        )}
                    </section>
                </>
            )}
            <p className="al-note"><Clock size={14} /> 안 드시면 10분 간격으로 세 번까지 알려 드려요.</p>

            {editing && (
                <EditSheet alarm={editing} onClose={() => setEditing(null)}
                    onSave={(t, c, d) => { run(() => saveAlarm(editing, t, c, d)); setEditing(null); }}
                    onDelete={() => { run(() => deleteAlarm(editing.id)); setEditing(null); }} />
            )}
        </main>
    );
}

function EditSheet({ alarm, onClose, onSave, onDelete }: {
    alarm: Alarm;
    onClose: () => void;
    onSave: (time: string, category: AlarmCategory, days: number[]) => void;
    onDelete: () => void;
}) {
    const [time, setTime] = useState((alarm.intakeTime ?? '09:00').slice(0, 5));
    const [category, setCategory] = useState(alarm.category);
    const [days, setDays] = useState(parseDays(alarm.daysOfWeek));
    const [confirming, setConfirming] = useState(false);
    const flip = (d: number) => setDays((v) => (v.includes(d) ? v.filter((x) => x !== d) : [...v, d]));

    return (
        <div className="al-dim" onClick={onClose}>
            <div className="al-sheet" role="dialog" aria-modal="true" aria-label="알림 수정" onClick={(e) => e.stopPropagation()}>
                <div className="al-sheet-head"><strong>{alarm.nickname}</strong><button aria-label="닫기" onClick={onClose}><X size={22} /></button></div>
                <input className="al-sheet-time" type="time" aria-label="복용 시간" value={time} onChange={(e) => setTime(e.target.value)} />
                <div className="al-seg" role="group" aria-label="먹는 때">
                    {(Object.keys(CATEGORY_LABEL) as AlarmCategory[]).map((c) => (
                        <button key={c} aria-pressed={c === category} onClick={() => setCategory(c)}>{CATEGORY_LABEL[c]}</button>
                    ))}
                </div>
                <div className="al-days" role="group" aria-label="요일">
                    {DAY_LABELS.map((label, i) => (
                        <button key={label} aria-pressed={days.includes(i + 1)} onClick={() => flip(i + 1)}>{label}</button>
                    ))}
                </div>
                <p className="al-days-text">{days.length ? describeDays(days) : '요일을 하나 이상 골라 주세요'}</p>
                <button className="al-btn al-btn-primary al-btn-wide" disabled={!days.length || !time} onClick={() => onSave(time, category, days)}>저장</button>
                <button className="al-btn al-btn-danger al-btn-wide" onClick={() => (confirming ? onDelete() : setConfirming(true))}>
                    <Trash2 size={16} /> {confirming ? '한 번 더 누르면 지워져요' : '알림 지우기'}
                </button>
            </div>
        </div>
    );
}
