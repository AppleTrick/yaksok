interface HomeHeaderProps {
    userName: string;
    greetingText: string;
    isLoading: boolean;
}

export default function HomeHeader({ userName, greetingText, isLoading }: HomeHeaderProps) {
    return (
        <header>
            <p className="hm-greet">{greetingText}</p>
            <h1 className="hm-name">
                {isLoading ? <span className="skeleton-line" style={{ width: '7rem', height: '1.6em' }} aria-label="이름을 불러오는 중" /> : `${userName} 님`}
            </h1>
            <p className="hm-sub">오늘도 건강 약속을 지켜보세요.</p>
        </header>
    );
}
