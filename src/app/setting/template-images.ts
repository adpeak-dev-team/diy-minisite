// 분양 홍보 랜딩용 임시(placeholder) 이미지 — 실제 사진 없이도 '분양 랜딩'처럼 보이도록
// 미리 만들어둔 SVG 파일을 가리킨다. 편집기에서 실제 이미지로 교체.
//
// 예전에는 data URI(`data:image/svg+xml,...`) 를 그때그때 만들어 넣었는데,
// 저장 시 api.ts 의 stripAssetBase() 가 `data:`/`blob:` 를 빈 값으로 떨궈버려서
// 템플릿을 적용하고 저장하면 이미지가 전부 사라졌다.
// `/placeholders/*.svg` 같은 루트 상대 경로는 stripAssetBase · resolveAsset 이
// 둘 다 그대로 통과시키므로(= DB 에 짧은 경로로 저장되고 그대로 복원) 살아남는다.
//
// 파일 실체는 public/placeholders/ 에 있다. 새 라벨을 쓰려면 그곳에 SVG 를 추가하고
// 아래 LABEL_FILE 에 등록한다 (미등록 라벨은 default.svg 로 폴백).

const BASE = "/placeholders";

// 템플릿이 쓰는 라벨 → 파일명. 라벨 문구가 SVG 안에 그려져 있어 1:1 로 대응한다.
const LABEL_FILE: Record<string, string> = {
    "메인 배너": "hero.svg",
    조감도: "aerial.svg",
    위치도: "location.svg",
    "단지 배치도": "siteplan.svg",
    "84A 타입": "type-84a.svg",
    "84B 타입": "type-84b.svg",
    "114 타입": "type-114.svg",
};

// 1) 메인 배너 — 다른 섹션과 같은 심플 텍스트 이미지이되 배너 비율(1280x760).
export function heroImg(): string {
    return `${BASE}/hero.svg`;
}

// 2) 심플 텍스트 이미지 — 그라데이션 배경 + 이미지 아이콘 + 라벨(1040x620).
// 조감도 · 위치도 · 단지 배치도 · 타입 등 모든 이미지 슬롯의 placeholder 로 공용 사용한다.
export function simpleImg(label: string): string {
    return `${BASE}/${LABEL_FILE[label] ?? "default.svg"}`;
}
