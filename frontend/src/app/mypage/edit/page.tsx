'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { ToggleButton, ToggleButtonGroup } from '@astryxdesign/core/ToggleButton';
import { Button } from '@astryxdesign/core/Button';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Banner } from '@astryxdesign/core/Banner';
import SubPageHeader from '@/components/SubPageHeader';
import { updateUserInfo, Disease, UserInfo } from '@/services/userService';
import { useUserInfo, clearUserInfo, loadUserInfo } from '@/services/useUserInfo';
import '@/features/page.css';

export default function EditProfilePage() {
    const { userInfo } = useUserInfo();
    // 정보가 오기 전에는 칸을 만들지 않는다. 받은 값으로 처음부터 채워 입력 중인 값을 덮지 않게 한다.
    if (!userInfo) {
        return (
            <VStack className="pg lg-page" gap={4}>
                <SubPageHeader title="내 정보 수정" />
                <Skeleton height={48} />
                <Skeleton height={48} />
            </VStack>
        );
    }
    return <EditProfileForm initial={userInfo} />;
}

function EditProfileForm({ initial }: { initial: UserInfo }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [failed, setFailed] = useState(false);

    const [name, setName] = useState(initial.userDataResponse.name);
    const [ageGroup, setAgeGroup] = useState(initial.userDataResponse.ageGroup);
    const [gender, setGender] = useState(initial.userDataResponse.gender);
    const allDiseases: Disease[] = initial.allDiseases;
    const [selectedDiseaseIds, setSelectedDiseaseIds] = useState<number[]>(initial.userDiseases.map(d => d.id));

    const [nameError, setNameError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setNameError('닉네임을 입력해 주세요.');
            return;
        }
        setNameError('');

        setSubmitting(true);
        const success = await updateUserInfo({
            name,
            ageGroup,
            gender,
            diseaseIds: selectedDiseaseIds
        });

        if (success) {
            clearUserInfo();
            await loadUserInfo();
            alert("정보가 수정되었습니다.");
            router.push('/settings'); // Redirect to settings page instead of /mypage (alias)
        } else {
            setFailed(true);
        }
        setSubmitting(false);
    };

    const ages = [['TEN', '10대'], ['TWENTY', '20대'], ['THIRTY', '30대'], ['FORTY', '40대'], ['FIFTY', '50대'], ['SIXTY', '60대 이상']];

    return (
        <VStack className="pg lg-page" gap={5}>
            <SubPageHeader title="내 정보 수정" />
            <form onSubmit={handleSubmit}>
                <VStack gap={4}>
                    <TextInput label="닉네임" placeholder="닉네임을 입력하세요" value={name} onChange={setName} size="lg"
                        status={nameError ? { type: 'error', message: nameError } : undefined} />
                    <Selector label="연령대" options={ages.map(([value, label]) => ({ value, label }))} value={ageGroup || undefined} onChange={(v) => setAgeGroup(v ?? '')} />
                    <VStack gap={1}>
                        <Text type="label" weight="semibold">성별</Text>
                        <SegmentedControl label="성별" layout="fill" value={gender} onChange={setGender}>
                            <SegmentedControlItem value="MALE" label="남성" />
                            <SegmentedControlItem value="FEMALE" label="여성" />
                        </SegmentedControl>
                    </VStack>
                    <VStack gap={1}>
                        <Text type="label" weight="semibold">보유 질환</Text>
                        <ToggleButtonGroup label="보유 질환" type="multiple" value={selectedDiseaseIds.map(String)}
                            onChange={(v: string | string[] | null) => setSelectedDiseaseIds(((v as string[]) ?? []).map(Number))}>
                            {allDiseases.map((d) => <ToggleButton key={d.id} value={String(d.id)} label={d.sickName} />)}
                        </ToggleButtonGroup>
                    </VStack>
                    {failed && <Banner status="error" title="정보를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요." />}
                    <Button type="submit" variant="primary" size="lg" width="100%" label="저장하기" isLoading={submitting} />
                </VStack>
            </form>
        </VStack>
    );
}
