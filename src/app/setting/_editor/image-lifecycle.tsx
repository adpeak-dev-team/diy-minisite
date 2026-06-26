"use client";

// 이미지 라이프사이클 트래커.
//
// 두 가지 상태를 추적:
//   - orphans: 이번 세션에 업로드했지만 아직 "저장" 안 된 GCS 객체 경로들
//     → 페이지 언로드 시 (sendBeacon) 또는 같은 슬롯 교체/X 시 즉시 삭제 대상
//   - pendingDelete: DB 에 이미 저장돼있던 이미지 중 X 또는 교체된 것들
//     → 저장(commit) 시 GCS 에서 삭제
//
// 호출 패턴:
//   - 업로드 직후 → markUploaded(path)
//   - 슬롯에서 빠지는 기존 값 → markRemoved(path)
//   - 저장 성공 후 → commit()
//   - 페이지 떠날 때 → flushOrphansOnUnload() (beforeunload 핸들러에서)

import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
} from "react";
import {
    cleanupImagesBeacon,
    deleteImages,
    urlToGcsPath,
} from "../api";

type ImageLifecycleContextValue = {
    markUploaded: (urlOrPath: string) => void;
    markRemoved: (urlOrPath: string) => void;
    commit: () => Promise<void>;
    flushOrphansOnUnload: () => void;
};

const ImageLifecycleContext = createContext<ImageLifecycleContextValue | null>(
    null,
);

function toPath(urlOrPath: string): string | null {
    // 풀 URL 이면 GCS 경로 추출, 이미 경로 형태면 그대로.
    const path = urlToGcsPath(urlOrPath);
    if (path) return path;
    // "domain/file.ext" 같이 슬래시 들어간 단순 경로 허용
    if (/^[a-z0-9-]+\/[^/]+$/i.test(urlOrPath)) return urlOrPath;
    return null;
}

export function ImageLifecycleProvider({ children }: { children: ReactNode }) {
    // ref 로 들고 가는 이유: setState 로 관리하면 매번 리렌더가 일어나
    //   ImageUploader 가 다시 마운트되며 input 포커스가 풀리는 등 부작용이 큼.
    //   라이프사이클 정보는 UI 에 직접 노출 안 함 (commit/unload 시점에만 필요).
    const orphansRef = useRef<Set<string>>(new Set());
    const pendingDeleteRef = useRef<Set<string>>(new Set());

    const markUploaded = useCallback((urlOrPath: string) => {
        const p = toPath(urlOrPath);
        if (!p) return;
        // 같은 경로가 pendingDelete 에 있었으면 충돌 — 우선 orphans 로
        // (실제로는 동일 경로 발생 불가하지만 안전망)
        pendingDeleteRef.current.delete(p);
        orphansRef.current.add(p);
    }, []);

    const markRemoved = useCallback((urlOrPath: string) => {
        const p = toPath(urlOrPath);
        if (!p) return;
        if (orphansRef.current.has(p)) {
            // 이번 세션에 올린 것 → 저장 전이므로 곧바로 GCS 에서 삭제
            orphansRef.current.delete(p);
            void deleteImages([p]).catch(() => {
                // 실패해도 무시 (다음 페이지 언로드/세션에 재시도 안 됨, 수동 정리 필요)
            });
        } else {
            // DB 에 저장돼있던 값 → 저장 시 함께 삭제
            pendingDeleteRef.current.add(p);
        }
    }, []);

    const commit = useCallback(async () => {
        // 저장 완료된 시점 — orphans 는 이제 정식 저장된 값, pendingDelete 는 진짜 삭제 대상.
        const toDelete = Array.from(pendingDeleteRef.current);
        pendingDeleteRef.current.clear();
        orphansRef.current.clear();
        if (toDelete.length > 0) {
            try {
                await deleteImages(toDelete);
            } catch {
                // 실패 시 조용히 무시 (저장 자체는 성공)
            }
        }
    }, []);

    const flushOrphansOnUnload = useCallback(() => {
        const paths = Array.from(orphansRef.current);
        orphansRef.current.clear();
        if (paths.length > 0) cleanupImagesBeacon(paths);
    }, []);

    const value = useMemo<ImageLifecycleContextValue>(
        () => ({ markUploaded, markRemoved, commit, flushOrphansOnUnload }),
        [markUploaded, markRemoved, commit, flushOrphansOnUnload],
    );

    return (
        <ImageLifecycleContext.Provider value={value}>
            {children}
        </ImageLifecycleContext.Provider>
    );
}

export function useImageLifecycle(): ImageLifecycleContextValue {
    // Provider 밖에서 호출돼도 no-op 으로 동작하게 폴백 — 테스트/스토리북 안전.
    const ctx = useContext(ImageLifecycleContext);
    if (ctx) return ctx;
    return {
        markUploaded: () => {},
        markRemoved: () => {},
        commit: async () => {},
        flushOrphansOnUnload: () => {},
    };
}
