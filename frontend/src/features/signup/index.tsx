'use client';

import React, { useState } from 'react';
import SignupForm from './components/SignupForm';
import './styles.css';

export default function SignupFeature() {
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
