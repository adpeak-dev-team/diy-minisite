import {
    initialSettings,
    MenuItem,
    Section,
    Settings,
    SubPage,
    uid,
} from "./types";

// 편집 시작용 템플릿. build() 는 매번 새 id 로 섹션을 생성해 안전하게 적용 가능.
// 좌측 상단 "템플릿 선택" 에서 고르면 현재 편집 내용을 이 결과로 교체한다.
// 이미지는 모두 비어 있는 상태(placeholder)로, 편집 화면에서 직접 업로드해 채운다.
// 템플릿마다 주소 · 메뉴(멀티페이지) · 마케팅 기능을 다르게 섞어 구성했다.
export type Template = {
    id: string;
    name: string;
    build: () => Settings;
};

// ---- 섹션 헬퍼 (모두 이미지 비움) ----
const heroSec = (content: string): Section => ({
    id: uid(),
    type: "hero",
    title: "메인 배너",
    image: null,
    content,
    textPosition: "center",
    animation: "fade-in",
});
const textSec = (title: string, content: string): Section => ({
    id: uid(),
    type: "text",
    title,
    image: null,
    content,
});
const imageSec = (title: string): Section => ({
    id: uid(),
    type: "image",
    title,
    image: null,
    content: "",
});
const gallerySec = (title: string): Section => ({
    id: uid(),
    type: "gallery",
    title,
    image: null,
    images: [],
    content: "",
});
const formSec = (
    variant: "consult" | "visit",
    sectionTitle: string,
    formTitle: string,
    submitLabel: string,
): Section => ({
    id: uid(),
    type: "form",
    title: sectionTitle,
    image: null,
    content: "",
    formVariant: variant,
    formData: {
        subjectType: "text",
        title: formTitle,
        submitLabel,
        agreeMode: "use",
        fixedBottom: "nonfixed",
    },
});

// ---- 분양 랜딩 공통 골격 ----
// 옵션으로 넘긴 기능만 켜서 템플릿마다 서로 다른 구성을 만든다.
type MenuPage = { slug: string; title: string; sections: Section[] };

function bunyangShell(opts: {
    siteName: string;
    company: string;
    dbTitle: string;
    sections: Section[];
    address?: string; // 있으면 위치 · 지도 on
    menus?: MenuPage[]; // 있으면 상단 메뉴 + 서브페이지(멀티페이지)
    // 카운트다운. 위치는 기본적으로 상단 고정(top + sticky).
    countdown?: {
        title: string;
        applicants: string;
        position?: "top" | "bottom" | "floating";
        sticky?: boolean;
    };
    bottomPhone?: string; // 있으면 하단 고정 전화 슬롯
    bottomConsult?: string; // 있으면 하단 고정 상담 슬롯
    kakao?: boolean; // 빠른연결 카카오톡
    sms?: string; // 있으면 빠른연결 문자 (기본 문구)
}): Settings {
    const menus = opts.menus ?? [];
    const hasMenu = menus.length > 0;
    const subPages: SubPage[] = menus.map((m) => ({
        id: uid(),
        slug: m.slug,
        title: m.title,
        sections: m.sections,
    }));
    const headerMenus: MenuItem[] = menus.map((m) => ({
        id: uid(),
        name: m.title,
        link: m.slug,
        linkType: "subpage",
    }));

    const hasCountdown = !!opts.countdown;
    const hasBottom = !!(opts.bottomPhone || opts.bottomConsult);
    const hasKakao = !!opts.kakao;
    const hasSms = !!opts.sms;
    const hasLocation = !!opts.address;

    return {
        ...initialSettings,
        info: {
            ...initialSettings.info,
            siteName: opts.siteName,
            dbTitle: opts.dbTitle,
        },
        header: {
            ...initialSettings.header,
            menuEnabled: hasMenu,
            menus: headerMenus,
        },
        subPages,
        sections: opts.sections,
        countdown: hasCountdown
            ? {
                  ...initialSettings.countdown,
                  title: opts.countdown!.title,
                  applicantsCount: opts.countdown!.applicants,
                  position: opts.countdown!.position ?? "top",
                  sticky: opts.countdown!.sticky ?? true,
              }
            : initialSettings.countdown,
        bottomFixed: {
            ...initialSettings.bottomFixed,
            phone: opts.bottomPhone
                ? {
                      ...initialSettings.bottomFixed.phone,
                      enabled: true,
                      mode: "text",
                      text: opts.bottomPhone,
                  }
                : initialSettings.bottomFixed.phone,
            consult: opts.bottomConsult
                ? {
                      ...initialSettings.bottomFixed.consult,
                      enabled: true,
                      mode: "text",
                      text: opts.bottomConsult,
                  }
                : initialSettings.bottomFixed.consult,
        },
        quickConnect: {
            kakao: { enabled: hasKakao, url: "" },
            sms: { enabled: hasSms, phone: "", content: opts.sms ?? "" },
        },
        location: hasLocation
            ? { address: opts.address!, embedUrl: "" }
            : initialSettings.location,
        footer: { ...initialSettings.footer, company: opts.company },
        enabled: {
            ...initialSettings.enabled,
            sections: true,
            header: true,
            countdown: hasCountdown,
            bottomFixed: hasBottom,
            quickConnect: hasKakao || hasSms,
            location: hasLocation,
        },
    };
}

