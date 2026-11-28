import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Skeleton } from '@astryxdesign/core/Skeleton';

interface HomeHeaderProps {
    userName: string;
    greetingText: string;
    isLoading: boolean;
}

export default function HomeHeader({ userName, greetingText, isLoading }: HomeHeaderProps) {
    return (
        <VStack gap={0.5} as="header">
            <Text color="secondary">{greetingText}</Text>
            {isLoading ? <Skeleton width={112} height={32} /> : <Heading level={1}>{userName} 님</Heading>}
            <Text color="secondary" size="sm">오늘도 건강 약속을 지켜보세요.</Text>
        </VStack>
    );
}
