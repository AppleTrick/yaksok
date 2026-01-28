"use client";

import Link from "next/link";
import { Bell, ChevronRight, User, Shield } from "lucide-react";
import './styles.css'; // We'll create a simple style or reuse globals

export default function SettingsPage() {
    return (
        <div className="settings-container">
            <header className="settings-header-main">
                <h1>설정</h1>
            </header>

            <div className="settings-menu">
                <section className="menu-section">
                    <h2 className="section-title">계정</h2>
                    <div className="menu-item">
                        <div className="menu-icon-wrapper">
                            <User size={20} />
                        </div>
                        <span className="menu-label">내 정보 (예시)</span>
                        <ChevronRight size={16} className="menu-arrow" />
                    </div>
                </section>
            </div>
        </div>
    );
}
