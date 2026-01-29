import React from 'react';
import '../styles.css';

export default function MyPageHeader() {
    return (
        <header className="mypage-header">
            {/* 뒤로가기 버튼 제거됨 (탭바 사용) */}
            <div style={{ width: 24 }}></div>
            <h1 className="header-title">마이페이지</h1>
            {/* 설정 버튼 제거됨 */}
            <div style={{ width: 24 }}></div>
        </header>
    );
}
