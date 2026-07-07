"use client";

import { LiveSite } from "@/app/setting/_preview/preview";
import { useDomainFromHost } from "@/lib/use-domain";
import { initialSettings } from "@/app/setting/types";
import { useSettings } from "@/service/setting";

const isDev = process.env.NODE_ENV !== "production";

export default function HomePage() {
    const domain = useDomainFromHost();
    const q = useSettings(domain);

    // 개발 환경에서 서브도메인 없이 localhost:5030 로 접근한 경우(domain 없음):
    // 백엔드 없이 UI 만 확인할 수 있도록 기본 설정으로 LiveSite 렌더.
    if (isDev && !domain) {
        return <LiveSite s={initialSettings} currentPageId={null} />;
    }

    // proxy.ts 가 베어 호스트는 이미 막고 있어서 정상 흐름엔 domain 이 있음.
    // mount 직후 1프레임은 null — 그동안은 빈 화면 (깜빡임 방지).
    if (!domain) return null;
    if (q.isPending) return <CenteredMessage>불러오는 중…</CenteredMessage>;
    if (q.isError || !q.data) {
        return (
            <CenteredMessage>
                <strong>사이트를 찾을 수 없습니다</strong>
                <span className="block text-sm text-slate-500 mt-1">
                    /{domain}
                </span>
            </CenteredMessage>
        );
    }

    return <LiveSite s={q.data} currentPageId={null} />;
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1 items-center justify-center min-h-dvh text-slate-700">
            <div className="text-center">{children}</div>
        </div>
    );
}
