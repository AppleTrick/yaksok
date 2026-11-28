import Link from "next/link";
import { Camera, ChevronRight, Sparkles } from "lucide-react";

export default function HomeScanCard() {
    return (
        <section className="hm-card hm-scan" aria-label="새 영양제 찍기">
            <span className="hm-scan-icon" aria-hidden="true"><Sparkles size={22} /></span>
            <div>
                <h2 className="hm-scan-title">새로운 영양제가 있나요?</h2>
                <p className="hm-scan-desc">사진 한 장으로 제품을 찾고 성분을 확인해요</p>
            </div>
            <Link href="/camera" className="hm-scan-btn">
                <Camera size={18} aria-hidden="true" />
                영양제 찍기
                <ChevronRight size={18} aria-hidden="true" />
            </Link>
        </section>
    );
}
