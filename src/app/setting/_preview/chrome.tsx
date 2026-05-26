"use client";

import { Settings } from "../types";
import { clampPct, fontFamilyOf, isLightColor, menuHref, parsePxOr } from "../lib";

export function PreviewHeader({
    s,
    px,
    pc = false,
}: {
    s: Settings;
    px: number;
    pc?: boolean;
}) {
    const bg = s.header.color || "#0F172A";
    const light = isLightColor(bg);
    const textColor = light ? "#0F172A" : "#FFFFFF";
    const borderColor = light ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.15)";

    const logoPct = clampPct(s.header.logoSize);
    const phonePct = clampPct(s.header.phoneSize);

    const hasLogo = !!s.header.logoImage;
    const hasPhoneImg = !!s.header.phoneImage;
    const hasPhoneSlot = hasPhoneImg;
    const sideX = pc ? 32 : 16;
    const sticky = s.headerStyle === "fix";

    const justifyOf = (a: "left" | "center" | "right") =>
        a === "center"
            ? "justify-center"
            : a === "right"
              ? "justify-end"
              : "justify-start";

    const renderLogoNode = () =>
        hasLogo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
                src={s.header.logoImage!}
                alt="logo"
                style={{ width: `${logoPct}%` }}
                className="h-auto"
            />
        ) : (
            <div className={`font-medium opacity-60 ${pc ? "text-base" : "text-xs"}`}>
                {s.info.siteName || "LOGO"}
            </div>
        );

    const renderPhoneNode = () =>
        s.header.phoneImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
                src={s.header.phoneImage}
                alt="phone"
                style={{ width: `${phonePct}%` }}
                className="h-auto"
            />
        ) : null;

    const showMenus = s.header.menuEnabled && s.header.menus.length > 0;

    return (
        <div
            data-focus-target="header"
            className={sticky ? "sticky top-0 z-10" : ""}
            style={{ background: bg, color: textColor }}
        >
            <div
                className="flex items-center border-b"
                style={{
                    borderBottomColor: borderColor,
                    padding: `${px}px ${sideX}px`,
                }}
            >
                {hasLogo && hasPhoneSlot ? (
                    <>
                        <div className="w-1/2 flex items-center justify-start">
                            {renderLogoNode()}
                        </div>
                        <div className="w-1/2 flex items-center justify-end">
                            {renderPhoneNode()}
                        </div>
                    </>
                ) : hasLogo ? (
                    <div
                        className={`w-full flex items-center ${justifyOf(
                            s.header.logoAlign,
                        )}`}
                    >
                        {renderLogoNode()}
                    </div>
                ) : hasPhoneImg ? (
                    <div
                        className={`w-full flex items-center ${justifyOf(
                            s.header.phoneAlign,
                        )}`}
                    >
                        {renderPhoneNode()}
                    </div>
                ) : (
                    <div className="w-full flex items-center justify-between">
                        {renderLogoNode()}
                        {renderPhoneNode()}
                    </div>
                )}
            </div>
            {showMenus ? (
                <div
                    className={`flex items-center justify-center gap-${pc ? "6" : "4"} border-b ${pc ? "px-8 py-2.5 text-sm" : "px-4 py-2 text-xs"}`}
                    style={{
                        borderBottomColor: borderColor,
                        fontFamily: fontFamilyOf(s.header.menuFont),
                    }}
                >
                    {s.header.menus.map((m) => (
                        <a
                            key={m.id}
                            href={menuHref(m)}
                            className="hover:opacity-80 transition"
                        >
                            {m.name}
                        </a>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export function SubMenuBar({ s, pc = false }: { s: Settings; pc?: boolean }) {
    if (!s.enabled.subMenus || s.subMenus.items.length === 0) return null;
    return (
        <div
            data-focus-target="submenu"
            className={`flex flex-wrap items-center justify-center text-xs ${
                pc ? "gap-x-6 gap-y-2" : "gap-x-3 gap-y-1 text-[11px]"
            }`}
            style={{
                background: s.subMenus.bgColor || "#F1F5F9",
                color: s.subMenus.textColor || "#334155",
                fontFamily: fontFamilyOf(s.subMenus.font),
                padding: `${parsePxOr(s.subMenus.padding, 12)}px ${pc ? 16 : 8}px`,
            }}
        >
            {s.subMenus.items.map((m) => (
                <a
                    key={m.id}
                    href={menuHref(m)}
                    className="hover:underline"
                    style={{ color: "inherit" }}
                >
                    {m.name}
                </a>
            ))}
        </div>
    );
}

export function FooterBlock({
    footer,
    pc = false,
}: {
    footer: Settings["footer"];
    pc?: boolean;
}) {
    const items = [
        footer.company ? `상호: ${footer.company}` : null,
        footer.ceo ? `대표: ${footer.ceo}` : null,
        footer.bizNumber ? `사업자등록번호: ${footer.bizNumber}` : null,
        footer.phone ? `대표번호: ${footer.phone}` : null,
    ].filter(Boolean);
    if (items.length === 0) return null;
    return (
        <div
            data-focus-target="footer"
            className={`${pc ? "px-8 py-8 text-xs" : "px-4 py-5 text-[11px]"} text-slate-500 text-center bg-slate-50`}
            style={{ fontFamily: fontFamilyOf(footer.font) }}
        >
            <div className={pc ? "space-x-3" : "space-x-2"}>
                {items.map((it, i) => (
                    <span key={i} className="inline-block">
                        {it}
                        {i < items.length - 1 ? (
                            <span className="mx-2 opacity-40">|</span>
                        ) : null}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function LocationMap({
    location,
    pc = false,
}: {
    location: Settings["location"];
    pc?: boolean;
}) {
    const src =
        location.embedUrl ||
        (location.address
            ? `https://maps.google.com/maps?q=${encodeURIComponent(location.address)}&output=embed`
            : "");
    if (!src) return null;
    return (
        <div data-focus-target="location" className={pc ? "px-8 py-6" : "p-3"}>
            {location.address ? (
                <div className={`${pc ? "text-sm" : "text-xs"} text-slate-700 mb-2`}>
                    📍 {location.address}
                </div>
            ) : null}
            <div
                className="w-full rounded-lg overflow-hidden border border-slate-200"
                style={{ aspectRatio: pc ? "16 / 9" : "4 / 3" }}
            >
                <iframe
                    src={src}
                    className="w-full h-full"
                    title="location-map"
                    referrerPolicy="no-referrer-when-downgrade"
                    loading="lazy"
                />
            </div>
        </div>
    );
}

export function PreviewEmpty() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-300 text-xs text-center px-6">
            <svg
                className="w-12 h-12 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
            </svg>
            우측에서 섹션을 추가하면
            <br />
            여기 미리보기에 표시됩니다.
        </div>
    );
}
