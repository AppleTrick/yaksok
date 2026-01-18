
import Link from 'next/link';
import { Home, Pill, FileText, Settings } from 'lucide-react';
import './BottomTabBar.css';

export default function BottomTabBar() {
  return (
    <nav className="bottom-tab-bar">
      <Link href="/" className="tab-item">
        <Home size={24} />
        <span>홈</span>
      </Link>
      <Link href="/my-meds" className="tab-item">
        <Pill size={24} />
        <span>내 영양제</span>
      </Link>
      <Link href="/record" className="tab-item">
        <FileText size={24} />
        <span>기록</span>
      </Link>
      <Link href="/settings" className="tab-item">
        <Settings size={24} />
        <span>설정</span>
      </Link>
    </nav>
  );
}
