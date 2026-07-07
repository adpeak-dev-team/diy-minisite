"use client";

import { useEffect, useState } from "react";
import { Settings } from "../types";
import { fontFamilyOf, parsePxOr } from "../lib";

export function CountdownBanner({ s, pc = false }: { s: Settings; pc?: boolean }) {
    const left = useTimeLeft(s.countdown.deadline);
    const count = parsePxOr(s.countdown.applicantsCount, 0);
    const padCls = pc ? "px-8 py-4" : "px-3 py-2.5";
    const bg = s.countdown.bgColor || "#2563EB";

    const [headerH, setHeaderH] = useState(0);
    useEffect(() => {
        if (s.countdown.position !== "top" || !s.countdown.sticky) return;
        const headerEl = document.querySelector(
            '[data-focus-target="header"]',
        );
        if (!headerEl) return;
        const measure = () => {
            setHeaderH((headerEl as HTMLElement).offsetHeight);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(headerEl);
        return () => ro.disconnect();
    }, [s.countdown.position, s.countdown.sticky]);

    const bottomOffset = s.enabled.bottomFixed
        ? parsePxOr(s.bottomFixed.height, 64)
        : 0;

    // "스크롤 시 고정" 처리 — top 위치일 땐 헤더 스타일에 종속:
    // - fix: 헤더 바로 아래 sticky (기존 동작)
    // - nonfix: 헤더가 in-flow 라 따로 sticky 안 함 (헤더와 같이 스크롤 아웃)
    // - interaction: 슬라이딩 헤더 오버레이 안에 함께 렌더되므로 여기선 sticky 안 함
    const stickyStyle: React.CSSProperties = !s.countdown.sticky
        ? {}
        : s.countdown.position === "bottom"
          ? {
                position: "sticky",
                bottom: `${bottomOffset}px`,
                zIndex: 5,
            }
          : s.headerStyle === "fix"
            ? {
                  position: "sticky",
                  top: `${headerH}px`,
                  zIndex: 5,
              }
            : {};

    const fontFamily = fontFamilyOf(s.countdown.font);
    const fg = s.countdown.textColor || "#FFFFFF";

    return (
        <div
            data-edit="countdown"
            data-focus-target="countdown"
            className={padCls}
            style={{
                background: bg,
                color: fg,
                fontFamily,
                ...stickyStyle,
            }}
        >
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`${pc ? "text-sm" : "text-[11px]"} opacity-90 truncate`}>
                        {s.countdown.title || "마감까지"}
                    </span>
                    <span className={`${pc ? "text-lg" : "text-sm"} font-bold tracking-tight tabular-nums`}>
                        {left}
                    </span>
                </div>
                <div className={`${pc ? "text-xs" : "text-[10px]"} bg-white/15 rounded-full px-2.5 py-1 whitespace-nowrap`}>
                    현재 <span className="font-bold">{count}</span>명 신청 중
                </div>
            </div>
        </div>
    );
}

export function CountdownFloating({ s, pc = false }: { s: Settings; pc?: boolean }) {
    const left = useTimeLeft(s.countdown.deadline);
    const count = parsePxOr(s.countdown.applicantsCount, 0);
    const bg = s.countdown.bgColor || "#2563EB";
    const fg = s.countdown.textColor || "#FFFFFF";
    const fontFamily = fontFamilyOf(s.countdown.font);
    const size = pc ? 112 : 84;
    const bottomOffset = (s.enabled.bottomFixed ? parsePxOr(s.bottomFixed.height, 64) : 0) + 16;

    return (
        <div
            data-focus-target="countdown"
            className="absolute left-3 z-20 rounded-full shadow-lg flex flex-col items-center justify-center text-center"
            style={{
                background: bg,
                color: fg,
                fontFamily,
                width: `${size}px`,
                height: `${size}px`,
                bottom: `${bottomOffset}px`,
            }}
        >
            <span className={pc ? "text-[10px] opacity-90 leading-none mb-1" : "text-[8px] opacity-90 leading-none mb-0.5"}>
                {s.countdown.title || "마감까지"}
            </span>
            <span className={`${pc ? "text-sm" : "text-[11px]"} font-bold tabular-nums leading-tight`}>
                {left.split(" ")[0]}
            </span>
            <span className={`${pc ? "text-[11px]" : "text-[9px]"} font-bold tabular-nums leading-tight`}>
                {left.split(" ")[1]}
            </span>
            <span className={`${pc ? "text-[9px]" : "text-[8px]"} opacity-90 leading-none mt-1`}>
                {count}명 신청
            </span>
        </div>
    );
}

function useTimeLeft(deadline: string): string {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    if (!deadline) return "00일 00:00:00";
    const target = new Date(deadline).getTime();
    if (Number.isNaN(target)) return "00일 00:00:00";
    const diff = Math.max(0, target - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${String(d).padStart(2, "0")}일 ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
