"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
    EditorPanel,
    EditorTabs,
    PageSelector,
    TabKey,
} from "./_editor/panel";
import { Preview, PreviewMode } from "./_preview/preview";
import { ModalProvider, useConfirm } from "./_ui/modal";
import { GuideButton, GuideTour, GUIDE_SEEN_KEY } from "./_ui/guide";
import { ToastProvider, useToast } from "./_ui/toast";
import { initialSettings, Settings } from "./types";
import {
    AutoFocusContext,
    DomainContext,
    EditorFocus,
    EditorFocusContext,
} from "./widgets";
import { clearAutosave, deleteDraft, Draft, saveDraft } from "./_editor/drafts";
import {
    ImageLifecycleProvider,
    useImageLifecycle,
} from "./_editor/image-lifecycle";
import {
    AutosaveStatus,
    DraftsMenu,
    useDrafts,
} from "./_editor/drafts-ui";
import { useSaveSettings, useSettings } from "@/service/setting";
import { TEMPLATES } from "./templates";
import { withGuideDemoExtras, fillGuideFeatureContent } from "./guide-demo";

// 가이드가 단계별로 '하나씩' 켜고 끄는 데모 기능 토글들.
// (header 는 항상 필요하므로 제외 — 여기 목록만 단계마다 초기화된다.)
const GUIDE_FEATURE_FLAGS = [
    "location",
    "bottomFixed",
    "quickConnect",
    "fixedImage",
    "popup",
    "countdown",
    "advanced",
] as const;

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
                    {/* useSearchParams() 가 prod build prerender 에서 CSR bailout 되려면
                        Suspense 안에 있어야 함 (Next.js 16) */}
                    <Suspense fallback={null}>
                        <SettingPageInner />
                    </Suspense>
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
    const [activeTab, setActiveTab] = useState<TabKey>("info");
    const [pane, setPane] = useState<Pane>("editor");
    const [guideOpen, setGuideOpen] = useState(false);
    // 편집 중 '가이드' 버튼으로 가이드를 열 때, 열기 직전 편집 상태를 저장했다가
    // 닫을 때 그대로 복원해 내용이 유실되지 않게 한다. (첫 방문 자동 실행은 편집 전이라
    // 스냅샷 없이 서버 설정으로 폴백한다.)
    const preGuideRef = useRef<Settings | null>(null);
    // 처음 방문 시 가이드를 자동으로 한 번 띄운다. 닫으면 플래그를 저장해 다시 뜨지 않음.
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (!localStorage.getItem(GUIDE_SEEN_KEY)) setGuideOpen(true);
        } catch {
            /* localStorage 접근 불가 시 무시 */
        }
    }, []);
    // 미리보기에서 클릭한 섹션을 페이지 구성 탭에서 스크롤·강조하기 위한 대기 상태.
    const [pendingFocus, setPendingFocus] = useState<{
        id: string;
        n: number;
    } | null>(null);
    const focusNonceRef = useRef(0);
    // 미리보기에서 클릭한 헤더/푸터/위치 등 아코디언을 열고 강조하기 위한 상태.
    const [editorFocus, setEditorFocus] = useState<EditorFocus>(null);

    // 페이지 선택 공통 진입점. 하위 페이지 컨테이너(childrenEnabled + children)는
    // 자체 내용이 없으므로 선택 시 첫 하위 페이지로 대신 이동한다.
    const selectPage = useCallback(
        (id: string | null) => {
            if (id) {
                const page = s.subPages.find((p) => p.id === id);
                if (page?.childrenEnabled && (page.children?.length ?? 0) > 0) {
                    setCurrentPageId(page.children![0].id);
                    return;
                }
            }
            setCurrentPageId(id);
        },
        [s.subPages],
    );

    // 탭 전환 시 편집 대상 페이지 맞춤:
    // - 메인페이지 탭 → 메인(null) 으로 (미리보기도 메인 표시)
    // - 서브페이지 탭 → 선택된 서브페이지가 없으면 첫 서브페이지 자동 선택
    const handleTabChange = useCallback(
        (tab: TabKey) => {
            if (tab === "main") {
                setCurrentPageId(null);
            } else if (tab === "subpages" && !currentPageId && s.subPages.length) {
                selectPage(s.subPages[0].id);
            }
            setActiveTab(tab);
        },
        [currentPageId, s.subPages, selectPage],
    );

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

    // 가이드를 열면 편집 내용과 무관하게 시연용 예시(풀옵션 템플릿 + 예시 이미지/마감일)로
    // 교체한다. 저장 전이라 실제 반영은 없다. 백엔드 설정 로드가 데모를 덮어쓰지 않도록
    // 로드가 끝난 뒤(그리고 로드가 갱신될 때마다) 적용한다. (이 effect 는 load 이후에 선언)
    useEffect(() => {
        if (!guideOpen) return;
        if (domain && settingsQuery.isPending) return; // 서버 로드 중이면 끝난 뒤
        const demo = TEMPLATES.find((t) => t.id === "multipage") ?? TEMPLATES[0];
        if (!demo) return;
        /* eslint-disable react-hooks/set-state-in-effect */
        setS({ ...withGuideDemoExtras(demo.build()), domain: domain ?? "" });
        setCurrentPageId(null);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [guideOpen, domain, settingsQuery.data, settingsQuery.isPending]);

    // 가이드를 닫으면 데모로 바꿨던 편집 내용을 되돌린다.
    // 열기 직전 스냅샷이 있으면 그대로 복원(편집 중 열었어도 유실 없음),
    // 없으면 서버 설정 → 초기 설정 순으로 폴백한다.
    const closeGuide = useCallback(() => {
        setGuideOpen(false);
        try {
            localStorage.setItem(GUIDE_SEEN_KEY, "1");
        } catch {
            /* 무시 */
        }
        const snap = preGuideRef.current;
        preGuideRef.current = null;
        if (snap) {
            setS(snap);
        } else if (domain && settingsQuery.data) {
            setS({ ...settingsQuery.data, domain });
        } else {
            setS({ ...initialSettings, domain: domain ?? "" });
        }
        setCurrentPageId(null);
    }, [domain, settingsQuery.data]);

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

    const handleApplyTemplate = useCallback(
        async (id: string) => {
            const tpl = TEMPLATES.find((t) => t.id === id);
            if (!tpl) return;
            const ok = await confirm({
                title: `'${tpl.name}' 템플릿을 적용할까요?`,
                message:
                    "현재 편집 중인 내용이 템플릿으로 교체됩니다. 되돌릴 수 없습니다.",
                confirmLabel: "적용",
                danger: true,
            });
            if (!ok) return;
            // 도메인은 현재 사이트 값을 유지 (템플릿이 덮어쓰지 않도록).
            setS({ ...tpl.build(), domain: s.domain });
            setCurrentPageId(null);
            toast.show(`'${tpl.name}' 템플릿을 적용했습니다.`, "info");
        },
        [confirm, s.domain, toast],
    );

    // 미리보기에서 특정 영역 클릭 → 해당 편집 탭으로 이동.
    const handleEditPart = useCallback((part: string) => {
        setPane("editor"); // 모바일: 미리보기 → 편집 창으로 전환
        if (part.startsWith("section:")) {
            const id = part.slice("section:".length);
            // 현재 미리보기가 메인이면 '메인페이지' 탭, 서브페이지면 '서브페이지' 탭.
            setActiveTab(currentPageId ? "subpages" : "main");
            focusNonceRef.current += 1;
            // 콘텐츠 아코디언은 기본 닫힘 상태이므로 먼저 열어야 섹션이 렌더된다.
            // (focusScroll=false 라 아코디언 강조는 생략되고, 아래 pendingFocus 가
            // 해당 섹션이 그려질 때까지 재시도하며 스크롤 + 강조한다.)
            setEditorFocus({ anchor: "sections", nonce: focusNonceRef.current });
            setPendingFocus({ id, n: focusNonceRef.current });
            return;
        }
        // 나머지 영역: 해당 탭으로 이동 + 그 아코디언을 열고 강조 (anchor 로 매칭).
        const focusAnchor = (anchor: string, tab: TabKey) => {
            setActiveTab(tab);
            focusNonceRef.current += 1;
            setEditorFocus({ anchor, nonce: focusNonceRef.current });
        };
        if (part === "location") return focusAnchor("location", "info");
        if (part === "header") return focusAnchor("header", "header");
        if (part === "footer" || part === "bottom")
            return focusAnchor(part, "footer");
        if (part === "countdown") return focusAnchor("countdown", "fixed");
        if (part === "popup") return focusAnchor("popup", "fixed");
        if (part === "fiximage") return focusAnchor("fiximage", "fixed");
    }, [currentPageId]);

    // 클릭한 섹션이 페이지 구성 탭에 렌더될 때까지 재시도하며 스크롤 + 강조.
    useEffect(() => {
        if (!pendingFocus) return;
        let attempts = 0;
        let timer = 0;
        const tryFocus = () => {
            const el = document.querySelector(
                `[data-section-id="${pendingFocus.id}"]`,
            ) as HTMLElement | null;
            if (el) {
                // 양식폼처럼 뷰포트보다 긴 섹션은 가운데 정렬 시 상단이 잘려
                // 어색하므로 상단(start)에 맞춰 스크롤한다. 짧은 섹션만 가운데로.
                const tall = el.getBoundingClientRect().height >
                    window.innerHeight * 0.8;
                el.scrollIntoView({
                    behavior: "smooth",
                    block: tall ? "start" : "center",
                });
                el.style.outline = "2px solid #2563eb";
                el.style.outlineOffset = "2px";
                window.setTimeout(() => {
                    el.style.outline = "";
                    el.style.outlineOffset = "";
                }, 1600);
                setPendingFocus(null);
                return;
            }
            if (attempts++ < 40) {
                timer = window.setTimeout(tryFocus, 25);
            } else {
                setPendingFocus(null);
            }
        };
        timer = window.setTimeout(tryFocus, 0);
        return () => window.clearTimeout(timer);
    }, [pendingFocus]);

    // 자동저장 + 임시저장 목록 (localStorage, 서버 미연결 상태 작업 보호)
    const { drafts, autosavedAt, restorable, refreshDrafts, dismissRestore } =
        useDrafts({
            domain,
            s,
            // 가이드(데모 표시) 중에는 자동저장 금지 — 데모가 저장되지 않도록.
            enabled: load.status !== "loading" && !guideOpen,
        });

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
                // 가이드(데모 표시) 중에는 저장 금지 — 데모가 저장되지 않도록.
                if (!guideOpen && !saving && load.status !== "loading")
                    handleSave();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handleSave, saving, load.status, guideOpen]);

    return (
        <AutoFocusContext.Provider value={autoFocus}>
        <DomainContext.Provider value={domain ?? ""}>
            <div className="h-screen flex flex-col lg:grid lg:grid-cols-[1fr_1fr] bg-slate-50 suit overflow-hidden">
                <GuideButton
                    onClick={() => {
                        // 편집 중 열 수 있으므로 현재 편집 상태를 스냅샷 후 연다.
                        preGuideRef.current = s;
                        setGuideOpen(true);
                    }}
                />
                <GuideTour
                    open={guideOpen}
                    onClose={closeGuide}
                    onLocate={(loc) => {
                        if (!loc) return;
                        if (loc.pane) setPane(loc.pane);
                        if (loc.tab) setActiveTab(loc.tab as TabKey);
                        // 단계마다 미리보기 크기를 지정값(없으면 PC)으로 되돌린다.
                        // → 2단계에서 모바일을 골라도 다음 단계는 PC로 진행.
                        setMode(loc.mode ?? "pc");
                        if (loc.open) {
                            // 해당 아코디언을 열어 내용을 펼쳐 보여준다(미리보기 클릭과 동일 경로).
                            focusNonceRef.current += 1;
                            setEditorFocus({
                                anchor: loc.open,
                                nonce: focusNonceRef.current,
                            });
                        }
                        // 기능 토글: 이 단계에서 소개하는 것만 켜고, 나머지 데모 기능은
                        // 꺼서 미리보기에 '한 번에 하나씩'만 보이게 한다. 또한 켠 기능의
                        // 콘텐츠가 비어 있으면(서버의 기존 사이트 등) 데모 값으로 채워 실제로 보이게.
                        setS((prev) => {
                            const enabled = { ...prev.enabled };
                            const on = new Set(loc.enable ?? []);
                            let changed = false;
                            for (const k of GUIDE_FEATURE_FLAGS) {
                                const want = on.has(k);
                                if (enabled[k] !== want) {
                                    enabled[k] = want;
                                    changed = true;
                                }
                            }
                            const next = changed ? { ...prev, enabled } : prev;
                            return fillGuideFeatureContent(next, loc.enable ?? []);
                        });
                    }}
                    onDemoEdit={handleEditPart}
                />
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
                        <PreviewClickHint />
                        <div data-guide="preview-mode">
                            <PreviewModeToggle mode={mode} onChange={setMode} />
                        </div>
                        <div data-guide="preview" className="w-full flex justify-center">
                            <Preview
                                s={s}
                                mode={mode}
                                currentPageId={currentPageId}
                                onNavigate={selectPage}
                                onEditPart={handleEditPart}
                            />
                        </div>
                        <div data-guide="autofocus">
                            <AutoFocusToggle
                                value={autoFocus}
                                onChange={setAutoFocus}
                            />
                        </div>
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
                            <div className="flex items-center gap-2 shrink-0">
                                <select
                                    className="input-base text-xs appearance-none bg-white bg-no-repeat pr-7 bg-position-[right_0.5rem_center]"
                                    style={{
                                        backgroundImage:
                                            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
                                    }}
                                    value=""
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        e.currentTarget.value = "";
                                        if (v) handleApplyTemplate(v);
                                    }}
                                    title="템플릿을 골라 편집을 시작하세요"
                                >
                                    <option value="">＋ 템플릿 선택</option>
                                    {TEMPLATES.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    onClick={handleReset}
                                >
                                    초기화
                                </button>
                            </div>
                        </div>
                        <div data-guide="tabs">
                            <EditorTabs
                                activeTab={activeTab}
                                onChange={handleTabChange}
                            />
                        </div>
                        {activeTab === "subpages" ? (
                            <div data-guide="page-selector">
                                <PageSelector
                                    subPages={s.subPages}
                                    currentPageId={currentPageId}
                                    onSelect={selectPage}
                                />
                            </div>
                        ) : null}
                    </div>

                    <div
                        data-guide="editor-body"
                        className="flex-1 min-h-0 min-w-0 overflow-y-auto editor-scroll py-4 px-3 sm:px-4 relative"
                    >
                        <EditorFocusContext.Provider value={editorFocus}>
                            <EditorPanel
                                s={s}
                                setS={setS}
                                currentPageId={currentPageId}
                                setCurrentPageId={selectPage}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                            />
                        </EditorFocusContext.Provider>
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
                                autosaveAt={
                                    load.status !== "loading" && restorable
                                        ? restorable.savedAt
                                        : null
                                }
                                onRestoreAutosave={handleRestoreAutosave}
                            />
                            <AutosaveStatus savedAt={autosavedAt} />
                        </div>
                        <button
                            type="button"
                            data-guide="save"
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

function PreviewClickHint() {
    return (
        <div className="flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-2 text-xs sm:text-[13px] text-blue-700 max-w-full text-center">
            <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 13l6 6"
                />
            </svg>
            <span className="leading-snug">
                수정할 곳을 <b className="font-semibold">클릭</b>하면 오른쪽에서
                바로 편집할 수 있어요
            </span>
        </div>
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
