"use client";

import { findSubPage, patchSubPage, Section, Settings, SubPage } from "../types";
import {
    FixedSubTab,
    FooterSubTab,
    HeaderSubTab,
    InfoSubTab,
    MenuTab,
    MobileBottomTab,
} from "./tabs/basic-tab";
import { LegalTab } from "./tabs/legal-tab";
import { MarketingTab } from "./tabs/marketing-tab";
import { StructureTab } from "./tabs/structure-tab";
import { SettingsProvider, SettingsContextValue } from "./tabs/context";
import { Updater } from "./tabs/shared";

export type TabKey =
    | "info"
    | "main"
    | "menu"
    | "subpages"
    | "header"
    | "footer"
    | "fixed"
    | "legal";

export const TABS: { key: TabKey; label: string }[] = [
    { key: "info", label: "기본정보" },
    { key: "main", label: "메인페이지" },
    { key: "menu", label: "메뉴관리" },
    { key: "subpages", label: "서브페이지" },
    { key: "header", label: "상단" },
    { key: "footer", label: "하단" },
    { key: "fixed", label: "기능" },
    { key: "legal", label: "약관·메시지" },
];

export function EditorTabs({
    activeTab,
    onChange,
}: {
    activeTab: TabKey;
    onChange: (next: TabKey) => void;
}) {
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
                            data-guide={`tab-${t.key}`}
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
        </div>
    );
}

export function EditorPanel({
    s,
    setS,
    currentPageId,
    setCurrentPageId,
    activeTab,
    setActiveTab,
}: {
    s: Settings;
    setS: (next: Settings | ((prev: Settings) => Settings)) => void;
    currentPageId: string | null;
    setCurrentPageId: (next: string | null) => void;
    activeTab: TabKey;
    setActiveTab: (next: TabKey) => void;
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

    const found = currentPageId ? findSubPage(s.subPages, currentPageId) : null;
    const currentSubPage: SubPage | null = found?.page ?? null;
    const parentSubPage: SubPage | null = found?.parent ?? null;
    const pageSections: Section[] = currentSubPage
        ? currentSubPage.sections
        : s.sections;
    // 섹션을 추가했는데 '섹션 표시' 토글이 꺼져 있으면(빈 도메인 로드 시 기본값 off)
    // 자동으로 켠다 — 안 그러면 추가한 섹션이 미리보기에 안 보여 혼란스럽다.
    const enableSectionsIfNeeded = (
        prev: Settings,
        next: Section[],
    ): Settings["enabled"] =>
        next.length > 0 && !prev.enabled.sections
            ? { ...prev.enabled, sections: true }
            : prev.enabled;

    const setPageSections = (next: Section[]) => {
        if (!currentPageId) {
            setS((prev) => ({
                ...prev,
                sections: next,
                enabled: enableSectionsIfNeeded(prev, next),
            }));
            return;
        }
        setS((prev) => ({
            ...prev,
            subPages: patchSubPage(prev.subPages, currentPageId, (p) => ({
                ...p,
                sections: next,
            })),
            enabled: enableSectionsIfNeeded(prev, next),
        }));
    };

    const editPageDesign = (id: string | null) => {
        setCurrentPageId(id);
        if (id !== null) setActiveTab("subpages");
    };

    const ctx: SettingsContextValue = {
        s,
        update,
        updateInfo,
        updateHeader,
        updateSubMenus,
        updateEnabled,
        currentPageId,
        editPageDesign,
    };

    return (
        <SettingsProvider value={ctx}>
            <div className="space-y-2">
                {activeTab === "info" && <InfoSubTab />}
                {activeTab === "main" && (
                    <StructureTab
                        scope="main"
                        currentSubPage={null}
                        parentSubPage={null}
                        pageSections={s.sections}
                        setPageSections={(next) =>
                            setS((prev) => ({
                                ...prev,
                                sections: next,
                                enabled: enableSectionsIfNeeded(prev, next),
                            }))
                        }
                    />
                )}
                {activeTab === "menu" && <MenuTab />}
                {activeTab === "subpages" && (
                    <StructureTab
                        scope="subpages"
                        currentSubPage={currentSubPage}
                        parentSubPage={parentSubPage}
                        pageSections={pageSections}
                        setPageSections={setPageSections}
                    />
                )}
                {activeTab === "header" && <HeaderSubTab />}
                {activeTab === "footer" && (
                    <>
                        <FooterSubTab />
                        <MobileBottomTab />
                    </>
                )}
                {activeTab === "fixed" && (
                    <>
                        <FixedSubTab />
                        <MarketingTab />
                    </>
                )}
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
    // 현재 선택된 페이지의 부모(자식이 선택된 경우) 또는 그 페이지 자체(부모가 선택된 경우).
    // 이 부모의 children 이 있으면 2단 pill 을 노출.
    const found = currentPageId ? findSubPage(subPages, currentPageId) : null;
    const parentPill = found?.parent ?? found?.page ?? null;
    const showChildren = !!parentPill?.children?.length;

    return (
        <div className="px-4 sm:px-5 py-2 bg-white">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <div className="text-[11px] font-medium text-blue-700 mb-1.5 flex items-center gap-1">
                    <span>📐</span>
                    <span>편집 중인 서브페이지</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {subPages.length === 0 ? (
                        <span className="text-[11px] text-slate-400 py-1">
                            서브페이지가 없습니다. ‘메뉴관리’ 탭에서 추가하세요.
                        </span>
                    ) : null}
                    {subPages.map((p) => {
                        // 자식이 선택된 경우 부모 pill 을 "선택된 상태" 로 표시하되
                        // 배경톤을 옅게(파랑300) 해서 실제 활성(파랑600) 자식과 구분.
                        const isActive = currentPageId === p.id;
                        const isParentOfActive =
                            !isActive && found?.parent?.id === p.id;
                        const hasChildren = !!p.children?.length;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => onSelect(p.id)}
                                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap font-mono transition ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow"
                                        : isParentOfActive
                                            ? "bg-blue-300 text-white"
                                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                                }`}
                                title={p.title || `/${p.slug}`}
                            >
                                /{p.slug}
                                {hasChildren ? (
                                    <span className="ml-1 text-[9px] opacity-70">
                                        +{p.children!.length}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
                {showChildren && parentPill ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto mt-2 pt-2 border-t border-blue-100">
                        <span className="text-[10px] text-blue-600 shrink-0 pl-1">
                            └ 하부메뉴
                        </span>
                        {parentPill.children!.map((c) => {
                            const isActive = currentPageId === c.id;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => onSelect(c.id)}
                                    className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap font-mono transition ${
                                        isActive
                                            ? "bg-blue-600 text-white shadow"
                                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                                    }`}
                                    title={c.title || `/${parentPill.slug}/${c.slug}`}
                                >
                                    /{c.slug}
                                </button>
                            );
                        })}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
