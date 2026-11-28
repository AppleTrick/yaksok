'use client';

import { useSyncExternalStore } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { BellOff, BellRing, TriangleAlert } from 'lucide-react';
import { pushConfigured } from '@/lib/firebase';
import { useFCM } from '@/features/notification/hooks/useFCM';

const noSubscribe = () => () => {};

/** 푸시가 왜 안 오는지 알 수 있게, 실제 상태를 그대로 보여 준다 */
export default function PushStatus() {
    const { permission, isSupported, isLoading, fcmToken, requestPermission } = useFCM();
    const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
    if (!mounted || isLoading) return null;

    if (!pushConfigured) {
        return <Card tone="warn" icon={<TriangleAlert size={20} />} title="앱을 닫으면 알림이 오지 않아요" text="푸시 알림이 아직 연결되지 않았어요. 앱을 열어 둔 동안에는 알림이 와요." />;
    }
    if (!isSupported) {
        return <Card tone="warn" icon={<TriangleAlert size={20} />} title="이 브라우저는 푸시를 지원하지 않아요" text="아이폰은 공유 버튼에서 홈 화면에 추가한 뒤 켤 수 있어요." />;
    }
    if (permission === 'denied') {
        return <Card tone="warn" icon={<BellOff size={20} />} title="알림이 차단되어 있어요" text="브라우저의 사이트 설정에서 알림을 허용해 주세요." />;
    }
    if (permission === 'granted' && fcmToken) {
        return <Card tone="ok" icon={<BellRing size={20} />} title="푸시 알림이 켜져 있어요" text="앱을 닫아도 제시간에 알려 드려요." />;
    }
    return (
        <Card tone="info" icon={<BellRing size={20} />} title="앱을 닫아도 알림 받기" text="복용 시간을 놓치지 않게 알려 드려요.">
            <Button variant="primary" size="sm" label="알림 켜기" onClick={requestPermission} />
        </Card>
    );
}

// 상태 안내는 Astryx Banner로 그린다
function Card({ tone, title, text, children }: {
    tone: 'ok' | 'warn' | 'info'; icon?: React.ReactNode; title: string; text: string; children?: React.ReactNode;
}) {
    const status = tone === 'ok' ? 'success' : tone === 'warn' ? 'warning' : 'info';
    return <Banner status={status} title={title} description={text} endContent={children} />;
}
