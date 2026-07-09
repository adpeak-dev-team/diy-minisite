import { Settings } from "./types";

// 가이드 데모에서 팝업·우측 고정 이미지 등 이미지 기반 기능도 미리보기에 실제로 뜨도록,
// 예시 이미지(data URI SVG)와 카운트다운 마감일을 데모 템플릿에 채워 넣는다.

const svg = (body: string) =>
    "data:image/svg+xml," + encodeURIComponent(body);

const POPUP_IMG = svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='320'>` +
        `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
        `<stop offset='0' stop-color='#3b82f6'/><stop offset='1' stop-color='#1d4ed8'/></linearGradient></defs>` +
        `<rect width='480' height='320' fill='url(#g)'/>` +
        `<text x='240' y='120' font-family='sans-serif' font-size='34' font-weight='bold' fill='#ffffff' text-anchor='middle'>특별 분양 이벤트</text>` +
        `<text x='240' y='168' font-family='sans-serif' font-size='18' fill='#dbeafe' text-anchor='middle'>지금 관심고객으로 등록하세요</text>` +
        `<rect x='160' y='210' width='160' height='54' rx='27' fill='#ffffff'/>` +
        `<text x='240' y='245' font-family='sans-serif' font-size='20' font-weight='bold' fill='#1d4ed8' text-anchor='middle'>신청하기</text>` +
        `</svg>`,
);

const FIXED_IMG = svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>` +
        `<circle cx='70' cy='70' r='67' fill='#ef4444' stroke='#ffffff' stroke-width='4'/>` +
        `<text x='70' y='64' font-family='sans-serif' font-size='22' font-weight='bold' fill='#ffffff' text-anchor='middle'>이벤트</text>` +
        `<text x='70' y='92' font-family='sans-serif' font-size='16' fill='#ffffff' text-anchor='middle'>바로가기</text>` +
        `</svg>`,
);

// 카운트다운 마감일(예시): 3일 뒤. datetime-local("YYYY-MM-DDTHH:mm") 형식.
function demoDeadline(): string {
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 데모 템플릿에 예시 이미지·마감일·연락처를 채워 모든 기능이 미리보기에 보이게 한다.
// (빠른연결 버튼은 카카오 URL·문자 번호가 있어야 렌더된다.)
export function withGuideDemoExtras(base: Settings): Settings {
    return {
        ...base,
        popupImage: POPUP_IMG,
        countdown: { ...base.countdown, deadline: demoDeadline() },
        info: { ...base.info, fixedImage: FIXED_IMG },
        quickConnect: {
            kakao: {
                ...base.quickConnect.kakao,
                enabled: true,
                url: "https://pf.kakao.com/_demo",
            },
            sms: {
                ...base.quickConnect.sms,
                enabled: true,
                phone: "01000000000",
            },
        },
    };
}
