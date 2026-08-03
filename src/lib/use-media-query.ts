"use client";

import { useCallback, useSyncExternalStore } from "react";

// CSS 미디어쿼리 결과를 구독한다.
// useEffect + setState 대신 useSyncExternalStore 를 쓰는 이유는 use-domain.ts 와 동일:
// effect 안에서 setState 하면 커밋이 한 번 더 돌고 그 사이 한 프레임이 어긋난다.
// 서버 스냅샷은 항상 false — 모바일 우선(narrow)이 기본값이다.
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const mq = window.matchMedia(query);
            mq.addEventListener("change", onChange);
            return () => mq.removeEventListener("change", onChange);
        },
        [query],
    );
    const getSnapshot = useCallback(
        () => window.matchMedia(query).matches,
        [query],
    );
    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
