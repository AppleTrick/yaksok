import { Suspense } from 'react';
import LoginFeature from '@/features/login';

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginFeature />
        </Suspense>
    );
}
