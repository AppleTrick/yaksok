import React from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import '../styles.css';

interface EmailSentMessageProps {
    email: string;
}

export default function EmailSentMessage({ email }: EmailSentMessageProps) {
    return (
        <div className="find-password-container">
            <header className="find-password-header">
                <h1 className="find-password-title">이메일 전송 완료</h1>
            </header>

            <div className="success-message">
                <h3>인증 메일을 보냈습니다.</h3>
                <p>{email}로 전송된 메일을 확인하여<br />비밀번호를 재설정해 주세요.</p>
            </div>

            <Link href="/login" style={{ width: '100%' }}>
                <Button variant="primary" style={{ width: '100%' }}>
                    로그인으로 돌아가기
                </Button>
            </Link>
        </div>
    );
}
