import React from 'react';
import Link from "next/link";
import { Camera } from "lucide-react";
import '../styles.css'; // Assuming styles are shared or we import specific ones

export default function HomeActionCard() {
    return (
        <section className="action-card">
            <div className="action-text">
                <h2>영양제 등록하기</h2>
                <p>새 영양제를 촬영해 등록하세요</p>
            </div>
            <Link href="/camera" className="action-button">
                <Camera size={20} />
                <span>지금 촬영하기</span>
            </Link>
        </section>
    );
}
