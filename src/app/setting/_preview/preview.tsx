"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { findSubPage, FontKey, Section, Settings, SubPage } from "../types";
import { fontFamilyOf, parsePxOr } from "../lib";
import { CountdownBanner, CountdownFloating } from "./countdown";
import {
    FooterBlock,
    LocationMap,
    PreviewEmpty,
    PreviewHeader,
} from "./chrome";
import {
    BottomFixedBar,
    FixedImageFloating,
    PopupOverlay,
    QuickConnectButtons,
} from "./overlays";
import { SectionBlock } from "./sections";

export type PreviewMode = "mobile" | "pc";

// 미리보기의 특정 영역을 클릭했을 때 편집기에 알리는 콜백의 인자.
// "header" | "footer" | "location" | "bottom" | "section:<id>" 등.
export type EditPart = string;

export function Preview({
    s,
    mode,
    currentPageId,
    onNavigate,
    onEditPart,
}: {
    s: Settings;
    mode: PreviewMode;
    currentPageId: string | null;
    onNavigate?: (pageId: string | null) => void;
    onEditPart?: (part: EditPart) => void;
}) {
    const sections = resolveSections(s, currentPageId);
    return mode === "pc" ? (
        <PCPreview
            s={s}
            sections={sections}
            currentPageId={currentPageId}
            onNavigate={onNavigate}
            onEditPart={onEditPart}
        />
    ) : (
        <MobilePreview
            s={s}
            sections={sections}
            currentPageId={currentPageId}
            onNavigate={onNavigate}
            onEditPart={onEditPart}
        />
    );
}

// 미리보기 스크롤 영역의 클릭을 위임받아, data-edit 표식이 있는 가장 가까운
// 조상을 찾아 편집기로 전달한다. 링크/버튼/입력 등 실제 조작 요소 클릭은 무시.
function makeEditClick(onEditPart?: (part: EditPart) => void) {
    if (!onEditPart) return undefined;
    return (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest("a,button,input,textarea,select,label")) return;
        const el = target.closest("[data-edit]");
        const part = el?.getAttribute("data-edit");
        if (part) onEditPart(part);
    };
}

// 현재 페이지의 본문 글씨체 키. 페이지별 override 없으면 사이트 기본 글씨체.
function resolveContentFontKey(
    s: Settings,
    currentPageId: string | null,
): FontKey {
    if (!currentPageId) return s.contentFont || s.font;
    let sub = findSubPage(s.subPages, currentPageId)?.page;
    if (sub?.childrenEnabled && sub.children && sub.children.length > 0) {
        sub = sub.children[0];
    }
    return sub?.font || s.font;
}

function resolveSections(s: Settings, currentPageId: string | null): Section[] {
    if (!currentPageId) return s.sections;
    let sub = findSubPage(s.subPages, currentPageId)?.page;
    // 부모(childrenEnabled=true) 는 컨테이너 — 자체 sections 렌더 안 하고 첫 자식으로.
    if (sub?.childrenEnabled && sub.children && sub.children.length > 0) {
        sub = sub.children[0];
    }
    const subSections = sub?.sections ?? [];
    // 메인 페이지에 fixedBottom === "fixed" 인 폼이 있으면 서브페이지 하단에도 노출.
    // (id 충돌 방지를 위해 새 id 부여)
    const mainFixedForms = s.sections
        .filter(
            (sec) =>
                sec.type === "form" && sec.formData?.fixedBottom === "fixed",
        )
        .map((sec) => ({ ...sec, id: `${sec.id}__from-main` }));
    return [...subSections, ...mainFixedForms];
}

