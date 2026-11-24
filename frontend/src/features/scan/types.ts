export interface Ingredient {
    name: string;
    amount: string;
    unit: string;
    totalAmount: string;
    status: 'safe' | 'warning' | 'unknown';
}

export interface Candidate {
    productId: number | null;
    name: string;
    score: number;
    ingredients: Ingredient[];
}

export interface TextLine {
    text: string;
    score: number;
    quad: [number, number][]; // 사진 안 위치 (0~1)
}

export interface Found {
    name: string | null; // 서버가 유력하다고 본 이름. 등록은 사용자가 고른 것만 한다.
    box: [number, number, number, number];
    confidence: number;
    candidates: Candidate[];
    texts: TextLine[];
}

export interface ScanResult {
    products: Found[];
    timings: Record<string, number>;
    totalMs: number;
}

export class ScanError extends Error {
    constructor(message: string, readonly retryAfter = 0) {
        super(message);
    }
}

export async function analyze(blob: Blob): Promise<ScanResult> {
    const form = new FormData();
    form.append('file', blob, 'photo.jpg');
    const started = performance.now();
    let res: Response;
    try {
        res = await fetch('/api/v1/analyze', { method: 'POST', credentials: 'include', body: form });
    } catch {
        throw new ScanError('인터넷 연결을 확인해 주세요.');
    }
    const body = await res.json().catch(() => null);
    if (res.status === 401 || res.status === 403) throw new ScanError('로그인이 필요해요.');
    if (!res.ok || !body?.success) {
        throw new ScanError(body?.error?.message ?? '분석하지 못했어요. 잠시 뒤 다시 시도해 주세요.', Number(res.headers.get('Retry-After')) || 0);
    }
    return { products: body.data.reportData.products, timings: body.data.timings ?? {}, totalMs: Math.round(performance.now() - started) };
}

export async function register(c: Candidate, time: string, category: string): Promise<void> {
    const res = await fetch('/api/v1/products/user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            productId: c.productId, nickname: c.name.slice(0, 60), dailyDose: 1, doseAmount: 1, doseUnit: '회',
            intakeTime: time, intakeCategory: category,
        }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new ScanError(body?.error?.code === 'USER_PRODUCT_409' ? '이미 등록한 영양제예요.' : '등록하지 못했어요.');
    }
}
