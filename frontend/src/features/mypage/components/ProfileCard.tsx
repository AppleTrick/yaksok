import React from 'react';
import { User } from 'lucide-react';
import '../styles.css';

interface ProfileCardProps {
    userName: string;
    email: string;
}

export default function ProfileCard({ userName, email }: ProfileCardProps) {
    return (
        <div className="profile-section">
            <div className="profile-image-wrapper">
                <User size={56} className="profile-icon-large" />
            </div>
            <h2 className="profile-name">{userName}</h2>
            <p className="profile-email">{email}</p>
        </div>
    );
}
