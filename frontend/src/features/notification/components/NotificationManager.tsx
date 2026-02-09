"use client";

import React from 'react';
import { useNotification } from '../hooks/useNotification';
import { Bell } from 'lucide-react';
import './styles.css';

export default function NotificationManager() {
    const { activeAlert } = useNotification();

    if (!activeAlert) return null;

    return (
        <div className="in-app-notification-toast">
            <div className="toast-icon">
                <Bell size={24} color="#FFF" />
            </div>
            <div className="toast-content">
                <h4>{activeAlert.title}</h4>
                <p>{activeAlert.body}</p>
            </div>
        </div>
    );
}
