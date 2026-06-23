// 브라우저 localStorage 기반 임시저장 계층 (서버 미연결 상태에서 작업 보호용).
// - autosave: domain 별 1슬롯, 편집 중 자동 백업 → 새로고침/크래시 복구
// - 명명 임시저장(draft): 사용자가 수동으로 만든 체크포인트 목록

import { Settings, uid } from "../types";

const AUTOSAVE_PREFIX = "minisite:autosave:";
const DRAFTS_KEY = "minisite:drafts";
const MAX_DRAFTS = 30;

export type AutosaveEntry = { savedAt: number; settings: Settings };
export type Draft = {
    id: string;
    name: string;
    domain: string | null;
    savedAt: number;
    settings: Settings;
};

const hasStorage = () => typeof window !== "undefined" && !!window.localStorage;

function read<T>(key: string, fallback: T): T {
    if (!hasStorage()) return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function write(key: string, value: unknown): boolean {
    if (!hasStorage()) return false;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        // QuotaExceeded 등 — 조용히 실패 (자동저장이 편집을 막으면 안 됨)
        return false;
    }
}

const autosaveKey = (domain: string | null) =>
    AUTOSAVE_PREFIX + (domain ?? "__local");

// === autosave (domain 당 1슬롯) ===

export function readAutosave(domain: string | null): AutosaveEntry | null {
    return read<AutosaveEntry | null>(autosaveKey(domain), null);
}

export function writeAutosave(domain: string | null, settings: Settings): boolean {
    return write(autosaveKey(domain), { savedAt: Date.now(), settings });
}

export function clearAutosave(domain: string | null): void {
    if (!hasStorage()) return;
    try {
        window.localStorage.removeItem(autosaveKey(domain));
    } catch {
        /* noop */
    }
}

// === 명명 임시저장 목록 ===

export function listDrafts(): Draft[] {
    const all = read<Draft[]>(DRAFTS_KEY, []);
    return Array.isArray(all)
        ? [...all].sort((a, b) => b.savedAt - a.savedAt)
        : [];
}

export function saveDraft(
    domain: string | null,
    name: string,
    settings: Settings,
): Draft {
    const draft: Draft = {
        id: uid(),
        name: name.trim() || "이름 없는 저장",
        domain,
        savedAt: Date.now(),
        settings,
    };
    const next = [draft, ...listDrafts()].slice(0, MAX_DRAFTS);
    write(DRAFTS_KEY, next);
    return draft;
}

export function deleteDraft(id: string): void {
    write(
        DRAFTS_KEY,
        listDrafts().filter((d) => d.id !== id),
    );
}
