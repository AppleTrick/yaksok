'use client';

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
    const [mockingEnabled, setMockingEnabled] = useState(false);

    useEffect(() => {
        async function enableMocking() {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                const { worker } = await import('../mocks/browser');
                await worker.start({
                    onUnhandledRequest: 'bypass', // Don't warn for unhandled requests
                });
                setMockingEnabled(true);
            } else {
                setMockingEnabled(true);
            }
        }
        enableMocking();
    }, []);

    if (!mockingEnabled) {
        return null;
    }

    return <>{children}</>;
}
