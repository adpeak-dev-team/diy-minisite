"use client";

import { useEffect, useState } from "react";

// window.location.hostname 에서 의미있는 서브도메인을 뽑아낸다.
// proxy.ts 의 hasMeaningfulSubdomain 과 동일 규칙:
// - 점(.) 없으면 null (localhost 단독)
// - 첫 세그먼트가 'www' 또는 IP 면 null
// SSR-safe 하게 mount 후에 읽음.
export function useDomainFromHost(): string | null {
    const [domain, setDomain] = useState<string | null>(null);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const host = window.location.hostname;
        if (!host.includes(".")) return;
        const first = host.split(".")[0];
        if (!first || first === "www" || /^\d+$/.test(first)) return;
        setDomain(first);
    }, []);
    return domain;
}