// 1) 기본형 — 가장 단순한 원페이지 (히어로 + 개요 + 관심고객 폼)
function basicLanding(): Settings {
    return bunyangShell({
        siteName: "○○ 신규분양",
        company: "○○ 분양문의",
        dbTitle: "분양 상담 접수",
        bottomPhone: "전화 상담",
        bottomConsult: "관심 등록",
        sections: [
            heroSec(
                "<h2>[단지명] 신규 분양</h2><p>프리미엄 입지, 지금 관심고객으로 등록하세요.</p>",
            ),
            textSec(
                "분양 개요",
                "<h3>분양 개요</h3><p>■ 위치 : ○○시 ○○구 ○○동<br>■ 규모 : 지하 O층 ~ 지상 OO층<br>■ 세대(실) : 총 OOO<br>■ 입주 예정 : 20OO년 O월</p>",
            ),
            imageSec("조감도"),
            formSec("consult", "관심고객 등록", "관심고객 등록", "등록하기"),
        ],
    });
}

// 2) 풀옵션 멀티페이지 — 상단 메뉴 + 서브페이지 + 주소 + 모든 마케팅 기능
function multiPageLanding(): Settings {
    return bunyangShell({
        siteName: "○○ 신규분양",
        company: "○○ 분양문의 / 시행사",
        dbTitle: "분양 상담 접수",
        address: "경기도 ○○시 ○○구 ○○대로 ○○ (○○ 모델하우스)",
        countdown: { title: "계약 마감 임박", applicants: "248" },
        bottomPhone: "전화 상담",
        bottomConsult: "방문 예약",
        kakao: true,
        sms: "[단지명] 분양 문의합니다.",
        menus: [
            {
                slug: "info",
                title: "분양안내",
                sections: [
                    textSec(
                        "분양 개요",
                        "<h3>[단지명]</h3><p>■ 위치 : ○○시 ○○구 ○○동<br>■ 규모 : 지하 O층 ~ 지상 OO층<br>■ 세대(실) : 총 OOO<br>■ 입주 예정 : 20OO년 O월</p>",
                    ),
                    textSec(
                        "특장점",
                        "<p>■ 프리미엄 설계와 마감<br>■ 편리한 주차와 동선<br>■ 다양한 커뮤니티 · 편의시설</p>",
                    ),
                    imageSec("조감도"),
                ],
            },
            {
                slug: "floorplan",
                title: "평면안내",
                sections: [
                    textSec(
                        "타입 구성",
                        "<p>다양한 면적 · 타입으로 구성되어 있습니다. 아래에서 평면을 확인하세요.</p>",
                    ),
                    gallerySec("평면도 · 내부"),
                ],
            },
            {
                slug: "location",
                title: "오시는길",
                sections: [
                    textSec(
                        "입지 환경",
                        "<h3>사통팔달 교통 · 생활 인프라</h3><p>■ 지하철 ○○역 도보 O분<br>■ ○○IC 인접<br>■ 학교 · 마트 · 병원 도보권</p>",
                    ),
                ],
            },
        ],
        sections: [
            heroSec(
                "<h2>[단지명] 프리미엄 신규 분양</h2><p>완벽한 입지, 마지막 기회 — 지금 관심고객으로 등록하세요.</p>",
            ),
            textSec(
                "분양 개요",
                "<h3>분양 개요</h3><p>■ 위치 : ○○시 ○○구 ○○동<br>■ 세대(실) : 총 OOO<br>■ 입주 예정 : 20OO년 O월<br>자세한 내용은 상단 메뉴에서 확인하세요.</p>",
            ),
            formSec(
                "visit",
                "방문 예약 · 관심고객 등록",
                "모델하우스 방문예약",
                "예약하기",
            ),
        ],
    });
}

