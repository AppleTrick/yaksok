"use client";

import Link from 'next/link';
import { Theme } from '@astryxdesign/core/theme';
import { LinkProvider } from '@astryxdesign/core/Link';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import koKR from '@astryxdesign/core/locales/ko-KR.generated.js';
import { themes, defaultThemeSlug } from '@/astryx-themes';
import { useTheme } from '@/contexts/ThemeContext';

// Astryx 테마를 앱 전체에 건다. 밝은·어두운 모드는 앱 설정(ThemeContext)을 따른다.
export default function AstryxRoot({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    return (
        // 부품 안의 글자(시간 표시, "필수", 닫기 등)를 한국어로
        <InternationalizationProvider locale="ko-KR" messages={{ 'ko-KR': koKR }}>
            <Theme theme={themes[defaultThemeSlug]} mode={theme}>
                <LinkProvider component={Link}>{children}</LinkProvider>
            </Theme>
        </InternationalizationProvider>
    );
}
