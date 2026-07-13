// 분양 홍보 랜딩용 임시(placeholder) 이미지 — 실제 사진 없이도 '분양 랜딩'처럼 보이도록
// data URI SVG 일러스트로 생성한다. 편집기에서 실제 이미지로 교체.

const svgUri = (body: string) => "data:image/svg+xml," + encodeURIComponent(body);

// 1) 메인 배너 — 다른 섹션과 동일한 심플 텍스트 이미지(배너 비율). 조형물 없음.
export function heroImg(): string {
    return simpleImg("메인 배너", 1280, 760);
}

// 2) 심플 텍스트 이미지 — 조형물 일러스트 대신 깔끔한 그라데이션 배경 + 이미지 아이콘 + 라벨.
// 조감도 · 위치도 · 단지 배치도 · 타입 등 모든 이미지 슬롯의 placeholder 로 공용 사용한다.
// w · h 로 비율을 조절(메인 배너는 넓게).
export function simpleImg(label: string, w = 1040, h = 620): string {
    const W = w,
        H = h;
    const cx = W / 2,
        cy = H / 2;
    const body =
        `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>` +
        `<defs><linearGradient id='sg' x1='0' y1='0' x2='1' y2='1'>` +
        `<stop offset='0' stop-color='#eff6ff'/><stop offset='1' stop-color='#dbeafe'/>` +
        `</linearGradient></defs>` +
        `<rect width='${W}' height='${H}' fill='url(#sg)'/>` +
        // 이미지 아이콘(액자 + 해 + 산)
        `<g transform='translate(${cx}, ${cy - 88})'>` +
        `<rect x='-74' y='-52' width='148' height='104' rx='12' fill='none' stroke='#93c5fd' stroke-width='5'/>` +
        `<circle cx='-32' cy='-18' r='13' fill='#93c5fd'/>` +
        `<path d='M-74,42 L-24,-4 L8,26 L44,-12 L74,42 Z' fill='#bfdbfe'/>` +
        `</g>` +
        `<text x='${cx}' y='${cy + 34}' font-family='sans-serif' font-size='34' font-weight='800' fill='#1e40af' text-anchor='middle'>${label}</text>` +
        `<text x='${cx}' y='${cy + 74}' font-family='sans-serif' font-size='17' fill='#60a5fa' text-anchor='middle'>편집기에서 이미지 교체</text>` +
        `</svg>`;
    return svgUri(body);
}
