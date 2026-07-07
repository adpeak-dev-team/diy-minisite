"use client";

import { useState } from "react";
import { MenuItem, SubPage, uid } from "../types";
import { useConfirm } from "../_ui/modal";
import { useToast } from "../_ui/toast";

export function SubPagesEditor({
    items,
    onChange,
    menus,
    onChangeMenus,
    currentPageId,
    onSelectPage,
}: {
    items: SubPage[];
    onChange: (next: SubPage[]) => void;
    menus: MenuItem[];
    onChangeMenus: (next: MenuItem[]) => void;
    currentPageId: string | null;
    onSelectPage: (next: string | null) => void;
}) {
    const toast = useToast();
    const confirm = useConfirm();
    const [slug, setSlug] = useState("");
    const [title, setTitle] = useState("");

    const add = () => {
        const s = slug.trim().replace(/^\/+/, "").replace(/\s+/g, "-");
        const t = title.trim();
        if (!s) {
            toast.show("주소(slug)를 입력해주세요.", "error");
            return;
        }
        if (items.some((p) => p.slug === s)) {
            toast.show("이미 존재하는 주소입니다.", "error");
            return;
        }
        onChange([...items, { id: uid(), slug: s, title: t, sections: [] }]);
        // 헤더 메뉴에도 같은 slug 항목이 없으면 자동 추가.
        // (있으면 patch 의 동기화 규칙대로 다른 곳에서 갱신될 수 있어 건드리지 않음)
        if (!menus.some((m) => m.linkType === "subpage" && m.link === s)) {
            onChangeMenus([
                ...menus,
                { id: uid(), name: t || s, link: s, linkType: "subpage" },
            ]);
        }
        setSlug("");
        setTitle("");
        toast.show(`/${s} 페이지가 추가되었습니다.`);
    };

    const remove = async (p: SubPage) => {
        const ok = await confirm({
            title: `/${p.slug} 페이지 삭제`,
            message: "이 서브페이지와 모든 섹션이 삭제됩니다. 되돌릴 수 없습니다.",
            confirmLabel: "삭제",
            danger: true,
        });
        if (!ok) return;
        if (currentPageId === p.id) onSelectPage(null);
        onChange(items.filter((x) => x.id !== p.id));
        // 매칭되는 헤더 메뉴 항목도 함께 제거 (add 의 역연산)
        onChangeMenus(
            menus.filter(
                (m) => !(m.linkType === "subpage" && m.link === p.slug),
            ),
        );
    };

    // 서브페이지 patch + 매칭되는 헤더 메뉴 항목 자동 동기화.
    // 메뉴와 서브페이지는 slug 로 연결됨 (menu.link === subPage.slug, linkType === "subpage")
    // - title 변경 → 매칭 메뉴의 name 갱신
    // - slug 변경 → 매칭 메뉴의 link 갱신 (옛 slug 로 매칭한 뒤 새 slug 로 교체)
    const patch = (id: string, p: Partial<SubPage>) => {
        const prev = items.find((x) => x.id === id);
        onChange(items.map((x) => (x.id === id ? { ...x, ...p } : x)));

        if (!prev) return;
        const prevSlug = prev.slug;
        if (!menus.some((m) => m.linkType === "subpage" && m.link === prevSlug)) {
            return;
        }
        onChangeMenus(
            menus.map((m) => {
                if (m.linkType !== "subpage" || m.link !== prevSlug) return m;
                return {
                    ...m,
                    name: p.title !== undefined ? p.title : m.name,
                    link: p.slug !== undefined ? p.slug : m.link,
                };
            }),
        );
    };

    const normalizeSlug = (id: string, raw: string) => {
        const cleaned = raw.trim().replace(/^\/+/, "").replace(/\s+/g, "-");
        if (!cleaned) {
            toast.show("주소(slug)는 비울 수 없습니다.", "error");
            return;
        }
        if (items.some((x) => x.id !== id && x.slug === cleaned)) {
            toast.show("이미 존재하는 주소입니다.", "error");
            return;
        }
        if (cleaned !== items.find((x) => x.id === id)?.slug) {
            patch(id, { slug: cleaned });
        }
    };

    return (
        <div>
            <div className="flex gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1 flex-1 min-w-40">
                    <span className="text-sm text-slate-400 font-mono">/</span>
                    <input
                        type="text"
                        className="input-base flex-1 font-mono"
                        placeholder="about"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                    />
                </div>
                <input
                    type="text"
                    className="input-base flex-1 min-w-32"
                    placeholder="페이지 제목 (선택)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            add();
                        }
                    }}
                />
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={add}
                >
                    추가
                </button>
            </div>
            {items.length > 0 ? (
                <ul className="space-y-1.5">
                    {items.map((p) => {
                        const active = currentPageId === p.id;
                        return (
                            <li
                                key={p.id}
                                className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${
                                    active
                                        ? "bg-blue-50 border-blue-200"
                                        : "bg-slate-50 border-slate-200"
                                }`}
                            >
                                <div className="flex items-center gap-0.5 shrink-0">
                                    <span className="text-xs font-mono text-blue-600">
                                        /
                                    </span>
                                    <input
                                        type="text"
                                        className="input-base text-xs font-mono w-24"
                                        value={p.slug}
                                        onChange={(e) =>
                                            patch(p.id, { slug: e.target.value })
                                        }
                                        onBlur={(e) =>
                                            normalizeSlug(p.id, e.target.value)
                                        }
                                    />
                                </div>
                                <input
                                    type="text"
                                    className="input-base text-xs flex-1 min-w-0"
                                    placeholder="페이지 제목"
                                    value={p.title}
                                    onChange={(e) =>
                                        patch(p.id, { title: e.target.value })
                                    }
                                />
                                <span className="text-[10px] text-slate-400 shrink-0">
                                    섹션 {p.sections.length}개
                                </span>
                                <button
                                    type="button"
                                    className={`shrink-0 btn btn-xs ${
                                        active ? "btn-primary" : "btn-outline"
                                    }`}
                                    onClick={() =>
                                        onSelectPage(active ? null : p.id)
                                    }
                                >
                                    {active ? "편집 중" : "디자인 편집"}
                                </button>
                                <button
                                    type="button"
                                    className="shrink-0 text-slate-400 hover:text-red-500 text-sm"
                                    onClick={() => remove(p)}
                                    aria-label="삭제"
                                >
                                    ×
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-300 rounded-lg">
                    아직 추가된 서브페이지가 없습니다. 예: <code>about</code> 입력 시{" "}
                    <code>/about</code> 라우트가 됩니다.
                </div>
            )}
        </div>
    );
}