function PCPreview({
    s,
    sections,
    currentPageId,
    onNavigate,
    onEditPart,
}: {
    s: Settings;
    sections: Section[];
    currentPageId: string | null;
    onNavigate?: (pageId: string | null) => void;
    onEditPart?: (part: EditPart) => void;
}) {
    const fontFamily = fontFamilyOf(s.font) ?? "var(--font-pretendard)";
    const headerPx = parsePxOr(s.header.padding, 12);
    // PC 에는 "모바일 하단 고정" 바가 노출되지 않으므로 floating 오프셋은 기본값만.
    const bottomOffset = 16;
    const orderedSections = expandFixedForms(sections);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInteraction = s.enabled.header && s.headerStyle === "interaction";
    const isFix = s.enabled.header && s.headerStyle === "fix";
    const editClick = makeEditClick(onEditPart);

    return (
        <div className="w-full max-w-210 h-160 flex flex-col bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                <div className="flex-1 mx-3 px-3 py-1 bg-white rounded text-[11px] text-slate-400 truncate">
                    {s.domain || "https://example.com"}
                </div>
            </div>
            <div
                className="relative flex-1 flex flex-col bg-white overflow-hidden"
                style={{ fontFamily }}
            >
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto"
                    onClick={editClick}
                >
                    {s.enabled.header ? (
                        <div
                            data-edit="header"
                            className={isFix ? "sticky top-0 z-30" : undefined}
                        >
                            <PreviewHeader
                                s={s}
                                px={headerPx}
                                pc
                                onNavigate={onNavigate}
                            />
                        </div>
                    ) : null}
                    {s.enabled.countdown && s.countdown.position === "top" ? (
                        <CountdownBanner s={s} pc />
                    ) : null}
                    <ChildPagesNav
                        s={s}
                        currentPageId={currentPageId}
                        onNavigate={onNavigate}
                    />
                    <PageBody sections={orderedSections} enabled={s.enabled.sections} pc privacyText={s.privacyPolicy} fontFamily={fontFamilyOf(resolveContentFontKey(s, currentPageId)) ?? undefined} />
                    {s.enabled.location && (s.location.embedUrl || s.location.address) ? (
                        <div data-edit="location">
                            <LocationMap location={s.location} pc />
                        </div>
                    ) : null}
                    <div data-edit="footer">
                        <FooterBlock footer={s.footer} pc />
                    </div>
                    {s.enabled.countdown && s.countdown.position === "bottom" ? (
                        <CountdownBanner s={s} pc />
                    ) : null}
                </div>

                {isInteraction ? (
                    <SlidingHeaderOverlay scrollContainerRef={scrollRef}>
                        <PreviewHeader
                            s={s}
                            px={headerPx}
                            pc
                            onNavigate={onNavigate}
                        />
                        {s.enabled.countdown &&
                        s.countdown.position === "top" &&
                        s.countdown.sticky ? (
                            <CountdownBanner s={s} pc />
                        ) : null}
                    </SlidingHeaderOverlay>
                ) : null}
                {s.enabled.countdown && s.countdown.position === "floating" ? (
                    <CountdownFloating s={s} pc />
                ) : null}
                {s.enabled.quickConnect ? (
                    <QuickConnectButtons s={s} bottomOffset={bottomOffset} />
                ) : null}
                {s.enabled.fixedImage && s.info.fixedImage ? (
                    <FixedImageFloating
                        src={s.info.fixedImage}
                        bottomOffset={
                            bottomOffset +
                            (quickConnectStackHeight(s) > 0
                                ? quickConnectStackHeight(s) + 10
                                : 0)
                        }
                        link={s.info.fixedImageLink}
                        linkType={s.info.fixedImageLinkType}
                    />
                ) : null}
                {s.enabled.popup && s.popupImage ? (
                    <PopupOverlay image={s.popupImage} pc domain={s.domain} />
                ) : null}
            </div>
        </div>
    );
}