// 3) 원페이지 세일즈 — 긴 스크롤 단일 페이지 · 마케팅 강조 (카운트다운 상단 고정)
function salesLanding(): Settings {
    return bunyangShell({
        siteName: "○○ 신규분양",
        company: "○○ 분양사무소",
        dbTitle: "분양 상담 접수",
        countdown: { title: "선착순 계약 마감 임박", applicants: "173" },
        bottomPhone: "전화 상담",
        bottomConsult: "관심 등록",
        kakao: true,
        sms: "[단지명] 분양 문의합니다.",
        sections: [
            heroSec(
                "<h2>[단지명] 지금이 마지막 기회</h2><p>프리미엄 입지, 선착순 분양 — 놓치지 마세요.</p>",
            ),
            textSec(
                "분양 개요",
                "<h3>분양 개요</h3><p>■ 위치 : ○○시 ○○구 ○○동<br>■ 규모 : 지하 O층 ~ 지상 OO층<br>■ 세대(실) : 총 OOO<br>■ 입주 예정 : 20OO년 O월</p>",
            ),
            textSec(
                "입지 환경",
                "<h3>사통팔달 교통 · 생활 인프라</h3><p>■ 지하철 ○○역 도보 O분<br>■ ○○IC 인접<br>■ 학교 · 마트 · 병원 도보권</p>",
            ),
            textSec(
                "특장점",
                "<h3>차별화된 프리미엄</h3><p>■ 프리미엄 설계와 마감<br>■ 편리한 주차와 동선<br>■ 다양한 커뮤니티 · 편의시설</p>",
            ),
            imageSec("조감도"),
            gallerySec("평면도 · 내부"),
            formSec(
                "consult",
                "관심고객 등록",
                "관심고객 등록 · 상담 신청",
                "등록하기",
            ),
        ],
    });
}

// 4) 방문예약형 — 모델하우스 방문 중심 · 주소/지도 + 방문예약 폼 (카카오 없음)
function visitLanding(): Settings {
    return bunyangShell({
        siteName: "○○ 신규분양",
        company: "○○ 분양문의",
        dbTitle: "방문 예약 접수",
        address: "경기도 ○○시 ○○구 ○○대로 ○○ (○○ 모델하우스)",
        countdown: { title: "방문 예약 마감 임박", applicants: "88" },
        bottomConsult: "방문 예약",
        sms: "[단지명] 모델하우스 방문 예약합니다.",
        sections: [
            heroSec(
                "<h2>[단지명] 모델하우스 오픈</h2><p>지금 방문 예약하고 특별한 혜택을 받으세요.</p>",
            ),
            textSec(
                "분양 개요",
                "<h3>분양 개요</h3><p>■ 위치 : ○○시 ○○구 ○○동<br>■ 규모 : 지하 O층 ~ 지상 OO층<br>■ 세대(실) : 총 OOO<br>■ 입주 예정 : 20OO년 O월</p>",
            ),
            imageSec("조감도"),
            textSec(
                "방문 안내",
                "<h3>모델하우스 방문 안내</h3><p>■ 운영 시간 : 10:00 ~ 18:00<br>■ 사전 예약 시 대기 없이 상담 가능<br>■ 방문 고객 특별 혜택 제공</p>",
            ),
            formSec(
                "visit",
                "방문 예약",
                "모델하우스 방문예약",
                "예약하기",
            ),
        ],
    });
}

// 5) 입지·지도 중심 — 위치를 강조하는 간결한 구성 (주소/지도 강조, 카운트다운 없음)
function locationLanding(): Settings {
    return bunyangShell({
        siteName: "○○ 신규분양",
        company: "○○ 분양문의",
        dbTitle: "분양 상담 접수",
        address: "서울특별시 ○○구 ○○로 ○○",
        bottomPhone: "전화 상담",
        kakao: true,
        sections: [
            heroSec(
                "<h2>[단지명] 프리미엄 입지</h2><p>누구나 탐내는 바로 그 자리, 지금 관심고객으로 등록하세요.</p>",
            ),
            textSec(
                "입지 환경",
                "<h3>왜 이 위치인가</h3><p>■ 지하철 ○○역 도보 O분 (역세권)<br>■ ○○IC 인접, 광역 교통망<br>■ 대형마트 · 병원 · 공원 도보권</p>",
            ),
            textSec(
                "생활 인프라",
                "<p>■ ○○초 · ○○중 · ○○고 학군<br>■ 백화점 · 영화관 · 대형병원 인접<br>■ 공원 · 하천 등 쾌적한 자연환경</p>",
            ),
            textSec(
                "분양 개요",
                "<h3>분양 개요</h3><p>■ 위치 : ○○시 ○○구 ○○동<br>■ 세대(실) : 총 OOO<br>■ 입주 예정 : 20OO년 O월</p>",
            ),
            formSec("consult", "관심고객 등록", "관심고객 등록", "등록하기"),
        ],
    });
}

export const TEMPLATES: Template[] = [
    { id: "basic", name: "기본형 (원페이지)", build: basicLanding },
    { id: "multipage", name: "풀옵션 (멀티페이지)", build: multiPageLanding },
    { id: "sales", name: "원페이지 세일즈", build: salesLanding },
    { id: "visit", name: "방문예약형", build: visitLanding },
    { id: "location", name: "입지·지도 중심", build: locationLanding },
];
