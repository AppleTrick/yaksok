import { MedicationItem } from '@/features/notification/types';

// Omit 'id', 'isTaken', 'cycle', 'status' as they will be set upon registration
export type MockSupplement = Omit<MedicationItem, 'id' | 'isTaken' | 'cycle' | 'status' | 'imageUrl'>;

export const MOCK_SUPPLEMENTS_DB: MockSupplement[] = [
    {
        name: '고려은단 비타민C 1000',
        category: '비타민',
        efficacy: '항산화, 피로 회복, 면역력 강화',
        ingredients: '비타민C 1000mg',
        cautions: '공복 섭취 시 위장 장애가 발생할 수 있습니다. 식후 섭취 권장.'
    },
    {
        name: '얼라이브 종합비타민',
        category: '비타민',
        efficacy: '에너지 생성, 영양 균형',
        ingredients: '비타민A, B군, C, D, E, 아연, 엽산 등',
        cautions: '소변이 노랗게 나올 수 있습니다.'
    },
    {
        name: '종근당 락토핏 골드',
        category: '유산균',
        efficacy: '장 건강, 배변 활동 원활',
        ingredients: '프로바이오틱스 10억 CFU, 아연',
        cautions: '식전 또는 식후 어느 때나 섭취 가능하나, 일정한 시간에 섭취하세요.'
    },
    {
        name: '세노비스 트리플러스',
        category: '종합영양제',
        efficacy: '기초 영양, 활력 증진',
        ingredients: '비타민 10종, 미네랄 6종, 오메가3 500mg',
        cautions: '임산부는 섭취 전 전문가와 상담하세요.'
    },
    {
        name: '스포츠 리서치 오메가3',
        category: '오메가3',
        efficacy: '혈행 개선, 건조한 눈 개선',
        ingredients: '알래스카 오메가3 1250mg (EPA 687mg, DHA 250mg)',
        cautions: '수술 전후나 항응고제 복용 시 주의하세요.'
    },
    {
        name: '나우푸드 마그네슘',
        category: '미네랄',
        efficacy: '신경/근육 기능 유지, 에너지 이용',
        ingredients: '마그네슘 400mg',
        cautions: '과다 섭취 시 설사를 유발할 수 있습니다.'
    },
    {
        name: '솔가 엽산 400',
        category: '비타민',
        efficacy: '태아 신경관 정상 발달, 혈액 생성',
        ingredients: '엽산 400mcg',
        cautions: '임신 준비 기간 및 임신 초기 섭취 권장.'
    },
    {
        name: 'GC녹십자 밀크씨슬',
        category: '간 건강',
        efficacy: '간 건강 도움, 피로 개선',
        ingredients: '실리마린 130mg, 비타민B군',
        cautions: '알레르기 체질은 성분을 확인 후 섭취하세요.'
    },
    {
        name: '루테인 지아잔틴 164',
        category: '눈 건강',
        efficacy: '노화로 인한 눈 건강 케어',
        ingredients: '루테인 16mg, 지아잔틴 4mg',
        cautions: '과다 섭취 시 피부가 일시적으로 황색으로 변할 수 있습니다.'
    },
    {
        name: '칼슘 마그네슘 비타민D',
        category: '미네랄',
        efficacy: '뼈/치아 형성, 골다공증 발생 위험 감소',
        ingredients: '칼슘 300mg, 마그네슘 150mg, 비타민D 10mcg',
        cautions: '고칼슘혈증이 있거나 의약품 복용 시 전문가와 상담하세요.'
    },
    {
        name: '바이탈뷰티 메타그린',
        category: '다이어트',
        efficacy: '체지방 감소, 혈중 콜레스테롤 개선',
        ingredients: '녹차추출물(카테킨) 300mg',
        cautions: '카페인이 함유되어 있어 초조감, 불면 등을 나타낼 수 있습니다.'
    },
    {
        name: '정관장 홍삼정 에브리타임',
        category: '홍삼',
        efficacy: '면역력 증진, 피로 개선, 기억력 개선',
        ingredients: '홍삼농축액 3g (진세노사이드 Rg1+Rb1+Rg3 11.6mg)',
        cautions: '당뇨 치료제 및 혈액 항응고제 복용 시 섭취에 주의하세요.'
    },
    {
        name: '닥터스베스트 코엔자임 Q10',
        category: '항산화',
        efficacy: '항산화, 높은 혈압 감소 도움',
        ingredients: '코엔자임Q10 100mg, 블랙페퍼 추출물',
        cautions: '섭취 후 위장 장애가 있을 경우 식사와 함께 드세요.'
    },
    {
        name: '자로우 펨 도필러스',
        category: '유산균',
        efficacy: '여성 질 건강, 유산균 증식',
        ingredients: '락토바실러스 람노서스, 락토바실러스 루테리',
        cautions: '개봉 후 냉장 보관을 권장합니다.'
    },
    {
        name: '쏜리서치 투퍼데이',
        category: '종합비타민',
        efficacy: '종합 영양 보충',
        ingredients: '비타민A, C, D, E, K, B군, 미네랄 등 고함량',
        cautions: '하루 2캡슐 식후 섭취.'
    }
];
