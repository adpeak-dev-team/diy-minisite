import { initialSettings, Section, Settings, uid } from "./types";

// 편집 시작용 템플릿. build() 는 매번 새 id 로 섹션을 생성해 안전하게 적용 가능.
// 좌측 상단 "템플릿 선택" 에서 고르면 현재 편집 내용을 이 결과로 교체한다.
export type Template = {
    id: string;
    name: string;
    build: () => Settings;
};

function basicLanding(): Settings {
    const sections: Section[] = [
        {
            id: uid(),
            type: "hero",
            title: "메인 배너",
            image: "https://picsum.photos/seed/minisite-basic-hero/1200/600",
            content:
                "<h2>우리 회사에 오신 것을 환영합니다</h2><p>이곳에 대표 문구를 입력하세요.</p>",
            textPosition: "center",
            animation: "fade-in",
        },
        {
            id: uid(),
            type: "text",
            title: "소개",
            image: null,
            content:
                "<p>회사나 서비스에 대한 소개 문구를 자유롭게 입력하세요.</p>",
        },
        {
            id: uid(),
            type: "image",
            title: "대표 사진",
            image: "https://picsum.photos/seed/minisite-basic-photo/1200/800",
            content: "",
        },
        {
            id: uid(),
            type: "form",
            title: "상담 신청",
            image: null,
            content: "",
            formVariant: "consult",
            formData: {
                subjectType: "text",
                title: "상담 신청",
                submitLabel: "신청하기",
                agreeMode: "use",
            },
        },
    ];

    return {
        ...initialSettings,
        info: { ...initialSettings.info, siteName: "우리 회사" },
        sections,
        footer: { ...initialSettings.footer, company: "우리 회사" },
        enabled: { ...initialSettings.enabled, sections: true },
    };
}

function bunyangLanding(): Settings {
    const sections: Section[] = [
        {
            id: uid(),
            type: "hero",
            title: "메인 배너",
            image: "https://picsum.photos/seed/minisite-bunyang-hero/1200/600",
            content:
                "<h2>[단지명] 신규 분양</h2><p>프리미엄 입지, 마지막 기회 — 지금 관심고객으로 등록하세요.</p>",
            textPosition: "center",
            animation: "fade-in",
        },
        {
            id: uid(),
            type: "text",
            title: "분양 개요",
            image: null,
            content:
                "<h3>분양 개요</h3><p>■ 위치 : ○○시 ○○구 ○○동<br>■ 규모 : 지하 O층 ~ 지상 O층<br>■ 세대수 : 총 OOO세대<br>■ 입주 예정 : 20OO년 O월<br>■ 평형 : OO㎡ ~ OO㎡</p>",
        },
        {
            id: uid(),
            type: "image",
            title: "조감도",
            image: "https://picsum.photos/seed/minisite-bunyang-aerial/1200/800",
            content: "",
        },
        {
            id: uid(),
            type: "gallery",
            title: "평면도 · 내부",
            image: null,
            images: [
                { id: uid(), image: "https://picsum.photos/seed/minisite-bunyang-plan1/800/800" },
                { id: uid(), image: "https://picsum.photos/seed/minisite-bunyang-plan2/800/800" },
                { id: uid(), image: "https://picsum.photos/seed/minisite-bunyang-plan3/800/800" },
            ],
            content: "",
        },
        {
            id: uid(),
            type: "form",
            title: "관심고객 등록",
            image: null,
            content: "",
            formVariant: "consult",
            formData: {
                subjectType: "text",
                title: "방문예약 · 관심고객 등록",
                submitLabel: "등록하기",
                agreeMode: "use",
                fixedBottom: "nonfixed",
            },
        },
    ];

    return {
        ...initialSettings,
        info: {
            ...initialSettings.info,
            siteName: "○○ 신규분양",
            dbTitle: "분양 상담 접수",
        },
        sections,
        countdown: {
            ...initialSettings.countdown,
            title: "계약 마감 임박",
            applicantsCount: "132",
            position: "top",
            sticky: true,
        },
        bottomFixed: {
            ...initialSettings.bottomFixed,
            phone: {
                ...initialSettings.bottomFixed.phone,
                enabled: true,
                mode: "text",
                text: "전화 상담",
            },
            consult: {
                ...initialSettings.bottomFixed.consult,
                enabled: true,
                mode: "text",
                text: "방문 예약",
            },
        },
        quickConnect: {
            kakao: { enabled: true, url: "" },
            sms: {
                enabled: true,
                phone: "",
                content: "[단지명] 분양 문의합니다.",
            },
        },
        location: { address: "", embedUrl: "" },
        footer: {
            ...initialSettings.footer,
            company: "분양문의 / 시행사",
        },
        enabled: {
            ...initialSettings.enabled,
            sections: true,
            countdown: true,
            bottomFixed: true,
            quickConnect: true,
            location: true,
        },
    };
}

export const TEMPLATES: Template[] = [
    { id: "basic-landing", name: "기본 랜딩페이지", build: basicLanding },
    { id: "bunyang", name: "분양 (부동산)", build: bunyangLanding },
];
