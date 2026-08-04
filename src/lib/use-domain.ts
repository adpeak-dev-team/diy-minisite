"use client";

import { useSyncExternalStore } from "react";

// 호스트명에서 의미있는 서브도메인을 뽑아낸다.
// proxy.ts 의 hasMeaningfulSubdomain 과 동일 규칙:
// - 점(.) 없으면 null (localhost 단독)
// - 첫 세그먼트가 'www' 또는 IP 면 null
//
// 호스트명은 대소문자를 구분하지 않으므로 소문자로 정규화한다 (proxy.ts 와 동일).
// 브라우저가 이미 소문자로 만들어 주지만, 규칙을 여기 명시해 두어야
// ld_domain 에 대문자가 섞인 행과 비교할 때 어느 쪽 기준인지 헷갈리지 않는다.
export function domainFromHostname(hostname: string): string | null {
    const host = hostname.toLowerCase();
    if (!host.includes(".")) return null;
    const first = host.split(".")[0];
    if (!first || first === "www" || /^\d+$/.test(first)) return null;
    return first;
}

// 호스트는 페이지 수명 동안 바뀌지 않으므로 구독은 no-op.
const subscribe = () => () => {};

function getSnapshot(): string | null {
    return domainFromHostname(window.location.hostname);
}

// 서버에는 window 가 없다 → null. 하이드레이션 후 클라이언트 값으로 전환된다.
function getServerSnapshot(): null {
    return null;
}

// window.location.hostname 에서 서브도메인을 읽는다.
// useEffect + setState 대신 useSyncExternalStore 를 쓰는 이유:
// effect 안에서 setState 하면 렌더 → effect → setState → 재렌더로 커밋이 한 번 더 돌고
// (react-hooks/set-state-in-effect 경고), 그 사이 한 프레임이 빈 화면으로 남는다.
export function useDomainFromHost(): string | null {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
