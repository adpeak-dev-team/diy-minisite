// 색상 파싱·정규화·표시 유틸 (api.ts / lib.ts / widgets.tsx 에 흩어져 있던 것을 한 곳으로 모음)

// 자주 쓰는 CSS 색상 이름 → hex (legacy land 데이터 정규화에 사용)
const CSS_COLOR_HEX: Record<string, string> = {
    white: "#FFFFFF",
    black: "#000000",
    red: "#FF0000",
    green: "#008000",
    blue: "#0000FF",
    yellow: "#FFFF00",
    orange: "#FFA500",
    purple: "#800080",
    pink: "#FFC0CB",
    gray: "#808080",
    grey: "#808080",
    transparent: "#00000000",
};

// 임의의 색상 문자열을 hex 로 정규화. 인식 불가 시 fallback 반환.
// hex(3·6·8자리) / CSS 색상 이름 / rgb()·rgba() 를 처리한다.
export function normalizeColor(input: string, fallback: string): string {
    const v = input.trim();
    if (!v) return fallback;
    if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return v.toUpperCase();
    const named = CSS_COLOR_HEX[v.toLowerCase()];
    if (named) return named;
    const rgb = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgb) {
        const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((n) =>
            Math.max(0, Math.min(255, parseInt(n, 10)))
                .toString(16)
                .padStart(2, "0"),
        );
        return `#${(r + g + b).toUpperCase()}`;
    }
    return fallback;
}

// 색상이 밝은지(어두운 글자가 어울리는지) 휘도로 판정.
// normalizeColor 로 먼저 정규화하므로 3·6·8자리 hex / rgb() / 색상 이름 모두 인식한다.
// 8자리(알파)는 RGB 부분만으로 휘도를 계산한다. 인식 불가 시 false(어두움).
export function isLightColor(color: string): boolean {
    const hex = normalizeColor(color, "");
    const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(hex);
    if (!m) return false;
    let h = m[1];
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    const n = parseInt(h.slice(0, 6), 16);
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

// <input type="color"> 스와치는 #RRGGBB 만 받는다. 유효하지 않으면 검정으로 대체.
export function toSwatchHex(value: string): string {
    return /^#([0-9a-fA-F]{6})$/.test(value) ? value : "#000000";
}
