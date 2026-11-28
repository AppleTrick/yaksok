"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight, LogOut, Moon, ShieldCheck, User } from 'lucide-react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { List, ListItem } from '@astryxdesign/core/List';
import { Switch } from '@astryxdesign/core/Switch';
import { Button } from '@astryxdesign/core/Button';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { useUserInfo, clearUserInfo } from '@/services/useUserInfo';
import { logout } from '@/services/userService';
import { useTheme } from '@/contexts/ThemeContext';
import '@/features/page.css';

// 설정 탭과 /mypage가 같은 화면을 쓴다 (Astryx 부품).
// 화면 뼈대는 바로 그리고, 사용자 정보가 들어갈 곳만 받는 동안 Skeleton으로 둔다.
export default function MyPageScreen() {
    const router = useRouter();
    const { userInfo, failed } = useUserInfo();
    const { theme, setTheme } = useTheme();
    const [askLogout, setAskLogout] = useState(false);

    if (failed) {
        return (
            <VStack className="pg" gap={4} hAlign="center">
                <EmptyState
                    title="로그인이 필요해요"
                    description="맞춤형 영양제 정보를 보려면 먼저 로그인해 주세요."
                    icon={<User size={32} />}
                    actions={<Button variant="primary" label="로그인하러 가기" onClick={() => router.replace('/login')} />}
                />
            </VStack>
        );
    }

    const user = userInfo?.userDataResponse;
    const diseases = userInfo?.userDiseases ?? [];

    return (
        <VStack className="pg" gap={4}>
            <Heading level={1}>설정</Heading>

            <Card>
                <HStack gap={3} vAlign="center">
                    <Avatar name={user?.name ?? ''} size="lg" />
                    {user ? (
                        <VStack gap={0.5}>
                            <Heading level={2}>{user.name}</Heading>
                            <Text color="secondary">{user.email}</Text>
                        </VStack>
                    ) : (
                        <VStack gap={1}>
                            <Skeleton width={96} height={22} />
                            <Skeleton width={160} height={14} />
                        </VStack>
                    )}
                </HStack>
            </Card>

            <Card>
                <VStack gap={2}>
                    <Heading level={3}>내 질환 정보</Heading>
                    {!userInfo ? (
                        <Skeleton width={120} height={24} />
                    ) : diseases.length ? (
                        <HStack gap={1} wrap="wrap">
                            {diseases.map((d) => <Badge key={d.id} variant="orange" label={d.sickName} />)}
                        </HStack>
                    ) : (
                        <Text color="secondary">등록된 질환 정보가 없어요.</Text>
                    )}
                </VStack>
            </Card>

            <Card padding={1}>
                <List hasDividers>
                    <ListItem label="내 정보 수정" startContent={<User size={20} />} endContent={<ChevronRight size={18} />} href="/mypage/edit" />
                    <ListItem label="계정 및 보안" startContent={<ShieldCheck size={20} />} endContent={<ChevronRight size={18} />} href="/mypage/security" />
                    <ListItem label="알림 설정" startContent={<Bell size={20} />} endContent={<ChevronRight size={18} />} href="/settings/notification" />
                    <ListItem
                        label="어두운 화면"
                        startContent={<Moon size={20} />}
                        endContent={<Switch label="어두운 화면" isLabelHidden value={theme === 'dark'} onChange={(on) => setTheme(on ? 'dark' : 'light')} />}
                    />
                </List>
            </Card>

            <Button variant="secondary" size="lg" icon={<LogOut size={18} />} label="로그아웃" onClick={() => setAskLogout(true)} />

            <AlertDialog
                isOpen={askLogout}
                onOpenChange={setAskLogout}
                title="로그아웃할까요?"
                description="다음에 들어올 때 다시 로그인해야 해요."
                actionLabel="로그아웃"
                cancelLabel="취소"
                onAction={async () => {
                    await logout();
                    localStorage.removeItem('userName');
                    clearUserInfo();
                    router.push('/login');
                }}
            />
        </VStack>
    );
}
