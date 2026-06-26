"use client";

import { Section, Settings } from "../types";
import { BasicTab } from "./tabs/basic-tab";
import { LegalTab } from "./tabs/legal-tab";
import { LocationTab } from "./tabs/location-tab";
import { MarketingTab } from "./tabs/marketing-tab";
import { StructureTab } from "./tabs/structure-tab";
import { SettingsProvider, SettingsContextValue } from "./tabs/context";
import { Updater } from "./tabs/shared";

export type TabKey =
    | "basic"
    | "structure"
    | "marketing"
    | "location"
    | "legal";

export const TABS: { key: TabKey; label: string; hint: string }[] = [
    { key: "basic", label: "기본", hint: "사이트 기본 정보 · 헤더 · 푸터 · 하단 고정 · 연결" },
    { key: "structure", label: "페이지 구성", hint: "본문 컨텐츠 · 서브페이지 · 하부 메뉴" },
    { key: "marketing", label: "전환 · 마케팅", hint: "CTA · 팝업 · 카운트다운" },
    { key: "location", label: "위치", hint: "주소 · 지도" },
    { key: "legal", label: "약관 · 메시지", hint: "개인정보 · 완료 메시지" },
];

export function EditorTabs({
    activeTab,
    onChange,
}: {
    activeTab: TabKey;
    onChange: (next: TabKey) => void;
}) {
    const activeTabHint = TABS.find((t) => t.key === activeTab)?.hint;
    return (
        <div className="px-5 border-b border-slate-200">
            <div
                className="flex gap-1 overflow-x-auto -mb-px"
                role="tablist"
                aria-label="편집 카테고리"
            >
                {TABS.map((t) => {
                    const active = activeTab === t.key;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange(t.key)}
                            className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition ${
                                active
                                    ? "border-blue-600 text-blue-700"
                                    : "border-transparent text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>
            {activeTabHint ? (
                <div className="text-[11px] text-slate-400 pb-2 pt-1">
                    {activeTabHint}
                </div>
            ) : null}
        </div>
    );
}

export function EditorPanel({
    s,
    setS,
    currentPageId,
    setCurrentPageId,
    activeTab,
}: {
    s: Settings;
    setS: (next: Settings | ((prev: Settings) => Settings)) => void;
    currentPageId: string | null;
    setCurrentPageId: (next: string | null) => void;
    activeTab: TabKey;
}) {
    const update: Updater = (key, value) =>
        setS((prev) => ({ ...prev, [key]: value }));

    const updateEnabled = <K extends keyof Settings["enabled"]>(
        key: K,
        value: boolean,
    ) =>
        setS((prev) => ({
            ...prev,
            enabled: { ...prev.enabled, [key]: value },
        }));

    const updateHeader = <K extends keyof Settings["header"]>(
        key: K,
        value: Settings["header"][K],
    ) =>
        setS((prev) => ({ ...prev, header: { ...prev.header, [key]: value } }));

    const updateInfo = <K extends keyof Settings["info"]>(
        key: K,
        value: Settings["info"][K],
    ) => setS((prev) => ({ ...prev, info: { ...prev.info, [key]: value } }));

    const updateSubMenus = <K extends keyof Settings["subMenus"]>(
        key: K,
        value: Settings["subMenus"][K],
    ) =>
        setS((prev) => ({
            ...prev,
            subMenus: { ...prev.subMenus, [key]: value },
        }));

    const currentSubPage = currentPageId
        ? s.subPages.find((p) => p.id === currentPageId) ?? null
        : null;
    const pageSections: Section[] = currentSubPage
        ? currentSubPage.sections
        : s.sections;
    const setPageSections = (next: Section[]) => {
        if (!currentPageId) {
            update("sections", next);
            return;
        }
        setS((prev) => ({
            ...prev,
            subPages: prev.subPages.map((p) =>
                p.id === currentPageId ? { ...p, sections: next } : p,
            ),
        }));
    };

    const ctx: SettingsContextValue = {
        s,
        update,
        updateInfo,
        updateHeader,
        updateSubMenus,
        updateEnabled,
    };

    return (
        <SettingsProvider value={ctx}>
            <div className="space-y-2">
                {activeTab === "basic" && <BasicTab />}
                {activeTab === "structure" && (
                    <StructureTab
                        currentPageId={currentPageId}
                        setCurrentPageId={setCurrentPageId}
                        currentSubPage={currentSubPage}
                        pageSections={pageSections}
                        setPageSections={setPageSections}
                    />
                )}
                {activeTab === "marketing" && <MarketingTab />}
                {activeTab === "location" && <LocationTab />}
                {activeTab === "legal" && <LegalTab />}
            </div>
        </SettingsProvider>
    );
}

export function PageSelector({
    subPages,
    currentPageId,
    onSelect,
}: {
    subPages: Settings["subPages"];
    currentPageId: string | null;
    onSelect: (next: string | null) => void;
}) {
    return (
        <div className="px-4 sm:px-5 py-2 border-b border-slate-200 bg-white">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <div className="text-[11px] font-medium text-blue-700 mb-1.5 flex items-center gap-1">
                    <span>📐</span>
                    <span>편집 중인 페이지</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => onSelect(null)}
                        className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition ${
                            currentPageId === null
                                ? "bg-blue-600 text-white shadow"
                                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                        }`}
                    >
                        메인 페이지
                    </button>
                    {subPages.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => onSelect(p.id)}
                            className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap font-mono transition ${
                                currentPageId === p.id
                                    ? "bg-blue-600 text-white shadow"
                                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                            }`}
                            title={p.title || `/${p.slug}`}
                        >
                            /{p.slug}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
