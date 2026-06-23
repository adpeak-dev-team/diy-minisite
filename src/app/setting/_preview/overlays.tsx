"use client";

import { Settings } from "../types";
import { fontFamilyOf, parsePxOr } from "../lib";

export function BottomFixedBar({ s }: { s: Settings }) {
    const slots = [s.bottomFixed.phone, s.bottomFixed.consult].filter(
        (slot) => slot.enabled,
    );
    if (slots.length === 0) return null;
    const height = `${parsePxOr(s.bottomFixed.height, 64)}px`;
    return (
        <div
            data-focus-target="bottom"
            className="absolute inset-x-0 bottom-0 z-20 flex border-t border-slate-200"
            style={{ height, fontFamily: fontFamilyOf(s.bottomFixed.font) }}
        >
            {slots.map((slot, i) => (
                <a
                    key={i}
                    href={slot.link || undefined}
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
            label: "카톡",
            bg: "#FEE500",
            fg: "#000",
            href: s.quickConnect.kakao.url,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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
                    width="18"
                    height="18"
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
            className="absolute right-3 z-20 flex flex-col gap-2"
            style={{ bottom: `${bottomOffset + 16}px` }}
        >
            {items.map((it) => (
                <a
                    key={it.label}
                    href={it.href}
                    target="_blank"
                    rel="noopener"
                    className="w-12 h-12 rounded-full shadow-lg flex flex-col items-center justify-center text-[9px] font-bold"
                    style={{ background: it.bg, color: it.fg }}
                >
                    {it.icon}
                    <span className="leading-none mt-0.5">{it.label}</span>
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
}) {
    return (
        <div
            className="absolute right-3 z-20 cursor-pointer"
            style={{ bottom: `${bottomOffset + 16}px` }}
        >
            <div className="w-20 rounded-full overflow-hidden shadow-lg animate-pulse">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
        </div>
    );
}

export function PopupOverlay({
    image,
    pc = false,
}: {
    image: string;
    pc?: boolean;
}) {
    return (
        <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center z-30 ${
                pc ? "p-10" : "p-6"
            }`}
        >
            <div className="relative bg-white rounded-lg overflow-hidden max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={image}
                    alt="popup"
                    className={`w-full ${pc ? "max-h-96" : "max-h-80"} object-contain`}
                />
                <div
                    className={`px-3 py-2 ${pc ? "text-xs" : "text-[10px]"} text-slate-500 text-right border-t border-slate-100`}
                >
                    오늘 하루 보지 않기
                </div>
            </div>
        </div>
    );
}
