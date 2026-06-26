import { FONT_OPTIONS, FontKey, MenuItem, SectionType } from "./types";

export function fontFamilyOf(key: FontKey | undefined): string | undefined {
    if (!key) return undefined;
    return FONT_OPTIONS.find((f) => f.key === key)?.family;
}

export function parsePxOr(value: string | undefined, fallback: number): number {
    const n = parseInt(value ?? "", 10);
    return Number.isFinite(n) ? n : fallback;
}

export function clampPct(value: string | undefined, min = 0, max = 100): number {
    const n = parseInt(value ?? "", 10);
    if (!Number.isFinite(n)) return max;
    return Math.min(Math.max(n, min), max);
}

export function menuHref(m: Pick<MenuItem, "link" | "linkType">): string {
    if (m.linkType === "subpage") return `/${m.link.replace(/^\/+/, "")}`;
    if (/^https?:\/\//.test(m.link) || m.link.startsWith("/")) return m.link;
    return `/${m.link}`;
}

export function parseYouTubeId(url: string): string | null {
    if (!url) return null;
    const m = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{6,})/,
    );
    return m ? m[1] : null;
}

export const SECTION_TYPE_ICON: Record<SectionType, string> = {
    hero: "🖼️",
    image: "🏞️",
    gallery: "🗂️",
    text: "📝",
    html: "</>",
    youtube: "▶",
    form: "📋",
};

export const SECTION_TYPE_DESC: Record<SectionType, string> = {
    hero: "배경 이미지 위에 텍스트를 얹은 메인 영역",
    image: "단일 이미지 배너",
    gallery: "여러 이미지를 드래그로 정렬",
    text: "서식 있는 텍스트 본문",
    html: "직접 작성한 HTML 코드 삽입",
    youtube: "유튜브 영상 임베드",
    form: "상담·예약 등 입력 양식",
};
