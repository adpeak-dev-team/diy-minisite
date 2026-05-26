"use client";

import { useCallback, useState } from "react";
import { EditorPanel, EditorTabs, TabKey } from "./_editor/panel";
import { Preview, PreviewMode } from "./_preview/preview";
import { ModalProvider, useConfirm } from "./_ui/modal";
import { ToastProvider, useToast } from "./_ui/toast";
import { initialSettings, Settings } from "./types";
import { AutoFocusContext } from "./widgets";

export default function SettingPage() {
    return (
        <ToastProvider>
            <ModalProvider>
                <SettingPageInner />
            </ModalProvider>
        </ToastProvider>
    );
}

type Pane = "editor" | "preview";

function SettingPageInner() {
    const toast = useToast();
    const confirm = useConfirm();
    const [s, setS] = useState<Settings>(initialSettings);
    const [autoFocus, setAutoFocus] = useState(true);
    const [mode, setMode] = useState<PreviewMode>("pc");
    const [currentPageId, setCurrentPageId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("basic");
    const [pane, setPane] = useState<Pane>("editor");

    const handleSave = useCallback(() => {
        console.log("save", s);
        toast.show("저장되었습니다.");
    }, [s, toast]);

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

    return (
        <AutoFocusContext.Provider value={autoFocus}>
            <div className="h-screen flex flex-col lg:grid lg:grid-cols-[1fr_1fr] bg-slate-50 pretendard overflow-hidden">
                {/* Mobile-only pane toggle */}
                <div className="lg:hidden shrink-0 px-3 py-2 bg-white border-b border-slate-200 flex justify-center">
                    <PaneTabs pane={pane} onChange={setPane} />
                </div>

                {/* Left: Preview */}
                <div
                    className={`${
                        pane === "preview" ? "flex" : "hidden"
                    } lg:flex flex-1 min-h-0 lg:h-screen flex-col items-center p-4 sm:p-6 overflow-auto`}
                >
                    <div className="flex flex-col items-center gap-5 my-auto min-w-fit">
                        <PreviewModeToggle mode={mode} onChange={setMode} />
                        <Preview s={s} mode={mode} currentPageId={currentPageId} />
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
                    } lg:flex flex-1 min-h-0 lg:h-screen flex-col bg-white`}
                >
                    <div className="shrink-0">
                        <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                                    랜딩페이지 편집
                                </h1>
                                <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                                    좌측 미리보기로 결과를 즉시 확인할 수 있습니다
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
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto editor-scroll py-4 px-3 sm:px-4">
                        <EditorPanel
                            s={s}
                            setS={setS}
                            currentPageId={currentPageId}
                            setCurrentPageId={setCurrentPageId}
                            activeTab={activeTab}
                        />
                    </div>

                    <div className="shrink-0 p-3 border-t border-slate-100">
                        <button
                            type="button"
                            className="btn btn-primary w-full py-3"
                            onClick={handleSave}
                        >
                            저장
                        </button>
                    </div>
                </div>
            </div>
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
