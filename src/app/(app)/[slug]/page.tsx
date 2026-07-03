"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { LiveSite } from "@/app/setting/_preview/preview";
import { useDomainFromHost } from "@/lib/use-domain";
import { useSettings } from "@/service/setting";

export default function SubPageRoute() {
    const params = useParams<{ slug: string }>();
    const slug = params?.slug ?? "";
    const domain = useDomainFromHost();
    const q = useSettings(domain);

    const currentPageId = useMemo(() => {
        if (!q.data || !slug) return null;
        const p = q.data.subPages.find((p) => p.slug === slug);
        if (!p) return null;
        // 부모(하부메뉴 활성) 는 자체 컨텐츠 없음 → 첫 자식으로 렌더.
        // (URL 리다이렉트가 아니라 currentPageId 만 자식으로 바꿔 sections 를 첫 자식으로.)
        if (p.childrenEnabled && p.children && p.children.length > 0) {
            return p.children[0].id;
        }
        return p.id;
    }, [q.data, slug]);

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
    if (!currentPageId) {
        return (
            <CenteredMessage>
                <strong>페이지를 찾을 수 없습니다</strong>
                <span className="block text-sm text-slate-500 mt-1">
                    /{slug}
                </span>
            </CenteredMessage>
        );
    }

    return <LiveSite s={q.data} currentPageId={currentPageId} />;
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1 items-center justify-center min-h-dvh text-slate-700">
            <div className="text-center">{children}</div>
        </div>
    );
}
