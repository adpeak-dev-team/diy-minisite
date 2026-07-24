"use client";

import { MouseEvent } from "react";
import { HeaderAlign, MenuItem, Settings, SubPage } from "../types";
import { clampPct, menuHref, parsePxOr } from "../lib";
import { isLightColor } from "../color";

export function PreviewHeader({
    s,
    px,
    pc = false,
    onNavigate,
}: {
    s: Settings;
    px: number;
    pc?: boolean;
    onNavigate?: (pageId: string | null) => void;
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

    const justifyOf = (a: HeaderAlign) =>
        a === "center"
            ? "justify-center"
            : a === "right"
                ? "justify-end"
                : "justify-start";

    // align 이 주어지면 컨테이너 안쪽도 flex + justify 로 만들어, 컨테이너 폭이
    // 100% (즉 outer justify 로 컨테이너를 움직일 여지가 없는 상태) 여도 이미지가
    // 좌/중/우 로 배치되게 함. align 미지정(로고+전화 동시 배치)은 기존 block 흐름.
    const alignStyle = (a?: HeaderAlign) =>
        a
            ? {
                  display: "flex" as const,
                  justifyContent:
                      a === "center"
                          ? "center"
                          : a === "right"
                              ? "flex-end"
                              : "flex-start",
              }
            : {};

    const renderLogoNode = (align?: HeaderAlign) => {
        const clickInner = hasLogo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
                src={s.header.logoImage!}
                alt="logo"
                style={{ maxWidth: "100%", height: "auto", display: "block" }}
            />
        ) : (
            <span className={`font-medium opacity-60 ${pc ? "text-base" : "text-xs"}`}>
                {s.info.siteName || "LOGO"}
            </span>
        );
        // 로고 클릭 동작:
        // - 에디터(onNavigate 있음) → 미리보기 내부에서 메인 페이지(currentPageId=null) 로 전환
        // - 라이브(onNavigate 없음) → 실제 라우팅으로 '/' 이동
        const clickable = onNavigate ? (
            <button
                type="button"
                onClick={() => onNavigate(null)}
                aria-label="메인으로"
                className="cursor-pointer block bg-transparent border-0 p-0"
                style={{ maxWidth: "100%" }}
            >
                {clickInner}
            </button>
        ) : (
            <a
                href="/"
                aria-label="메인으로"
                className="cursor-pointer block"
                style={{ maxWidth: "100%" }}
            >
                {clickInner}
            </a>
        );
        // 로고 이미지가 있을 때만 컨테이너 폭에 %를 준다. 텍스트 대체(LOGO) 상태에선
        // 자연 폭을 유지해야 outer flex 의 justify-* 로 좌/중/우 정렬이 자연스럽다.
        return (
            <div
                style={{
                    width: hasLogo ? `${logoPct}%` : undefined,
                    ...alignStyle(align),
                }}
            >
                {clickable}
            </div>
        );
    };

    const renderPhoneNode = (align?: HeaderAlign) => {
        if (!s.header.phoneImage) return null;
        const img = (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
                src={s.header.phoneImage}
                alt="phone"
                style={{ maxWidth: "100%", height: "auto", display: "block" }}
            />
        );
        // 상단 전용 번호가 있으면 우선, 없으면 공용(하단 대표) 번호로 폴백
        const tel = (s.header.phoneNumber || s.footer.phone).replace(
            /[^0-9+]/g,
            "",
        );
        const clickable = tel ? (
            <a href={`tel:${tel}`} className="block" style={{ maxWidth: "100%" }}>
                {img}
            </a>
        ) : (
            img
        );
        return (
            <div style={{ width: `${phonePct}%`, ...alignStyle(align) }}>
                {clickable}
            </div>
        );
    };

    const showMenus = s.header.menuEnabled && s.header.menus.length > 0;

    // 메뉴 클릭 시 실제 브라우저 이동 대신 미리보기 내부에서 페이지 전환.
    // - linkType === "subpage": 슬러그로 subPage 찾음.
    //   부모(childrenEnabled=true) 면 그 페이지 자체엔 컨텐츠가 없으니 첫 자식으로 이동.
    // - 외부 URL: 기본 동작 유지 (preventDefault 안 함 → 새 탭/이동)
    const resolveMenuTarget = (m: MenuItem): SubPage | null => {
        if (m.linkType !== "subpage") return null;
        const slug = m.link.replace(/^\/+/, "");
        const target = s.subPages.find((p) => p.slug === slug);
        if (!target) return null;
        if (
            target.childrenEnabled &&
            target.children &&
            target.children.length > 0
        ) {
            return target.children[0];
        }
        return target;
    };
    const handleMenuClick = (m: MenuItem) => (e: MouseEvent<HTMLAnchorElement>) => {
        if (!onNavigate || m.linkType !== "subpage") return;
        e.preventDefault();
        const target = resolveMenuTarget(m);
        onNavigate(target?.id ?? null);
    };
    const handleChildClick = (child: SubPage) => (
        e: MouseEvent<HTMLAnchorElement>,
    ) => {
        if (!onNavigate) return;
        e.preventDefault();
        onNavigate(child.id);
    };

    // hover 드롭다운은 사이트 전역 토글(childNavHover) 에 의해서만 활성. 각 메뉴 항목
    // 별로는 해당 슬러그에 매칭되는 부모 subPage 가 childrenEnabled + children 을 가질 때만.
    const hoverOn = s.enabled.childNavHover;
    const menuChildrenOf = (m: MenuItem): SubPage[] | null => {
        if (!hoverOn || m.linkType !== "subpage") return null;
        const slug = m.link.replace(/^\/+/, "");
        const target = s.subPages.find((p) => p.slug === slug);
        if (!target?.childrenEnabled) return null;
        const cs = target.children ?? [];
        return cs.length > 0 ? cs : null;
    };
    // 드롭다운 링크 href: 부모 slug/자식 slug 조합. 프리뷰 모드에선 onNavigate 로 대체됨.
    const childHref = (parentSlug: string, child: SubPage) =>
        `/${parentSlug}/${child.slug}`;

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
                    <div className="w-full flex items-center justify-between gap-2">
                        {renderLogoNode()}
                        {renderPhoneNode()}
                    </div>
                ) : hasLogo ? (
                    // 단독 표시 — outer justify 는 컨테이너 폭 < 100% 일 때, 컨테이너
                    // 내부 flex(align 전달) 는 폭 = 100% 일 때 정렬을 담당. 두 층 모두 같은
                    // 값이라 어느 사이즈에서도 좌/중/우가 일관되게 적용됨.
                    <div
                        className={`w-full flex items-center ${justifyOf(
                            s.header.logoAlign,
                        )}`}
                    >
                        {renderLogoNode(s.header.logoAlign)}
                    </div>
                ) : hasPhoneImg ? (
                    <div
                        className={`w-full flex items-center ${justifyOf(
                            s.header.phoneAlign,
                        )}`}
                    >
                        {renderPhoneNode(s.header.phoneAlign)}
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
                    className={`flex items-center justify-around border-b relative ${pc ? "text-sm" : "text-xs"}`}
                    style={{
                        background: s.subMenus.bgColor || bg,
                        color: s.subMenus.textColor || textColor,
                        borderBottomColor: borderColor,
                        // 폰트 명시 안 함 → 프리뷰 프레임의 s.font 상속
                        padding: `${parsePxOr(s.subMenus.padding, pc ? 10 : 8)}px ${pc ? 32 : 16}px`,
                    }}
                >
                    {s.header.menus.map((m) => {
                        const childrenList = menuChildrenOf(m);
                        const parentSlug = m.link.replace(/^\/+/, "");
                        const hasDropdown =
                            childrenList !== null && childrenList.length > 0;
                        return (
                            <div
                                key={m.id}
                                className={`group relative ${
                                    hasDropdown ? "" : ""
                                }`}
                            >
                                <a
                                    href={menuHref(m)}
                                    onClick={handleMenuClick(m)}
                                    className="hover:opacity-80 transition cursor-pointer inline-flex items-center gap-1"
                                    style={{ color: "inherit" }}
                                >
                                    {m.name}
                                    {hasDropdown ? (
                                        <span className="text-[9px] opacity-60">
                                            ▾
                                        </span>
                                    ) : null}
                                </a>
                                {hasDropdown ? (
                                    <div
                                        // 헤더 메뉴 strip 바로 아래에 절대 위치. 슬라이드 다운:
                                        //   기본 상태 → translateY(-4px) + opacity 0 + max-h 0
                                        //   group-hover → translateY(0)  + opacity 1 + max-h 큰 값
                                        // overflow-hidden + max-h 로 실제로 아래로 펼쳐지는 애니메이션.
                                        className="absolute left-1/2 -translate-x-1/2 top-full min-w-40 z-30 overflow-hidden max-h-0 opacity-0 -translate-y-1 group-hover:max-h-96 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto"
                                    >
                                        <div
                                            className="mt-1 rounded-md shadow-lg border py-1"
                                            style={{
                                                background: light
                                                    ? "#FFFFFF"
                                                    : "#0F172A",
                                                color: textColor,
                                                borderColor,
                                            }}
                                        >
                                            {childrenList!.map((c) => (
                                                <a
                                                    key={c.id}
                                                    href={childHref(parentSlug, c)}
                                                    onClick={handleChildClick(c)}
                                                    className={`block px-3 py-1.5 text-center hover:opacity-80 transition ${pc ? "text-sm" : "text-xs"}`}
                                                    style={{ color: "inherit" }}
                                                >
                                                    {c.title || c.slug}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

export function SubMenuBar({ s, pc = false }: { s: Settings; pc?: boolean }) {
    // 헤더 아래 메뉴 strip: 기본 > 헤더 > 메뉴 사용 토글이 source of truth.
    // 스타일링은 옛 ld_json_menus 출처라 일단 subMenus.* 컨테이너에 보존된 값 사용.
    if (!s.enabled.header || !s.header.menuEnabled) return null;
    const items = s.header.menus;
    if (items.length === 0) return null;
    return (
        <div
            data-focus-target="submenu"
            className={`flex flex-wrap items-center justify-center text-xs ${pc ? "gap-x-6 gap-y-2" : "gap-x-3 gap-y-1 text-[11px]"
                }`}
            style={{
                background: s.subMenus.bgColor || "#F1F5F9",
                color: s.subMenus.textColor || "#334155",
                // 폰트 명시 안 함 → 부모(s.font) 상속
                padding: `${parsePxOr(s.subMenus.padding, 12)}px ${pc ? 16 : 8}px`,
            }}
        >
            {items.map((m) => (
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
    // 글씨체는 지정하지 않음 → 미리보기 프레임의 사이트 글씨체(s.font) 상속.
    const bg = footer.bgColor || "#F8FAFC";
    const fg = footer.textColor || "#64748B";
    return (
        <div
            data-focus-target="footer"
            className={`${pc ? "px-8 py-8 text-xs" : "px-4 py-5 text-[11px]"} text-center`}
            style={{ background: bg, color: fg }}
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