function MobilePreview({
    s,
    sections,
    currentPageId,
    onNavigate,
    onEditPart,
}: {
    s: Settings;
    sections: Section[];
    currentPageId: string | null;
    onNavigate?: (pageId: string | null) => void;
    onEditPart?: (part: EditPart) => void;
}) {
    const fontFamily = fontFamilyOf(s.font) ?? "var(--font-pretendard)";
    const headerPx = parsePxOr(s.header.padding, 12);
    const bottomOffset = s.enabled.bottomFixed
        ? parsePxOr(s.bottomFixed.height, 64)
        : 0;
    const orderedSections = expandFixedForms(sections);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInteraction = s.enabled.header && s.headerStyle === "interaction";
    const isFix = s.enabled.header && s.headerStyle === "fix";
    const editClick = makeEditClick(onEditPart);

    return (
        <div className="relative w-[320px] h-[660px] bg-black rounded-[42px] p-2 shadow-2xl">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-2xl z-20" />
            <div
                className="relative w-full h-full rounded-[34px] overflow-hidden bg-white flex flex-col"
                style={{ fontFamily }}
            >
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto"
                    style={{ paddingBottom: bottomOffset }}
                    onClick={editClick}
                >
                    {s.enabled.header ? (
                        <div
                            data-edit="header"
                            className={isFix ? "sticky top-0 z-30" : undefined}
                        >
                            <PreviewHeader
                                s={s}
                                px={headerPx}
                                onNavigate={onNavigate}
                            />
                        </div>
                    ) : null}
                    {s.enabled.countdown && s.countdown.position === "top" ? (
                        <CountdownBanner s={s} />
                    ) : null}
                    <ChildPagesNav
                        s={s}
                        currentPageId={currentPageId}
                        onNavigate={onNavigate}
                    />
                    <PageBody sections={orderedSections} enabled={s.enabled.sections} privacyText={s.privacyPolicy} fontFamily={fontFamilyOf(resolveContentFontKey(s, currentPageId)) ?? undefined} />
                    {s.enabled.location && (s.location.embedUrl || s.location.address) ? (
                        <div data-edit="location">
                            <LocationMap location={s.location} />
                        </div>
                    ) : null}
                    <div data-edit="footer">
                        <FooterBlock footer={s.footer} />
                    </div>
                    {s.enabled.countdown && s.countdown.position === "bottom" ? (
                        <CountdownBanner s={s} />
                    ) : null}
                </div>

                {isInteraction ? (
                    <SlidingHeaderOverlay scrollContainerRef={scrollRef}>
                        <PreviewHeader
                            s={s}
                            px={headerPx}
                            onNavigate={onNavigate}
                        />
                        {s.enabled.countdown &&
                        s.countdown.position === "top" &&
                        s.countdown.sticky ? (
                            <CountdownBanner s={s} />
                        ) : null}
                    </SlidingHeaderOverlay>
                ) : null}
                {s.enabled.bottomFixed ? <BottomFixedBar s={s} /> : null}
                {s.enabled.countdown && s.countdown.position === "floating" ? (
                    <CountdownFloating s={s} />
                ) : null}
                {s.enabled.quickConnect ? (
                    <QuickConnectButtons s={s} bottomOffset={bottomOffset} />
                ) : null}
                {s.enabled.fixedImage && s.info.fixedImage ? (
                    <FixedImageFloating
                        src={s.info.fixedImage}
                        bottomOffset={
                            bottomOffset +
                            (quickConnectStackHeight(s) > 0
                                ? quickConnectStackHeight(s) + 10
                                : 0)
                        }
                        link={s.info.fixedImageLink}
                        linkType={s.info.fixedImageLinkType}
                    />
                ) : null}
                {s.enabled.popup && s.popupImage ? (
                    <PopupOverlay image={s.popupImage} domain={s.domain} />
                ) : null}
            </div>
        </div>
    );
}

function PageBody({
    sections,
    enabled,
    pc,
    privacyText,
    fontFamily,
}: {
    sections: Section[];
    enabled: boolean;
    pc?: boolean;
    privacyText: string;
    // 이 페이지 본문 글씨체 (미지정이면 프레임의 사이트 글씨체 상속).
    fontFamily?: string;
}) {
    if (!enabled) return null;
    if (sections.length === 0) return <PreviewEmpty />;
    return (
        <div style={fontFamily ? { fontFamily } : undefined}>
            {sections.map((sec) => (
                <div key={sec.id} data-edit={`section:${baseSectionId(sec.id)}`}>
                    <SectionBlock sec={sec} pc={pc} privacyText={privacyText} />
                </div>
            ))}
        </div>
    );
}

// expandFixedForms / resolveSections 가 붙이는 접미사(__bottom-dup, __from-main)를
// 제거해 원본 섹션 id 로 되돌린다 (편집 대상 매칭용).
function baseSectionId(id: string): string {
    return id.replace(/__(bottom-dup|from-main)$/, "");
}

