"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// 편집 화면용 디폴트:
// - staleTime: Infinity → 자동 refetch 안 함 (편집중 s 덮어쓰기 방지)
// - refetchOnWindowFocus/Reconnect: false → 같은 이유
// 일반 목록 화면 등에서 짧은 캐시가 필요하면 그 화면에서 useQuery 옵션 오버라이드.
export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: Infinity,
                        refetchOnWindowFocus: false,
                        refetchOnReconnect: false,
                        retry: 1,
                    },
                },
            }),
    );
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
