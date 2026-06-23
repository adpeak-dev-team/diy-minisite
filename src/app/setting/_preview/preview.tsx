"use client";

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
}: {
    s: Settings;
    mode: PreviewMode;
    currentPageId: string | null;
}) {
    const sections = resolveSections(s, currentPageId);
    return mode === "pc" ? (
        <PCPreview s={s} sections={sections} />
    ) : (
        <MobilePreview s={s} sections={sections} />
    );
}

function resolveSections(s: Settings, currentPageId: string | null): Section[] {
    if (!currentPageId) return s.sections;
    const sub = s.subPages.find((p) => p.id === currentPageId);
    return sub?.sections ?? [];
}

function PCPreview({ s, sections }: { s: Settings; sections: Section[] }) {
    const fontFamily = fontFamilyOf(s.font) ?? "var(--font-pretendard)";
    const headerPx = parsePxOr(s.header.padding, 12);
    const bottomOffset = s.enabled.bottomFixed
        ? parsePxOr(s.bottomFixed.height, 64)
        : 16;

    return (
        <div className="w-210 h-160 flex flex-col bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-200">
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
                <div className="flex-1 overflow-y-auto">
                    {s.enabled.header ? <PreviewHeader s={s} px={headerPx} pc /> : null}
                    {s.enabled.countdown && s.countdown.position === "top" ? (
                        <CountdownBanner s={s} pc />
                    ) : null}
                    <PageBody sections={sections} enabled={s.enabled.sections} pc privacyText={s.privacyPolicy} />
                    {s.info.inviteVisible === "on" && s.info.inviteText ? (
                        <div className="px-8 py-10 text-center text-base text-slate-700 border-t border-slate-100">
                            {s.info.inviteText}
                        </div>
                    ) : null}
                    {s.info.buttonText ? (
                        <div className="px-8 pb-10 flex justify-center">
                            <button
                                type="button"
                                className="px-10 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium"
                            >
                                {s.info.buttonText}
                            </button>
                        </div>
                    ) : null}
                    {s.enabled.location && (s.location.embedUrl || s.location.address) ? (
                        <LocationMap location={s.location} pc />
                    ) : null}
                    <FooterBlock footer={s.footer} pc />
                    {s.enabled.countdown && s.countdown.position === "bottom" ? (
                        <CountdownBanner s={s} pc />
                    ) : null}
                </div>

                {s.enabled.bottomFixed ? <BottomFixedBar s={s} /> : null}
                {s.enabled.countdown && s.countdown.position === "floating" ? (
                    <CountdownFloating s={s} pc />
                ) : null}
                {s.enabled.quickConnect ? (
                    <QuickConnectButtons s={s} bottomOffset={bottomOffset} />
                ) : null}
                {s.enabled.fixedImage && s.info.fixedImage ? (
                    <FixedImageFloating
                        src={s.info.fixedImage}
                        bottomOffset={bottomOffset + 56}
                    />
                ) : null}
                {s.enabled.popup && s.popupImage ? (
                    <PopupOverlay image={s.popupImage} pc />
                ) : null}
            </div>
        </div>
    );
}

function MobilePreview({ s, sections }: { s: Settings; sections: Section[] }) {
    const fontFamily = fontFamilyOf(s.font) ?? "var(--font-pretendard)";
    const headerPx = parsePxOr(s.header.padding, 12);
    const bottomOffset = s.enabled.bottomFixed
        ? parsePxOr(s.bottomFixed.height, 64)
        : 0;

    return (
        <div className="relative w-[320px] h-[660px] bg-black rounded-[42px] p-2 shadow-2xl">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-2xl z-20" />
            <div
                className="relative w-full h-full rounded-[34px] overflow-hidden bg-white flex flex-col"
                style={{ fontFamily }}
            >
                <div className="flex-1 overflow-y-auto">
                    {s.enabled.header ? <PreviewHeader s={s} px={headerPx} /> : null}
                    {s.enabled.countdown && s.countdown.position === "top" ? (
                        <CountdownBanner s={s} />
                    ) : null}
                    <PageBody sections={sections} enabled={s.enabled.sections} privacyText={s.privacyPolicy} />
                    {s.info.inviteVisible === "on" && s.info.inviteText ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-700 border-t border-slate-100">
                            {s.info.inviteText}
                        </div>
                    ) : null}
                    {s.info.buttonText ? (
                        <div className="px-4 pb-6">
                            <button
                                type="button"
                                className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-medium"
                            >
                                {s.info.buttonText}
                            </button>
                        </div>
                    ) : null}
                    {s.enabled.location && (s.location.embedUrl || s.location.address) ? (
                        <LocationMap location={s.location} />
                    ) : null}
                    <FooterBlock footer={s.footer} />
                    {s.enabled.countdown && s.countdown.position === "bottom" ? (
                        <CountdownBanner s={s} />
                    ) : null}
                </div>

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
                        bottomOffset={bottomOffset + 56}
                    />
                ) : null}
                {s.enabled.popup && s.popupImage ? (
                    <PopupOverlay image={s.popupImage} />
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
