'use client';

import React, { useState } from 'react';
import FindPasswordForm from './components/FindPasswordForm';
import EmailSentMessage from './components/EmailSentMessage';
import './styles.css';

export default function FindPasswordFeature() {
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
