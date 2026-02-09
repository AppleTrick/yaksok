'use client';

import React, { useState } from 'react';
import FindPasswordForm from '@/features/find-password/components/FindPasswordForm';
import EmailSentMessage from '@/features/find-password/components/EmailSentMessage';
import '@/features/find-password/styles.css';

export default function FindPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleFindPassword = (submittedEmail: string) => {
        setIsLoading(true);
        setEmail(submittedEmail);
        // Simulate find password API call
        setTimeout(() => {
            setIsLoading(false);
            setIsSent(true);
            console.log('Find password attempt', { email: submittedEmail });
        }, 1500);
    };

    if (isSent) {
        return <EmailSentMessage email={email} />;
    }

    return <FindPasswordForm onSubmit={handleFindPassword} isLoading={isLoading} />;
}
