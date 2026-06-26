"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
    EditorPanel,
    EditorTabs,
    PageSelector,
    TabKey,
} from "./_editor/panel";
import { Preview, PreviewMode } from "./_preview/preview";
import { ModalProvider, useConfirm } from "./_ui/modal";
import { ToastProvider, useToast } from "./_ui/toast";
import { initialSettings, Settings } from "./types";
import { AutoFocusContext, DomainContext } from "./widgets";
import { clearAutosave, deleteDraft, Draft, saveDraft } from "./_editor/drafts";
import {
    ImageLifecycleProvider,
    useImageLifecycle,
} from "./_editor/image-lifecycle";
import {
    AutosaveStatus,
    DraftsMenu,
    RestoreBanner,
    useDrafts,
} from "./_editor/drafts-ui";
import { useSaveSettings, useSettings } from "@/service/setting";

type LoadState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready" }
    | { status: "error"; message: string };

// 임시저장 기본 이름 (현재 시각)
function formatNowName(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())} 임시저장`;
}

export default function SettingPage() {
    return (
        <ToastProvider>
            <ModalProvider>
                <ImageLifecycleProvider>
                    <SettingPageInner />
                </ImageLifecycleProvider>
            </ModalProvider>
        </ToastProvider>
    );
}

type Pane = "editor" | "preview";

function SettingPageInner() {
    const toast = useToast();
    const confirm = useConfirm();
    const searchParams = useSearchParams();
    const queryDomain = searchParams.get("domain");
    // SvelteKit 시절 `url.host.split('.')[0]` 패턴과 동일.
    // SSR 안전을 위해 mount 후에 window.location 에서 추출.
    const [hostDomain, setHostDomain] = useState<string | null>(null);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const host = window.location.hostname;
        if (!host.includes(".")) return; // 'localhost' 단독
        const first = host.split(".")[0];
        if (!first || first === "www" || /^\d+$/.test(first)) return; // IP, www
        setHostDomain(first);
    }, []);
    const domain = queryDomain ?? hostDomain;
    const [s, setS] = useState<Settings>(initialSettings);
    const [autoFocus, setAutoFocus] = useState(true);
    const [mode, setMode] = useState<PreviewMode>("pc");
    const [currentPageId, setCurrentPageId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("basic");
    const [pane, setPane] = useState<Pane>("editor");

    // 서버 baseline (query) ↔ 편집중 s (로컬) 분리.
    // 자동 refetch 는 QueryProvider 기본설정으로 꺼져 있어 s 가 덮어써질 일 없음.
    const settingsQuery = useSettings(domain);
    const saveMutation = useSaveSettings();
    const saving = saveMutation.isPending;

    // baseline 도착(또는 도메인 변경) 시 s 동기화. fetch 성공 시 1회.
    useEffect(() => {
        if (!domain) {
            setS(initialSettings);
            setCurrentPageId(null);
            return;
        }
        if (settingsQuery.data) {
            setS({ ...settingsQuery.data, domain });
            setCurrentPageId(null);
        }
    }, [domain, settingsQuery.data]);

    // 에러여도 편집은 계속 가능하게 빈 설정으로 폴백 (기존 동작 유지)
    useEffect(() => {
        if (domain && settingsQuery.isError) {
            setS({ ...initialSettings, domain });
            setCurrentPageId(null);
        }
    }, [domain, settingsQuery.isError]);

    const load: LoadState = !domain
        ? { status: "idle" }
        : settingsQuery.isPending
            ? { status: "loading" }
            : settingsQuery.isError
                ? {
                      status: "error",
                      message:
                          settingsQuery.error instanceof Error
                              ? settingsQuery.error.message
                              : String(settingsQuery.error),
                  }
                : { status: "ready" };

    const lifecycle = useImageLifecycle();

    const handleSave = useCallback(async () => {
        if (!domain) {
            console.log("save (no domain)", s);
            toast.show("도메인 정보가 없어 로컬 로그만 출력했습니다.", "info");
            return;
        }
        try {
            await saveMutation.mutateAsync({ domain, settings: s });
            // 저장 성공 후 — 교체/삭제된 옛 이미지를 GCS 에서 정리.
            await lifecycle.commit();
            clearAutosave(domain);
            toast.show(`'${domain}' 저장되었습니다.`);
        } catch (err) {
            toast.show(
                `저장 실패: ${err instanceof Error ? err.message : String(err)}`,
                "error",
            );
        }
    }, [domain, s, toast, saveMutation, lifecycle]);

    // 페이지 이탈 (F5 / 탭 닫기 / 다른 페이지 이동) 시 저장 안 된 업로드 이미지 정리.
    // sendBeacon 으로 best-effort cleanup.
    useEffect(() => {
        const onUnload = () => lifecycle.flushOrphansOnUnload();
        window.addEventListener("beforeunload", onUnload);
        return () => {
            window.removeEventListener("beforeunload", onUnload);
            // 컴포넌트 언마운트 시 (e.g., 다른 라우트로 이동) 도 정리.
            lifecycle.flushOrphansOnUnload();
        };
    }, [lifecycle]);

    const handleReset = useCallback(async () => {
        const ok = await confirm({
            title: "모든 변경 사항을 초기화할까요?",
            message: "지금까지 편집한 내용이 모두 사라집니다. 되돌릴 수 없습니다.",
            confirmLabel: "초기화",
            danger: true,
        });
        if (!ok) return;
        setS(initialSettings);
        setCurrentPageId(null);
        toast.show("초기화되었습니다.", "info");
    }, [confirm, toast]);

    // 자동저장 + 임시저장 목록 (localStorage, 서버 미연결 상태 작업 보호)
    const { drafts, autosavedAt, restorable, refreshDrafts, dismissRestore } =
        useDrafts({ domain, s, enabled: load.status !== "loading" });

    const handleSaveDraft = useCallback(() => {
        saveDraft(domain, formatNowName(), s);
        refreshDrafts();
        toast.show("임시저장 목록에 보관했습니다.");
    }, [domain, s, refreshDrafts, toast]);

    const handleRestoreDraft = useCallback(
        async (d: Draft) => {
            const ok = await confirm({
                title: "이 임시본으로 되돌릴까요?",
                message: "현재 편집 중인 내용이 임시본으로 교체됩니다.",
                confirmLabel: "복원",
            });
            if (!ok) return;
            setS(d.settings);
            setCurrentPageId(null);
            toast.show("임시본을 복원했습니다.", "info");
        },
        [confirm, toast],
    );

    const handleDeleteDraft = useCallback(
        (id: string) => {
            deleteDraft(id);
            refreshDrafts();
        },
        [refreshDrafts],
    );

    const handleRestoreAutosave = useCallback(() => {
        if (!restorable) return;
        setS(restorable.settings);
        setCurrentPageId(null);
        dismissRestore();
        toast.show("자동 저장본을 복원했습니다.", "info");
    }, [restorable, dismissRestore, toast]);

    // Cmd/Ctrl+S 저장 단축키
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                if (!saving && load.status !== "loading") handleSave();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handleSave, saving, load.status]);

    return (
        <AutoFocusContext.Provider value={autoFocus}>
        <DomainContext.Provider value={domain ?? ""}>
            <div className="h-screen flex flex-col lg:grid lg:grid-cols-[1fr_1fr] bg-slate-50 suit overflow-hidden">
                {/* Mobile-only pane toggle */}
                <div className="lg:hidden shrink-0 px-3 py-2 bg-white border-b border-slate-200 flex justify-center">
                    <PaneTabs pane={pane} onChange={setPane} />
                </div>

                {/* Left: Preview */}
                <div
                    className={`${
                        pane === "preview" ? "flex" : "hidden"
                    } lg:flex flex-1 min-h-0 min-w-0 lg:h-screen flex-col items-center p-4 sm:p-6 overflow-auto`}
                >
                    <div className="flex flex-col items-center gap-5 my-auto w-full">
                        <PreviewModeToggle mode={mode} onChange={setMode} />
                        <Preview
                            s={s}
                            mode={mode}
                            currentPageId={currentPageId}
                            onNavigate={setCurrentPageId}
                        />
                        <AutoFocusToggle
                            value={autoFocus}
                            onChange={setAutoFocus}
                        />
                    </div>
                </div>

                {/* Right: Editor */}
                <div
                    className={`${
                        pane === "editor" ? "flex" : "hidden"
                    } lg:flex flex-1 min-h-0 min-w-0 lg:h-screen flex-col bg-white`}
                >
                    <div className="shrink-0">
                        <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                                    랜딩페이지 편집
                                    {domain ? (
                                        <span className="ml-2 font-mono text-xs text-slate-500">
                                            · {domain}
                                        </span>
                                    ) : null}
                                </h1>
                                <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                                    {domain
                                        ? "수정 후 저장 시 해당 도메인 데이터로 반영됩니다."
                                        : "좌측 미리보기로 결과를 즉시 확인할 수 있습니다"}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs shrink-0"
                                onClick={handleReset}
                            >
                                초기화
                            </button>
                        </div>
                        <EditorTabs
                            activeTab={activeTab}
                            onChange={setActiveTab}
                        />
                        {activeTab === "structure" ? (
                            <PageSelector
                                subPages={s.subPages}
                                currentPageId={currentPageId}
                                onSelect={setCurrentPageId}
                            />
                        ) : null}
                    </div>

                    <div className="flex-1 min-h-0 min-w-0 overflow-y-auto editor-scroll py-4 px-3 sm:px-4 relative">
                        {restorable && load.status !== "loading" ? (
                            <RestoreBanner
                                entry={restorable}
                                onRestore={handleRestoreAutosave}
                                onDismiss={dismissRestore}
                            />
                        ) : null}
                        <EditorPanel
                            s={s}
                            setS={setS}
                            currentPageId={currentPageId}
                            setCurrentPageId={setCurrentPageId}
                            activeTab={activeTab}
                        />
                        {load.status === "loading" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-600">
                                불러오는 중…
                            </div>
                        )}
                        {load.status === "error" && (
                            <div className="absolute inset-x-3 top-3 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                                <div className="font-medium">
                                    GET 실패 — 빈 설정으로 시작합니다. 저장은 가능합니다.
                                </div>
                                <pre className="mt-1 whitespace-pre-wrap wrap-break-word">
                                    {load.message}
                                </pre>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 p-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <DraftsMenu
                                drafts={drafts}
                                onSave={handleSaveDraft}
                                onRestore={handleRestoreDraft}
                                onDelete={handleDeleteDraft}
                            />
                            <AutosaveStatus savedAt={autosavedAt} />
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary w-full py-3"
                            onClick={handleSave}
                            disabled={saving || load.status === "loading"}
                            title="단축키: Ctrl/⌘ + S"
                        >
                            {saving ? "저장 중…" : "저장 (⌘S)"}
                        </button>
                    </div>
                </div>
            </div>
        </DomainContext.Provider>
        </AutoFocusContext.Provider>
    );
}

function PaneTabs({
    pane,
    onChange,
}: {
    pane: Pane;
    onChange: (next: Pane) => void;
}) {
    return (
        <div
            className="inline-flex rounded-lg bg-slate-100 p-1"
            role="tablist"
            aria-label="화면 전환"
        >
            <PaneTabButton active={pane === "editor"} onClick={() => onChange("editor")}>
                편집
            </PaneTabButton>
            <PaneTabButton active={pane === "preview"} onClick={() => onChange("preview")}>
                미리보기
            </PaneTabButton>
        </div>
    );
}

function PaneTabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${
                active
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
            }`}
        >
            {children}
        </button>
    );
}

function PreviewModeToggle({
    mode,
    onChange,
}: {
    mode: PreviewMode;
    onChange: (mode: PreviewMode) => void;
}) {
    return (
        <div
            className="inline-flex rounded-lg bg-white border border-slate-200 p-1 shadow-sm"
            role="tablist"
            aria-label="미리보기 화면 크기"
        >
            <ModeButton active={mode === "pc"} onClick={() => onChange("pc")}>
                PC (840px)
            </ModeButton>
            <ModeButton active={mode === "mobile"} onClick={() => onChange("mobile")}>
                모바일
            </ModeButton>
        </div>
    );
}

function ModeButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${
                active
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
            }`}
        >
            {children}
        </button>
    );
}

function AutoFocusToggle({
    value,
    onChange,
}: {
    value: boolean;
    onChange: (next: boolean) => void;
}) {
    return (
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <button
                type="button"
                role="switch"
                aria-checked={value}
                data-on={value}
                className="toggle-switch"
                onClick={() => onChange(!value)}
            />
            <span className="font-medium">자동 포커스</span>
            <span className="text-slate-400">
                (사용하시면 제작하실 때 편리합니다.)
            </span>
        </label>
    );
}
