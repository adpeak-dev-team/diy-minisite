"use client";

import { MouseEvent, useEffect, useState } from "react";
import { BottomSlot, Settings } from "../types";
import { fontFamilyOf, parsePxOr } from "../lib";

// 페이지 내 마지막 폼 위치로 부드럽게 스크롤. preview 프레임은 한 번에 하나만 렌더되므로
// document 전역에서 찾아도 충돌 없음.
function scrollToLastForm() {
    if (typeof document === "undefined") return;
    const all = document.querySelectorAll<HTMLElement>("[data-form-section]");
    const last = all[all.length - 1];
    last?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function BottomFixedBar({ s }: { s: Settings }) {
    const slots: BottomSlot[] = [s.bottomFixed.phone, s.bottomFixed.consult].filter(
        (slot) => slot.enabled,
    );
    if (slots.length === 0) return null;
    const height = `${parsePxOr(s.bottomFixed.height, 64)}px`;

    const handleSlotClick = (slot: BottomSlot) =>
        (e: MouseEvent<HTMLAnchorElement>) => {
            if (slot.linkType === "form") {
                e.preventDefault();
                scrollToLastForm();
            }
        };

    return (
        <div
            data-focus-target="bottom"
            data-guide="pv-bottom"
            className="absolute inset-x-0 bottom-0 z-20 flex border-t border-slate-200"
            style={{ height, fontFamily: fontFamilyOf(s.bottomFixed.font) }}
        >
            {slots.map((slot, i) => (
                <a
                    key={i}
                    href={slot.linkType === "form" ? "#" : slot.link || undefined}
                    onClick={handleSlotClick(slot)}
                    className="flex-1 flex items-center justify-center"
                    style={{
                        background: slot.bgColor || "#0F172A",
                        color: slot.textColor || "#FFFFFF",
                    }}
                >
                    {slot.mode === "image" && slot.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={slot.image}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-sm font-medium">{slot.text}</span>
                    )}
                </a>
            ))}
        </div>
    );
}

export function QuickConnectButtons({
    s,
    bottomOffset,
}: {
    s: Settings;
    bottomOffset: number;
}) {
    type Item = {
        label: string;
        bg: string;
        fg: string;
        href: string;
        icon: React.ReactNode;
    };
    const items: Item[] = [];
    if (s.quickConnect.kakao.enabled && s.quickConnect.kakao.url) {
        items.push({
            label: "카카오톡",
            bg: "#FEE500",
            fg: "#000",
            href: s.quickConnect.kakao.url,
            icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.85 5.32 4.65 6.78l-1.2 4.4c-.08.3.23.55.5.39l5.21-3.46c.28.03.55.04.84.04 5.52 0 10-3.58 10-8.15S17.52 3 12 3z" />
                </svg>
            ),
        });
    }
    if (s.quickConnect.sms.enabled && s.quickConnect.sms.phone) {
        items.push({
            label: "문자",
            bg: "#2563EB",
            fg: "#fff",
            href: `sms:${s.quickConnect.sms.phone}`,
            icon: (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                </svg>
            ),
        });
    }
    if (items.length === 0) return null;

    return (
        <div
            data-guide="pv-quick"
            className="absolute right-3 z-20 flex flex-col gap-2.5"
            style={{ bottom: `${bottomOffset + 16}px` }}
        >
            {items.map((it) => (
                <a
                    key={it.label}
                    href={it.href}
                    target="_blank"
                    rel="noopener"
                    aria-label={it.label}
                    className="w-15 h-15 rounded-full shadow-lg ring-1 ring-black/5 flex items-center justify-center hover:scale-105 active:scale-95 transition"
                    style={{ background: it.bg, color: it.fg }}
                >
                    {it.icon}
                </a>
            ))}
        </div>
    );
}

export function FixedImageFloating({
    src,
    bottomOffset,
}: {
    src: string;
    bottomOffset: number;
    link?: string;
    linkType?: "url" | "form";
}) {
    // 미리보기 전용 — 클릭하면 실제 이동 대신 편집기의 '우측 고정 이미지'로 포커스된다
    // (data-edit 위임 클릭). button 이면 위임에서 무시되므로 div 로 렌더.
    return (
        <div
            data-edit="fiximage"
            data-guide="pv-fiximage"
            aria-label="우측 고정 이미지"
            className="absolute right-3 z-20 w-15 h-15 rounded-full overflow-hidden shadow-lg ring-1 ring-black/5 bg-white cursor-pointer hover:scale-105 active:scale-95 transition"
            style={{ bottom: `${bottomOffset + 16}px` }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover" />
        </div>
    );
}

// "오늘 하루 보지 않기" 쿠키 키 — 도메인별로 분리해서 사이트끼리 간섭 안 되게.
function popupHideKey(domain: string) {
    return `popup-hidden:${domain}`;
}

function todayStr(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isPopupHiddenToday(domain: string): boolean {
    if (typeof window === "undefined") return false;
    try {
        return window.localStorage.getItem(popupHideKey(domain)) === todayStr();
    } catch {
        return false;
    }
}

function hidePopupForToday(domain: string) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(popupHideKey(domain), todayStr());
    } catch {
        // ignore
    }
}

export function PopupOverlay({
    image,
    pc = false,
    domain = "",
}: {
    image: string;
    pc?: boolean;
    domain?: string;
}) {
    const [open, setOpen] = useState(true);
    const [dontShow, setDontShow] = useState(false);

    // 마운트 시 오늘 날짜 쿠키 확인 → 이미 닫았으면 안 띄움.
    // SSR 안전 위해 useEffect 안에서 localStorage 접근 (window 존재 시점).
    useEffect(() => {
        if (domain && isPopupHiddenToday(domain)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOpen(false);
        }
    }, [domain]);

    const close = () => {
        if (dontShow && domain) hidePopupForToday(domain);
        setOpen(false);
    };

    if (!open) return null;

    // 배경 어둡힘 / 스크롤 잠금 없이 단순 fixed-스타일 카드로만 노출.
    return (
        <div
            data-edit="popup"
            data-guide="pv-popup"
            className={`absolute left-1/2 -translate-x-1/2 z-30 ${
                pc ? "top-12 max-w-md w-[70%]" : "top-8 max-w-xs w-[80%]"
            }`}
        >
            <div className="relative bg-white rounded-lg overflow-hidden shadow-xl border border-slate-200">
                <button
                    type="button"
                    onClick={close}
                    aria-label="닫기"
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-red-600 transition z-10"
                >
                    ×
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={image}
                    alt="popup"
                    className={`w-full ${pc ? "max-h-96" : "max-h-80"} object-contain`}
                />
                <label
                    className={`flex items-center gap-1.5 px-3 py-2 ${
                        pc ? "text-xs" : "text-[10px]"
                    } text-slate-600 border-t border-slate-100 cursor-pointer select-none`}
                >
                    <input
                        type="checkbox"
                        checked={dontShow}
                        onChange={(e) => setDontShow(e.target.checked)}
                        className="w-3.5 h-3.5 accent-blue-600"
                    />
                    오늘 하루 보지 않기
                </label>
            </div>
        </div>
    );
}
