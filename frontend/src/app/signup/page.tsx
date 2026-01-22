'use client';

import React, { useState } from 'react';
import SignupForm from '@/features/signup/components/SignupForm';
import '@/features/signup/styles.css';

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = (data: any) => {
        setIsLoading(true);
        // Simulate signup API call
        setTimeout(() => {
            setIsLoading(false);
            console.log('Signup attempt', data);
            // Handle successful signup
        }, 1500);
    };

    return <SignupForm onSubmit={handleSignup} isLoading={isLoading} />;
}
