"use client";

import { useEffect, useRef, useState } from "react";
import { Settings } from "../types";
import {
    AutosaveEntry,
    Draft,
    listDrafts,
    readAutosave,
    writeAutosave,
} from "./drafts";

// 시간 표기 (외부 라이브러리 없이)
export function formatRelative(ts: number): string {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return "방금";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    return `${Math.floor(hr / 24)}일 전`;
}

function formatStamp(ts: number): string {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 자동저장 + 임시저장 목록 상태 관리.
// domain 이 바뀌면 복원 가능한 자동저장본을 즉시 스냅샷으로 잡아둔다(이후 덮어써져도 안전).
export function useDrafts({
    domain,
    s,
    enabled,
}: {
    domain: string | null;
    s: Settings;
    enabled: boolean;
}) {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [autosavedAt, setAutosavedAt] = useState<number | null>(null);
    const [restorable, setRestorable] = useState<AutosaveEntry | null>(null);

    // localStorage 는 클라이언트 전용이라 마운트/도메인 변경 후 effect 에서 읽는다
    // (lazy initializer 로 읽으면 SSR 값과 달라 hydration mismatch 발생).
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        setDrafts(listDrafts());
        setRestorable(readAutosave(domain));
        setAutosavedAt(null);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [domain]);

    // 편집 변경 시 디바운스 자동저장
    useEffect(() => {
        if (!enabled) return;
        const t = setTimeout(() => {
            if (writeAutosave(domain, s)) setAutosavedAt(Date.now());
        }, 1000);
        return () => clearTimeout(t);
    }, [s, domain, enabled]);

    return {
        drafts,
        autosavedAt,
        restorable,
        refreshDrafts: () => setDrafts(listDrafts()),
        dismissRestore: () => setRestorable(null),
    };
}

export function AutosaveStatus({ savedAt }: { savedAt: number | null }) {
    // 1분마다 상대시간 갱신
    const [, tick] = useState(0);
    useEffect(() => {
        if (savedAt == null) return;
        const id = setInterval(() => tick((n) => n + 1), 30_000);
        return () => clearInterval(id);
    }, [savedAt]);

    if (savedAt == null) {
        return <span className="text-[11px] text-slate-400">자동 저장 대기</span>;
    }
    return (
        <span className="text-[11px] text-slate-400">
            자동 저장됨 · {formatRelative(savedAt)}
        </span>
    );
}

export function RestoreBanner({
    entry,
    onRestore,
    onDismiss,
}: {
    entry: AutosaveEntry;
    onRestore: () => void;
    onDismiss: () => void;
}) {
    return (
        <div className="absolute inset-x-3 top-3 z-10 rounded-lg border border-blue-300 bg-blue-50 p-3 text-xs text-blue-900 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="font-medium">자동 저장된 작업이 있습니다</div>
                    <div className="text-blue-700/80 mt-0.5">
                        {formatStamp(entry.savedAt)} 기준 · 복원하시겠어요?
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={onRestore}
                    >
                        복원
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={onDismiss}
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}

export function DraftsMenu({
    drafts,
    onSave,
    onRestore,
    onDelete,
}: {
    drafts: Draft[];
    onSave: () => void;
    onRestore: (d: Draft) => void;
    onDelete: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    return (
        <div className="relative flex items-center gap-1.5" ref={ref}>
            <button
                type="button"
                className="btn btn-secondary btn-sm flex-1"
                onClick={onSave}
            >
                임시저장
            </button>
            <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                불러오기 ({drafts.length})
            </button>

            {open ? (
                <div className="absolute bottom-full right-0 mb-2 w-80 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg p-2 z-20">
                    {drafts.length === 0 ? (
                        <div className="text-xs text-slate-400 text-center py-6">
                            저장된 임시본이 없습니다.
                            <br />
                            &quot;임시저장&quot;으로 현재 상태를 보관하세요.
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {drafts.map((d) => (
                                <li
                                    key={d.id}
                                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium text-slate-800 truncate">
                                            {d.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <span>{formatStamp(d.savedAt)}</span>
                                            {d.domain ? (
                                                <span className="font-mono truncate">
                                                    · {d.domain}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs shrink-0"
                                        onClick={() => {
                                            onRestore(d);
                                            setOpen(false);
                                        }}
                                    >
                                        복원
                                    </button>
                                    <button
                                        type="button"
                                        className="text-slate-300 hover:text-red-500 text-base leading-none shrink-0 px-1"
                                        onClick={() => onDelete(d.id)}
                                        aria-label="삭제"
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}
        </div>
    );
}