// 헤더 "스크롤 상호작용" 모드용 슬라이딩 오버레이.
// 동작:
// - 스크롤 다운 (scrollTop 증가) → 슬라이드 인 (translateY 0)
// - 스크롤 업 (scrollTop 감소) → 슬라이드 아웃 (translateY -100%)
// - 최상단 영역(헤더 높이 이하)에선 원본 in-flow 헤더가 보이므로 숨김
// 작은 스크롤 흔들림은 무시 (±3px 임계값)
function SlidingHeaderOverlay({
    children,
    scrollContainerRef,
}: {
    children: React.ReactNode;
    scrollContainerRef: RefObject<HTMLElement | null>;
}) {
    const [show, setShow] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        let lastTop = el.scrollTop;
        const update = () => {
            const current = el.scrollTop;
            const headerH = ref.current?.offsetHeight ?? 64;
            if (current <= headerH) {
                setShow(false);
                lastTop = current;
                return;
            }
            const delta = current - lastTop;
            if (delta > 3) {
                setShow(true); // 스크롤 다운 → 표시
                lastTop = current;
            } else if (delta < -3) {
                setShow(false); // 스크롤 업 → 숨김
                lastTop = current;
            }
        };
        update();
        el.addEventListener("scroll", update, { passive: true });
        return () => el.removeEventListener("scroll", update);
    }, [scrollContainerRef]);

    return (
        <div
            ref={ref}
            className="absolute top-0 left-0 right-0 z-20 transition-transform duration-300 ease-out"
            style={{ transform: show ? "translateY(0)" : "translateY(-100%)" }}
        >
            {children}
        </div>
    );
}

// 실제 라이브 사이트 — 폰 프레임 없이 화면 전체를 채우는 모바일 프리뷰.
// (app)/page.tsx 와 (app)/[slug]/page.tsx 가 이 컴포넌트를 사용.
// MobilePreview 와 본문 구성은 동일하지만:
// - 폰 프레임 (검은 테두리/노치) 제거
// - viewport 전체를 차지 (h-dvh)
// - onNavigate 미전달 → PreviewHeader 의 메뉴 클릭이 실제 a href 동작 (Next 라우팅)
export function LiveSite({
    s,
    currentPageId,
}: {
    s: Settings;
    currentPageId: string | null;
}) {
    const sections = resolveSections(s, currentPageId);
    const fontFamily = fontFamilyOf(s.font) ?? "var(--font-pretendard)";
    const headerPx = parsePxOr(s.header.padding, 12);
    const bottomOffset = s.enabled.bottomFixed
        ? parsePxOr(s.bottomFixed.height, 64)
        : 0;
    const orderedSections = expandFixedForms(sections);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInteraction =
        s.enabled.header && s.headerStyle === "interaction";
    const isFix = s.enabled.header && s.headerStyle === "fix";

    return (
        <div
            className="relative h-dvh overflow-hidden bg-white flex flex-col"
            style={{ fontFamily }}
        >
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto"
                style={{ paddingBottom: bottomOffset }}
            >
                {s.enabled.header ? (
                    <div className={isFix ? "sticky top-0 z-30" : undefined}>
                        <PreviewHeader s={s} px={headerPx} />
                    </div>
                ) : null}
                {s.enabled.countdown && s.countdown.position === "top" ? (
                    <CountdownBanner s={s} />
                ) : null}
                <ChildPagesNav s={s} currentPageId={currentPageId} />
                <PageBody
                    sections={orderedSections}
                    enabled={s.enabled.sections}
                    privacyText={s.privacyPolicy}
                    fontFamily={
                        fontFamilyOf(resolveContentFontKey(s, currentPageId)) ??
                        undefined
                    }
                />
                {s.enabled.location &&
                (s.location.embedUrl || s.location.address) ? (
                    <LocationMap location={s.location} />
                ) : null}
                <FooterBlock footer={s.footer} />
                {s.enabled.countdown && s.countdown.position === "bottom" ? (
                    <CountdownBanner s={s} />
                ) : null}
            </div>

            {isInteraction ? (
                <SlidingHeaderOverlay scrollContainerRef={scrollRef}>
                    <PreviewHeader s={s} px={headerPx} />
                    {s.enabled.countdown &&
                    s.countdown.position === "top" &&
                    s.countdown.sticky ? (
                        <CountdownBanner s={s} />
                    ) : null}
                </SlidingHeaderOverlay>
            ) : null}
            {s.enabled.bottomFixed ? <BottomFixedBar s={s} /> : null}
            {s.enabled.countdown && s.countdown.position === "floating" ? (
                <CountdownFloating s={s} />
            ) : null}
            {s.enabled.quickConnect ? (
                <QuickConnectButtons s={s} bottomOffset={bottomOffset} />
            ) : null}
            {s.enabled.fixedImage && s.info.fixedImage ? (
                <FixedImageFloating
                    src={s.info.fixedImage}
                    bottomOffset={
                        bottomOffset +
                        (quickConnectStackHeight(s) > 0
                            ? quickConnectStackHeight(s) + 10
                            : 0)
                    }
                    link={s.info.fixedImageLink}
                    linkType={s.info.fixedImageLinkType}
                />
            ) : null}
            {s.enabled.popup && s.popupImage ? (
                <PopupOverlay image={s.popupImage} domain={s.domain} />
            ) : null}
        </div>
    );
}

