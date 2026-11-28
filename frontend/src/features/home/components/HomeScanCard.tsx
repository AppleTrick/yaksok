import { Camera, Sparkles } from "lucide-react";
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';

export default function HomeScanCard() {
    return (
        <Card>
            <VStack gap={3}>
                <HStack gap={3} vAlign="center">
                    <Sparkles size={22} aria-hidden="true" color="var(--color-icon-accent)" />
                    <VStack gap={0.5}>
                        <Heading level={3}>새로운 영양제가 있나요?</Heading>
                        <Text color="secondary" size="sm">사진 한 장으로 제품을 찾고 성분을 확인해요</Text>
                    </VStack>
                </HStack>
                <Button variant="primary" size="lg" width="100%" icon={<Camera size={18} />} label="영양제 찍기" href="/camera" />
            </VStack>
        </Card>
    );
}
