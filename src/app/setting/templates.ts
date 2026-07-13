import {
    initialSettings,
    MenuItem,
    Section,
    Settings,
    SubPage,
    uid,
} from "./types";
import { heroImg, simpleImg } from "./template-images";

// 편집 시작용 템플릿. build() 는 매번 새 id 로 섹션을 생성해 안전하게 적용 가능.
// 좌측 상단 "템플릿 선택" 에서 고르면 현재 편집 내용을 이 결과로 교체한다.
// 이미지는 분양 테마 임시 이미지(placeholder)로 채워지며, 편집 화면에서 교체한다.
// 템플릿마다 주소 · 메뉴(멀티페이지) · 마케팅 기능을 다르게 섞어 구성했다.
export type Template = {
    id: string;
    name: string;
    build: () => Settings;
};

// ---- 섹션 헬퍼 (분양 홍보 랜딩용 임시 이미지 포함, 편집기에서 교체) ----
// 메인 배너는 이미지만(텍스트 오버레이 없음). 문구는 배너 이미지 안에 들어간다.
const heroSec = (): Section => ({
    id: uid(),
    type: "hero",
    title: "메인 배너",
    image: heroImg(),
    content: "",
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
// 섹션 제목용 텍스트 — 본문과 분리해 '제목답게' 표시. 가운데 정렬 + 포인트 언더바.
// 프리플라이트가 h 태그를 리셋하므로 인라인 스타일로 크기·굵기를 준다. 편집기에서 문구만 바꾸면 된다.
const titleSec = (title: string): Section => ({
    id: uid(),
    type: "text",
    title,
    image: null,
    content:
        `<div style="text-align:center">` +
        `<h2 style="font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin:0">${title}</h2>` +
        `<div style="width:36px;height:3px;background:#2563eb;border-radius:2px;margin:12px auto 0"></div>` +
        `</div>`,
});
const imageSec = (title: string): Section => ({
    id: uid(),
    type: "image",
    title,
    image: simpleImg(title),
    content: "",
});
const gallerySec = (title: string): Section => ({
    id: uid(),
    type: "gallery",
    title,
    image: null,
    images: [
        { id: uid(), image: simpleImg("84A 타입") },
        { id: uid(), image: simpleImg("84B 타입") },
        { id: uid(), image: simpleImg("114 타입") },
    ],
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
            // 버튼이 미리보기에 실제로 뜨도록 예시 URL·번호를 넣는다(편집기에서 교체).
            kakao: {
                enabled: hasKakao,
                url: hasKakao ? "https://pf.kakao.com/_example" : "",
            },
            sms: {
                enabled: hasSms,
                phone: hasSms ? "010-0000-0000" : "",
                content: opts.sms ?? "",
            },
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

// 모든 템플릿의 공통 기준 섹션 (분양 미니사이트 정석 흐름).
//   메인 배너 + 조감도 + [입지안내] + [단지안내] + [추가] + 타입안내 + 예약폼.
// 입지안내·단지안내는 각각 제목(text) → 이미지 → 본문(text) 3섹션으로 구성한다.
// extra 로 단지안내와 타입안내 사이에 섹션을 끼우고, visit 로 폼 종류를 바꾼다.
function basicSections(opts: { extra?: Section[]; visit?: boolean } = {}): Section[] {
    return [
        heroSec(),
        // 조감도: 제목 → 이미지
        titleSec("조감도"),
        imageSec("조감도"),
        // 입지안내: 제목 → 이미지 → 본문
        titleSec("입지안내"),
        imageSec("위치도"),
        textSec(
            "입지 내용",
            "<p>■ 지하철 ○○역 도보 O분 (역세권)<br>■ ○○IC 인접, 광역 교통망<br>■ 대형마트 · 병원 · 공원 도보권</p>",
        ),
        // 단지안내: 제목 → 이미지 → 본문
        titleSec("단지안내"),
        imageSec("단지 배치도"),
        textSec(
            "단지 내용",
            "<p>■ 규모 : 지하 O층 ~ 지상 OO층<br>■ 세대(실) : 총 OOO<br>■ 입주 예정 : 20OO년 O월<br>■ 커뮤니티 · 편의시설 : 피트니스 · 게스트하우스 등</p>",
        ),
        ...(opts.extra ?? []),
        // 타입안내: 제목 → 갤러리
        titleSec("타입안내"),
        gallerySec("타입안내"),
        opts.visit
            ? formSec("visit", "예약폼", "모델하우스 방문예약", "예약하기")
            : formSec("consult", "예약폼", "관심고객 등록", "등록하기"),
    ];
}

// 1) 기본형 — 가장 단순한 원페이지 (히어로 + 개요 + 관심고객 폼)
function basicLanding(): Settings {
    return bunyangShell({
        siteName: "○○ 신규분양",
        company: "○○ 분양문의",
        dbTitle: "분양 상담 접수",
        bottomPhone: "전화 상담",
        bottomConsult: "관심 등록",
        sections: basicSections(),
    });
}

// 1-a) 기본 + 마감 타이머 — 카운트다운으로 긴박함 강조
function basicCountdownLanding(): Settings {
    return bunyangShell({
        siteName: "○○ 신규분양",
        company: "○○ 분양문의",
        dbTitle: "분양 상담 접수",
        bottomPhone: "전화 상담",
        bottomConsult: "관심 등록",
        countdown: { title: "관심고객 등록 마감 임박", applicants: "126" },
        sections: basicSections(),
    });
}

// 1-b) 기본 + 카톡·문자 상담 — 빠른연결 플로팅 버튼
function basicQuickLanding(): Settings {
    return bunyangShell({
        siteName: "○○ 신규분양",
        company: "○○ 분양문의",
        dbTitle: "분양 상담 접수",
        bottomPhone: "전화 상담",
        bottomConsult: "관심 등록",
        kakao: true,
        sms: "[단지명] 분양 문의합니다.",
        sections: basicSections(),
    });
}

// 1-c) 기본 + 위치·지도 — 주소 입력 시 하단에 지도, 입지 섹션 추가
function basicMapLanding(): Settings {
    return bunyangShell({
        siteName: "○○ 신규분양",
        company: "○○ 분양문의",
        dbTitle: "분양 상담 접수",
        bottomPhone: "전화 상담",
        bottomConsult: "관심 등록",
        address: "서울특별시 ○○구 ○○로 ○○",
        // 입지안내는 공통 골격에 이미 포함 → 주소(하단 지도)만 추가로 켠다.
        sections: basicSections(),
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
                    titleSec("분양 개요"),
                    textSec(
                        "분양 개요 내용",
                        "<p>■ 위치 : ○○시 ○○구 ○○동<br>■ 규모 : 지하 O층 ~ 지상 OO층<br>■ 세대(실) : 총 OOO<br>■ 입주 예정 : 20OO년 O월</p>",
                    ),
                    titleSec("특장점"),
                    textSec(
                        "특장점 내용",
                        "<p>■ 프리미엄 설계와 마감<br>■ 편리한 주차와 동선<br>■ 다양한 커뮤니티 · 편의시설</p>",
                    ),
                    titleSec("조감도"),
                    imageSec("조감도"),
                ],
            },
            {
                slug: "floorplan",
                title: "평면안내",
                sections: [
                    titleSec("타입안내"),
                    textSec(
                        "타입 구성",
                        "<p>다양한 면적 · 타입으로 구성되어 있습니다. 아래에서 평면을 확인하세요.</p>",
                    ),
                    gallerySec("타입안내"),
                ],
            },
            {
                slug: "location",
                title: "오시는길",
                sections: [
                    titleSec("입지안내"),
                    textSec(
                        "입지 내용",
                        "<p>■ 지하철 ○○역 도보 O분<br>■ ○○IC 인접<br>■ 학교 · 마트 · 병원 도보권</p>",
                    ),
                ],
            },
        ],
        sections: basicSections({ visit: true }),
    });
}

export const TEMPLATES: Template[] = [
    { id: "basic", name: "기본형 (원페이지)", build: basicLanding },
    { id: "basic-countdown", name: "기본 + 마감 타이머", build: basicCountdownLanding },
    { id: "basic-quick", name: "기본 + 카톡·문자 상담", build: basicQuickLanding },
    { id: "basic-map", name: "기본 + 위치·지도", build: basicMapLanding },
    { id: "multipage", name: "풀옵션 (멀티페이지)", build: multiPageLanding },
];
