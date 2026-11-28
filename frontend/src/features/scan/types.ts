export interface Ingredient {
    name: string;
    amount: string;
    unit: string;
    myAmount?: string; // 이미 먹고 있는 양
    totalAmount: string;
    status: 'safe' | 'warning' | 'unknown';
    maxAmount?: string | null; // 하루 상한 (모르면 없음)
}

export interface Candidate {
    productId: number | null;
    name: string;
    score: number | null; // 예전 AI 서버는 점수를 주지 않는다
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
    intakeTime: string | null; // 예전 AI 서버가 추천한 복용 시간
    intakeCategory: string | null;
}

/** 리포트로 넘기는 제품 하나 (사용자가 고른 것) */
export interface ReportItem {
    productId: number | null;
    name: string;
    ingredients: Ingredient[];
    intakeTime: string | null;
    intakeCategory: string | null;
}

export interface ScanResult {
    products: Found[];
    timings: Record<string, number>;
    legacy: boolean; // 예전 AI 서버(analyze2)의 결과
    totalMs: number;
}

export class ScanError extends Error {
    constructor(message: string, readonly retryAfter = 0) {
        super(message);
    }
}

interface RawProduct {
    productId?: number | null;
    name?: string | null;
    box?: [number, number, number, number] | null;
    confidence?: number | null;
    ingredients?: Ingredient[] | null;
    candidates?: Candidate[] | null;
    texts?: TextLine[] | null;
    intakeTime?: string | null;
    intakeCategory?: string | null;
}

const isBox = (b: RawProduct['box']): b is [number, number, number, number] => Array.isArray(b) && b.length === 4;

/**
 * 새 AI 서버(analyze3)와 예전 AI 서버(analyze2)의 응답을 같은 모양으로 맞춘다.
 * 예전 서버는 후보·글자 위치·시간을 주지 않으므로 찾은 제품 하나를 후보로 보여 준다.
 */
function normalize(p: RawProduct): Found {
    const old: Candidate[] = p.name ? [{ productId: p.productId ?? null, name: p.name, score: null, ingredients: p.ingredients ?? [] }] : [];
    return {
        name: p.candidates ? p.name ?? null : null, // 예전 결과에는 "유력"을 붙이지 않는다
        box: isBox(p.box) ? p.box : [0, 0, 1, 1],
        confidence: p.confidence ?? 0,
        candidates: (p.candidates ?? old).map((c) => ({ ...c, ingredients: c.ingredients ?? [] })),
        texts: p.texts ?? [],
        intakeTime: p.intakeTime ?? null,
        intakeCategory: p.intakeCategory ?? null,
    };
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
    return {
        products: ((body.data?.reportData?.products ?? []) as RawProduct[]).map(normalize),
        timings: body.data?.timings ?? {},
        legacy: !body.data?.timings,
        totalMs: Math.round(performance.now() - started),
    };
}

export async function register(item: ReportItem, time: string, category: string): Promise<void> {
    const res = await fetch('/api/v1/products/user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            productId: item.productId, nickname: item.name.slice(0, 60), dailyDose: 1, doseAmount: 1, doseUnit: '정',
            intakeTime: time, intakeCategory: category,
        }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new ScanError(body?.error?.code === 'USER_PRODUCT_409' ? `${item.name}: 이미 등록한 영양제예요.` : `${item.name}: 등록하지 못했어요.`);
    }
}
