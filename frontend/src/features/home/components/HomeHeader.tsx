import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Skeleton } from '@astryxdesign/core/Skeleton';

interface HomeHeaderProps {
    userName: string;
    greetingText: string;
    dateText: string;
    isLoading: boolean;
}

export default function HomeHeader({ userName, greetingText, dateText, isLoading }: HomeHeaderProps) {
    return (
        <VStack gap={1} as="header">
            <Text color="secondary" size="sm" weight="semibold">{dateText || ' '}</Text>
            <Heading level={1} className="hm-hello">
                {greetingText}<br />
                {isLoading ? <Skeleton width={120} height={30} /> : `${userName} 님`}
            </Heading>
        </VStack>
    );
}
