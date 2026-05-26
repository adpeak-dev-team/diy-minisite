"use client";

import {
    AccordionSection,
    ColorPicker,
    Field,
    FontSelect,
    ImageUploader,
    OnOffPill,
    RadioPill,
    Toggle,
} from "../widgets";
import { EnabledFlags, Section, Settings } from "../types";
import { BottomFixedEditor } from "./bottom";
import { MenuItemsEditor } from "./menus";
import { SectionsEditor } from "./sections";
import { SubPagesEditor } from "./subpages";

type Updater = <K extends keyof Settings>(key: K, value: Settings[K]) => void;

export type TabKey =
    | "basic"
    | "structure"
    | "marketing"
    | "contact"
    | "location"
    | "legal";

export const TABS: { key: TabKey; label: string; hint: string }[] = [
    { key: "basic", label: "기본", hint: "사이트 기본 정보 · 헤더 · 푸터" },
    { key: "structure", label: "페이지 구성", hint: "본문 컨텐츠 · 서브페이지 · 하부 메뉴" },
    { key: "marketing", label: "전환 · 마케팅", hint: "CTA · 팝업 · 카운트다운" },
    { key: "contact", label: "연락 · 연결", hint: "하단 고정 · 빠른 연결 · 명함" },
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

    const updateEnabled = <K extends keyof EnabledFlags>(
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

    return (
        <div>
            <div className="space-y-2">
                {activeTab === "basic" && (
                    <BasicTab
                        s={s}
                        update={update}
                        updateInfo={updateInfo}
                        updateHeader={updateHeader}
                        updateEnabled={updateEnabled}
                    />
                )}
                {activeTab === "structure" && (
                    <StructureTab
                        s={s}
                        update={update}
                        updateEnabled={updateEnabled}
                        updateSubMenus={updateSubMenus}
                        currentPageId={currentPageId}
                        setCurrentPageId={setCurrentPageId}
                        currentSubPage={currentSubPage}
                        pageSections={pageSections}
                        setPageSections={setPageSections}
                    />
                )}
                {activeTab === "marketing" && (
                    <MarketingTab
                        s={s}
                        update={update}
                        updateInfo={updateInfo}
                        updateEnabled={updateEnabled}
                    />
                )}
                {activeTab === "contact" && (
                    <ContactTab
                        s={s}
                        update={update}
                        updateInfo={updateInfo}
                        updateEnabled={updateEnabled}
                    />
                )}
                {activeTab === "location" && (
                    <LocationTab s={s} update={update} updateEnabled={updateEnabled} />
                )}
                {activeTab === "legal" && <LegalTab s={s} update={update} updateEnabled={updateEnabled} />}
            </div>
        </div>
    );
}

function BasicTab({
    s,
    update,
    updateInfo,
    updateHeader,
    updateEnabled,
}: {
    s: Settings;
    update: Updater;
    updateInfo: <K extends keyof Settings["info"]>(key: K, value: Settings["info"][K]) => void;
    updateHeader: <K extends keyof Settings["header"]>(key: K, value: Settings["header"][K]) => void;
    updateEnabled: <K extends keyof EnabledFlags>(key: K, value: boolean) => void;
}) {
    return (
        <>
            <AccordionSection
                title="메인"
                desc="도메인 / 사이트명 / DB 접수 정보"
                defaultOpen
            >
                <Field label="도메인">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            className="input-base flex-1"
                            value={s.domain}
                            onChange={(e) => update("domain", e.target.value)}
                        />
                        <button
                            type="button"
                            className="btn btn-accent btn-sm"
                            onClick={() => {
                                navigator.clipboard
                                    ?.writeText(s.domain)
                                    .catch(() => {});
                            }}
                        >
                            사이트 복사
                        </button>
                    </div>
                </Field>
                <Field label="사이트명">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.info.siteName}
                        onChange={(e) => updateInfo("siteName", e.target.value)}
                    />
                </Field>
                <Field label="DB 접수 제목" hint="상담 접수 시 관리자에게 표시되는 제목">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.info.dbTitle}
                        onChange={(e) => updateInfo("dbTitle", e.target.value)}
                    />
                </Field>
            </AccordionSection>

            <AccordionSection
                title="헤더"
                desc="상단 헤더 스타일, 로고, 전화번호 이미지"
                enabled={s.enabled.header}
                onToggle={(v) => updateEnabled("header", v)}
                focusTarget="header"
            >
                <Field label="상단 헤더 스타일">
                    <RadioPill
                        value={s.headerStyle}
                        onChange={(v) => update("headerStyle", v)}
                        options={[
                            { value: "fix", label: "상단 고정" },
                            { value: "interaction", label: "스크롤 상호 작용" },
                        ]}
                    />
                </Field>
                <Field label="헤더 색상">
                    <ColorPicker
                        value={s.header.color}
                        onChange={(v) => updateHeader("color", v)}
                    />
                </Field>
                <Field label="위아래 여백 (px)" hint="기본 12px">
                    <input
                        type="number"
                        min={0}
                        className="input-base w-28"
                        placeholder="12"
                        value={s.header.padding}
                        onChange={(e) => updateHeader("padding", e.target.value)}
                    />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="로고 이미지">
                        <ImageUploader
                            value={s.header.logoImage}
                            onChange={(v) => updateHeader("logoImage", v)}
                        />
                        <div className="flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">사이즈</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    className="input-base w-20 text-xs"
                                    placeholder="100"
                                    value={s.header.logoSize}
                                    onChange={(e) =>
                                        updateHeader("logoSize", e.target.value)
                                    }
                                />
                                <span className="text-xs text-slate-500">%</span>
                            </div>
                            {!s.header.phoneImage ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500">정렬</span>
                                    <RadioPill
                                        value={s.header.logoAlign}
                                        onChange={(v) =>
                                            updateHeader("logoAlign", v)
                                        }
                                        options={[
                                            { value: "left", label: "좌" },
                                            { value: "center", label: "중앙" },
                                            { value: "right", label: "우" },
                                        ]}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </Field>
                    <Field label="상단 전화번호 이미지">
                        <ImageUploader
                            value={s.header.phoneImage}
                            onChange={(v) => updateHeader("phoneImage", v)}
                        />
                        <div className="flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">사이즈</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    className="input-base w-20 text-xs"
                                    placeholder="100"
                                    value={s.header.phoneSize}
                                    onChange={(e) =>
                                        updateHeader("phoneSize", e.target.value)
                                    }
                                />
                                <span className="text-xs text-slate-500">%</span>
                            </div>
                            {!s.header.logoImage ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500">정렬</span>
                                    <RadioPill
                                        value={s.header.phoneAlign}
                                        onChange={(v) =>
                                            updateHeader("phoneAlign", v)
                                        }
                                        options={[
                                            { value: "left", label: "좌" },
                                            { value: "center", label: "중앙" },
                                            { value: "right", label: "우" },
                                        ]}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </Field>
                </div>

                <Field label="">
                    <div className="flex items-center gap-2 mb-2">
                        <Toggle
                            on={s.header.menuEnabled}
                            onChange={(v) => updateHeader("menuEnabled", v)}
                        />
                        <span className="text-sm font-medium text-slate-700">
                            메뉴 사용
                        </span>
                    </div>
                    {s.header.menuEnabled ? (
                        <>
                            <MenuItemsEditor
                                items={s.header.menus}
                                onChange={(items) => updateHeader("menus", items)}
                                subPages={s.subPages}
                            />
                            <div className="mt-3">
                                <Field label="메뉴 폰트">
                                    <FontSelect
                                        value={s.header.menuFont}
                                        onChange={(v) => updateHeader("menuFont", v)}
                                    />
                                </Field>
                            </div>
                        </>
                    ) : null}
                </Field>
            </AccordionSection>

            <AccordionSection
                title="푸터"
                desc="상호명 / 대표 / 사업자번호 / 대표번호"
                focusTarget="footer"
            >
                <div className="grid grid-cols-2 gap-3">
                    <Field label="상호명">
                        <input
                            type="text"
                            className="input-base w-full"
                            value={s.footer.company}
                            onChange={(e) =>
                                update("footer", {
                                    ...s.footer,
                                    company: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="대표">
                        <input
                            type="text"
                            className="input-base w-full"
                            value={s.footer.ceo}
                            onChange={(e) =>
                                update("footer", {
                                    ...s.footer,
                                    ceo: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="사업자등록번호">
                        <input
                            type="text"
                            className="input-base w-full"
                            placeholder="000-00-00000"
                            value={s.footer.bizNumber}
                            onChange={(e) =>
                                update("footer", {
                                    ...s.footer,
                                    bizNumber: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="대표번호">
                        <input
                            type="text"
                            className="input-base w-full"
                            placeholder="02-0000-0000"
                            value={s.footer.phone}
                            onChange={(e) =>
                                update("footer", {
                                    ...s.footer,
                                    phone: e.target.value,
                                })
                            }
                        />
                    </Field>
                </div>
                <Field label="폰트">
                    <FontSelect
                        value={s.footer.font}
                        onChange={(v) =>
                            update("footer", { ...s.footer, font: v })
                        }
                    />
                </Field>
            </AccordionSection>

            <AccordionSection title="고급 설정" desc="사이트 설명 · 추가 스크립트">
                <Field label="사이트 설명" hint="검색 결과에 표시되는 메타 설명">
                    <textarea
                        rows={3}
                        className="input-base w-full"
                        value={s.siteDescription}
                        onChange={(e) => update("siteDescription", e.target.value)}
                        placeholder="사이트 메타 설명을 입력하세요"
                    />
                </Field>
                <Field label="추가 스크립트" hint="GA, Meta Pixel 등 head에 삽입">
                    <textarea
                        rows={4}
                        className="input-base w-full font-mono text-xs"
                        value={s.additionalScript}
                        onChange={(e) =>
                            update("additionalScript", e.target.value)
                        }
                        placeholder="<script>...</script>"
                    />
                </Field>
            </AccordionSection>
        </>
    );
}

function StructureTab({
    s,
    update,
    updateEnabled,
    updateSubMenus,
    currentPageId,
    setCurrentPageId,
    currentSubPage,
    pageSections,
    setPageSections,
}: {
    s: Settings;
    update: Updater;
    updateEnabled: <K extends keyof EnabledFlags>(key: K, value: boolean) => void;
    updateSubMenus: <K extends keyof Settings["subMenus"]>(key: K, value: Settings["subMenus"][K]) => void;
    currentPageId: string | null;
    setCurrentPageId: (next: string | null) => void;
    currentSubPage: Settings["subPages"][number] | null;
    pageSections: Section[];
    setPageSections: (next: Section[]) => void;
}) {
    return (
        <>
            <AccordionSection
                title={
                    currentSubPage
                        ? `컨텐츠 · /${currentSubPage.slug}`
                        : "컨텐츠 · 메인"
                }
                desc={`${pageSections.length}개 섹션`}
                enabled={s.enabled.sections}
                onToggle={(v) => updateEnabled("sections", v)}
                focusTarget="hero"
                defaultOpen
            >
                <SectionsEditor sections={pageSections} onChange={setPageSections} />
            </AccordionSection>

            <AccordionSection
                title="서브페이지"
                desc={`${s.subPages.length}개 · /slug 라우트`}
            >
                <SubPagesEditor
                    items={s.subPages}
                    onChange={(items) => update("subPages", items)}
                    currentPageId={currentPageId}
                    onSelectPage={setCurrentPageId}
                />
            </AccordionSection>

            <AccordionSection
                title="하부 메뉴"
                desc={`${s.subMenus.items.length}개 메뉴`}
                enabled={s.enabled.subMenus}
                onToggle={(v) => updateEnabled("subMenus", v)}
                focusTarget="submenu"
            >
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <Field label="배경 색상">
                        <ColorPicker
                            value={s.subMenus.bgColor}
                            onChange={(v) => updateSubMenus("bgColor", v)}
                        />
                    </Field>
                    <Field label="텍스트 색상">
                        <ColorPicker
                            value={s.subMenus.textColor}
                            onChange={(v) => updateSubMenus("textColor", v)}
                        />
                    </Field>
                    <Field label="폰트">
                        <FontSelect
                            value={s.subMenus.font}
                            onChange={(v) => updateSubMenus("font", v)}
                        />
                    </Field>
                    <Field label="위아래 여백 (px)" hint="기본 12px">
                        <input
                            type="number"
                            min={0}
                            className="input-base w-full"
                            placeholder="12"
                            value={s.subMenus.padding}
                            onChange={(e) =>
                                updateSubMenus("padding", e.target.value)
                            }
                        />
                    </Field>
                </div>
                <MenuItemsEditor
                    items={s.subMenus.items}
                    onChange={(items) => updateSubMenus("items", items)}
                    subPages={s.subPages}
                />
            </AccordionSection>
        </>
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

function MarketingTab({
    s,
    update,
    updateInfo,
    updateEnabled,
}: {
    s: Settings;
    update: Updater;
    updateInfo: <K extends keyof Settings["info"]>(key: K, value: Settings["info"][K]) => void;
    updateEnabled: <K extends keyof EnabledFlags>(key: K, value: boolean) => void;
}) {
    return (
        <>
            <AccordionSection title="초대 문구 · 버튼" desc="메인 CTA 영역">
                <Field label="초대 문구">
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            className="input-base flex-1"
                            value={s.info.inviteText}
                            onChange={(e) =>
                                updateInfo("inviteText", e.target.value)
                            }
                        />
                        <OnOffPill
                            value={s.info.inviteVisible}
                            onChange={(v) => updateInfo("inviteVisible", v)}
                        />
                    </div>
                </Field>
                <Field label="초대 아래 영역">
                    <OnOffPill
                        value={s.info.belowInviteVisible}
                        onChange={(v) => updateInfo("belowInviteVisible", v)}
                    />
                </Field>
                <Field label="버튼 문구">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.info.buttonText}
                        onChange={(e) =>
                            updateInfo("buttonText", e.target.value)
                        }
                    />
                </Field>
            </AccordionSection>

            <AccordionSection
                title="팝업 이미지"
                desc="첫 방문 시 표시되는 팝업"
                enabled={s.enabled.popup}
                onToggle={(v) => updateEnabled("popup", v)}
            >
                <ImageUploader
                    value={s.popupImage}
                    onChange={(v) => update("popupImage", v)}
                />
            </AccordionSection>

            <AccordionSection
                title="카운트다운 · 신청자"
                desc="마감 타이머 및 현재 신청자 수"
                enabled={s.enabled.countdown}
                onToggle={(v) => updateEnabled("countdown", v)}
                focusTarget="countdown"
            >
                <Field label="제목">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.countdown.title}
                        onChange={(e) =>
                            update("countdown", {
                                ...s.countdown,
                                title: e.target.value,
                            })
                        }
                        placeholder="이벤트 마감까지"
                    />
                </Field>
                <Field label="마감 일시">
                    <input
                        type="datetime-local"
                        className="input-base w-full"
                        value={s.countdown.deadline}
                        onChange={(e) =>
                            update("countdown", {
                                ...s.countdown,
                                deadline: e.target.value,
                            })
                        }
                    />
                </Field>
                <Field label="현재 신청자 수">
                    <input
                        type="number"
                        min={0}
                        className="input-base w-32"
                        value={s.countdown.applicantsCount}
                        onChange={(e) =>
                            update("countdown", {
                                ...s.countdown,
                                applicantsCount: e.target.value,
                            })
                        }
                    />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="배경 색상">
                        <ColorPicker
                            value={s.countdown.bgColor}
                            onChange={(v) =>
                                update("countdown", {
                                    ...s.countdown,
                                    bgColor: v,
                                })
                            }
                        />
                    </Field>
                    <Field label="텍스트 색상">
                        <ColorPicker
                            value={s.countdown.textColor}
                            onChange={(v) =>
                                update("countdown", {
                                    ...s.countdown,
                                    textColor: v,
                                })
                            }
                        />
                    </Field>
                </div>
                <Field label="폰트">
                    <FontSelect
                        value={s.countdown.font}
                        onChange={(v) =>
                            update("countdown", { ...s.countdown, font: v })
                        }
                    />
                </Field>
                <Field label="위치">
                    <RadioPill
                        value={s.countdown.position}
                        onChange={(v) =>
                            update("countdown", {
                                ...s.countdown,
                                position: v,
                            })
                        }
                        options={[
                            { value: "top", label: "상단" },
                            { value: "bottom", label: "하단" },
                            { value: "floating", label: "우측 하단 (원형)" },
                        ]}
                    />
                </Field>
                {s.countdown.position !== "floating" ? (
                    <Field label="">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <Toggle
                                on={s.countdown.sticky}
                                onChange={(v) =>
                                    update("countdown", {
                                        ...s.countdown,
                                        sticky: v,
                                    })
                                }
                            />
                            <span className="text-sm text-slate-700">
                                스크롤 시 고정
                            </span>
                        </label>
                    </Field>
                ) : null}
            </AccordionSection>
        </>
    );
}

function ContactTab({
    s,
    update,
    updateInfo,
    updateEnabled,
}: {
    s: Settings;
    update: Updater;
    updateInfo: <K extends keyof Settings["info"]>(key: K, value: Settings["info"][K]) => void;
    updateEnabled: <K extends keyof EnabledFlags>(key: K, value: boolean) => void;
}) {
    return (
        <>
            <AccordionSection
                title="하단 고정"
                desc="페이지 하단 고정 영역 (전화 / 상담)"
                enabled={s.enabled.bottomFixed}
                onToggle={(v) => updateEnabled("bottomFixed", v)}
                focusTarget="bottom"
            >
                <BottomFixedEditor
                    value={s.bottomFixed}
                    onChange={(v) => update("bottomFixed", v)}
                />
            </AccordionSection>

            <AccordionSection
                title="빠른 연결"
                desc="카카오톡 · 문자 플로팅 버튼"
                enabled={s.enabled.quickConnect}
                onToggle={(v) => updateEnabled("quickConnect", v)}
            >
                <Field label="카카오톡 채널 URL">
                    <div className="flex items-center gap-2">
                        <Toggle
                            on={s.quickConnect.kakao.enabled}
                            onChange={(v) =>
                                update("quickConnect", {
                                    ...s.quickConnect,
                                    kakao: { ...s.quickConnect.kakao, enabled: v },
                                })
                            }
                        />
                        <input
                            type="text"
                            className="input-base flex-1"
                            placeholder="https://pf.kakao.com/_xxxxxx"
                            value={s.quickConnect.kakao.url}
                            onChange={(e) =>
                                update("quickConnect", {
                                    ...s.quickConnect,
                                    kakao: {
                                        ...s.quickConnect.kakao,
                                        url: e.target.value,
                                    },
                                })
                            }
                        />
                    </div>
                </Field>
                <Field label="문자 전화번호">
                    <div className="flex items-center gap-2">
                        <Toggle
                            on={s.quickConnect.sms.enabled}
                            onChange={(v) =>
                                update("quickConnect", {
                                    ...s.quickConnect,
                                    sms: { ...s.quickConnect.sms, enabled: v },
                                })
                            }
                        />
                        <input
                            type="text"
                            className="input-base flex-1"
                            placeholder="01012345678"
                            value={s.quickConnect.sms.phone}
                            onChange={(e) =>
                                update("quickConnect", {
                                    ...s.quickConnect,
                                    sms: {
                                        ...s.quickConnect.sms,
                                        phone: e.target.value,
                                    },
                                })
                            }
                        />
                    </div>
                </Field>
            </AccordionSection>

            <AccordionSection
                title="명함 이미지"
                desc="메세지 발송 시 함께 보내지는 이미지"
                enabled={s.enabled.fixedImage}
                onToggle={(v) => updateEnabled("fixedImage", v)}
            >
                <Field label="명함 이미지">
                    <ImageUploader
                        value={s.info.businessCardImage}
                        onChange={(v) => updateInfo("businessCardImage", v)}
                    />
                </Field>
            </AccordionSection>
        </>
    );
}

function LocationTab({
    s,
    update,
    updateEnabled,
}: {
    s: Settings;
    update: Updater;
    updateEnabled: <K extends keyof EnabledFlags>(key: K, value: boolean) => void;
}) {
    return (
        <AccordionSection
            title="위치 · 지도"
            desc="주소 또는 임베드 URL"
            enabled={s.enabled.location}
            onToggle={(v) => updateEnabled("location", v)}
            focusTarget="location"
        >
            <Field label="주소" hint="임베드 URL 미입력 시 구글 지도로 표시">
                <input
                    type="text"
                    className="input-base w-full"
                    placeholder="서울특별시 강남구 ..."
                    value={s.location.address}
                    onChange={(e) =>
                        update("location", {
                            ...s.location,
                            address: e.target.value,
                        })
                    }
                />
            </Field>
            <Field
                label="임베드 URL (선택)"
                hint="카카오맵/네이버지도 공유의 iframe src"
            >
                <input
                    type="text"
                    className="input-base w-full font-mono text-xs"
                    placeholder="https://map.kakao.com/..."
                    value={s.location.embedUrl}
                    onChange={(e) =>
                        update("location", {
                            ...s.location,
                            embedUrl: e.target.value,
                        })
                    }
                />
            </Field>
        </AccordionSection>
    );
}

function LegalTab({
    s,
    update,
    updateEnabled,
}: {
    s: Settings;
    update: Updater;
    updateEnabled: <K extends keyof EnabledFlags>(key: K, value: boolean) => void;
}) {
    return (
        <>
            <AccordionSection
                title="개인정보 보호동의 전문"
                enabled={s.enabled.privacy}
                onToggle={(v) => updateEnabled("privacy", v)}
            >
                <textarea
                    rows={8}
                    className="input-base w-full text-xs"
                    value={s.privacyPolicy}
                    onChange={(e) => update("privacyPolicy", e.target.value)}
                />
            </AccordionSection>

            <AccordionSection title="신청접수 완료 메시지">
                <textarea
                    rows={4}
                    className="input-base w-full"
                    value={s.completeMessage}
                    onChange={(e) => update("completeMessage", e.target.value)}
                />
            </AccordionSection>
        </>
    );
}