// QuickConnect 스택의 세로 픽셀 높이 — FixedImage 를 그 위로 올리려고 계산.
// (overlays.tsx 의 버튼 크기 w-15/h-15 = 60px, gap-2.5 = 10px 와 동기화)
function quickConnectStackHeight(s: Settings): number {
    if (!s.enabled.quickConnect) return 0;
    let n = 0;
    if (s.quickConnect.kakao.enabled && s.quickConnect.kakao.url) n++;
    if (s.quickConnect.sms.enabled && s.quickConnect.sms.phone) n++;
    if (n === 0) return 0;
    return n * 60 + (n - 1) * 10;
}

// 부모 서브페이지의 children 을 그리드로 노출해 자식 페이지로 이동시키는 네비.
// 노출 조건:
//   - 현재 페이지가 자식 → 부모의 children 을 렌더 (현재 자식 하이라이트)
//   - 현재 페이지가 자식을 가진 부모 → 자기 children 을 렌더
//   - 그 외 (메인 / 자식 없는 서브페이지) → 렌더 안 함
// 위치: 헤더 (그리고 top countdown) 바로 아래 in-flow. 상단 sticky 헤더가 있어도
// 자연스럽게 스크롤됨. onNavigate 가 있으면 편집기 프리뷰 (버튼) / 없으면 라이브 링크.
function ChildPagesNav({
    s,
    currentPageId,
    onNavigate,
}: {
    s: Settings;
    currentPageId: string | null;
    onNavigate?: (pageId: string | null) => void;
}) {
    // 사이트 전역 토글이 꺼져 있으면 아예 렌더 안 함.
    if (!s.enabled.childNavGrid) return null;
    // 현재 페이지 기준으로 그리드에 노출할 부모 SubPage 를 찾는다.
    let parent: SubPage | null = null;
    let activeChildId: string | null = null;
    if (currentPageId) {
        const found = findSubPage(s.subPages, currentPageId);
        if (found?.parent) {
            parent = found.parent;
            activeChildId = found.page.id;
        } else if (found?.page.children?.length) {
            parent = found.page;
        }
    }
    // 부모의 하부메뉴가 꺼져 있으면(=단순 서브페이지) 그리드 노출 안 함.
    if (!parent || !parent.childrenEnabled || !parent.children?.length)
        return null;

    const children = parent.children;
    const cols = Math.min(children.length, 4);
    const gridColsClass =
        cols <= 1
            ? "grid-cols-1"
            : cols === 2
                ? "grid-cols-2"
                : cols === 3
                    ? "grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-4";

    return (
        <nav
            aria-label={`${parent.title || parent.slug} 하부메뉴`}
            className="w-full bg-white border-b border-slate-200"
        >
            <div className={`grid ${gridColsClass} gap-1 p-2`}>
                {children.map((c) => {
                    const isActive = activeChildId === c.id;
                    const label = c.title || c.slug;
                    const cls = `text-center text-xs sm:text-sm px-2 py-2 rounded-md transition ${
                        isActive
                            ? "bg-slate-900 text-white shadow"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`;
                    if (onNavigate) {
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => onNavigate(c.id)}
                                className={cls}
                            >
                                {label}
                            </button>
                        );
                    }
                    return (
                        <a
                            key={c.id}
                            href={`/${parent!.slug}/${c.slug}`}
                            className={cls}
                        >
                            {label}
                        </a>
                    );
                })}
            </div>
        </nav>
    );
}

// fixedBottom === "fixed" 인 form 섹션의 노출 규칙:
// - 원래 위치 그대로 유지
// - 단, 페이지 마지막에 위치한 경우가 아니면 동일한 폼을 페이지 하단에도 복제해서 노출
//   (i.e. 중간에 있는 fixed 폼은 원래 위치 + 하단, 2번 나옴)
function expandFixedForms(sections: Section[]): Section[] {
    const dups: Section[] = [];
    sections.forEach((sec, i) => {
        const isFixed =
            sec.type === "form" && sec.formData?.fixedBottom === "fixed";
        if (isFixed && i < sections.length - 1) {
            dups.push({ ...sec, id: `${sec.id}__bottom-dup` });
        }
    });
    return [...sections, ...dups];
}
