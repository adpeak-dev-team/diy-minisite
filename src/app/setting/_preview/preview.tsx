"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { Section, Settings } from "../types";
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

export function Preview({
    s,
    mode,
    currentPageId,
    onNavigate,
}: {
    s: Settings;
    mode: PreviewMode;
    currentPageId: string | null;
    onNavigate?: (pageId: string | null) => void;
}) {
    const sections = resolveSections(s, currentPageId);
    return mode === "pc" ? (
        <PCPreview s={s} sections={sections} onNavigate={onNavigate} />
    ) : (
        <MobilePreview s={s} sections={sections} onNavigate={onNavigate} />
    );
}

function resolveSections(s: Settings, currentPageId: string | null): Section[] {
    if (!currentPageId) return s.sections;
    const sub = s.subPages.find((p) => p.id === currentPageId);
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
    onNavigate,
}: {
    s: Settings;
    sections: Section[];
    onNavigate?: (pageId: string | null) => void;
}) {
    const fontFamily = fontFamilyOf(s.font) ?? "var(--font-pretendard)";
    const headerPx = parsePxOr(s.header.padding, 12);
    // PC 에는 "모바일 하단 고정" 바가 노출되지 않으므로 floating 오프셋은 기본값만.
    const bottomOffset = 16;
    const orderedSections = expandFixedForms(sections);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInteraction = s.enabled.header && s.headerStyle === "interaction";

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
                <div ref={scrollRef} className="flex-1 overflow-y-auto">
                    {s.enabled.header ? (
                        <PreviewHeader
                            s={s}
                            px={headerPx}
                            pc
                            onNavigate={onNavigate}
                        />
                    ) : null}
                    {s.enabled.countdown && s.countdown.position === "top" ? (
                        <CountdownBanner s={s} pc />
                    ) : null}
                    <PageBody sections={orderedSections} enabled={s.enabled.sections} pc privacyText={s.privacyPolicy} />
                    {s.enabled.location && (s.location.embedUrl || s.location.address) ? (
                        <LocationMap location={s.location} pc />
                    ) : null}
                    <FooterBlock footer={s.footer} pc />
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
    onNavigate,
}: {
    s: Settings;
    sections: Section[];
    onNavigate?: (pageId: string | null) => void;
}) {
    const fontFamily = fontFamilyOf(s.font) ?? "var(--font-pretendard)";
    const headerPx = parsePxOr(s.header.padding, 12);
    const bottomOffset = s.enabled.bottomFixed
        ? parsePxOr(s.bottomFixed.height, 64)
        : 0;
    const orderedSections = expandFixedForms(sections);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInteraction = s.enabled.header && s.headerStyle === "interaction";

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
                >
                    {s.enabled.header ? (
                        <PreviewHeader
                            s={s}
                            px={headerPx}
                            onNavigate={onNavigate}
                        />
                    ) : null}
                    {s.enabled.countdown && s.countdown.position === "top" ? (
                        <CountdownBanner s={s} />
                    ) : null}
                    <PageBody sections={orderedSections} enabled={s.enabled.sections} privacyText={s.privacyPolicy} />
                    {s.enabled.location && (s.location.embedUrl || s.location.address) ? (
                        <LocationMap location={s.location} />
                    ) : null}
                    <FooterBlock footer={s.footer} />
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
}: {
    sections: Section[];
    enabled: boolean;
    pc?: boolean;
    privacyText: string;
}) {
    if (!enabled) return null;
    if (sections.length === 0) return <PreviewEmpty />;
    return (
        <div>
            {sections.map((sec) => (
                <SectionBlock key={sec.id} sec={sec} pc={pc} privacyText={privacyText} />
            ))}
        </div>
    );
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
