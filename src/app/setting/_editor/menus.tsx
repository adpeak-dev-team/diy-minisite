"use client";

import { useState } from "react";
import { MenuItem, SubPage, uid } from "../types";
import { useToast } from "../_ui/toast";

export function MenuItemsEditor({
    items,
    onChange,
    subPages,
}: {
    items: MenuItem[];
    onChange: (next: MenuItem[]) => void;
    subPages?: SubPage[];
}) {
    const toast = useToast();
    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [linkType, setLinkType] = useState<"url" | "subpage">("url");
    const pages = subPages ?? [];

    const add = () => {
        const n = name.trim();
        const l = link.trim();
        if (!n || !l) {
            toast.show("메뉴 이름과 링크를 모두 입력해주세요.", "error");
            return;
        }
        onChange([...items, { id: uid(), name: n, link: l, linkType }]);
        setName("");
        setLink("");
    };

    return (
        <div>
            <div className="flex gap-2 mb-2 flex-wrap">
                <input
                    type="text"
                    className="input-base flex-1 min-w-32"
                    placeholder="메뉴 이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                {pages.length > 0 ? (
                    <select
                        className="input-base text-xs"
                        value={linkType}
                        onChange={(e) => {
                            const v = e.target.value as "url" | "subpage";
                            setLinkType(v);
                            setLink("");
                        }}
                    >
                        <option value="url">URL</option>
                        <option value="subpage">서브페이지</option>
                    </select>
                ) : null}
                {linkType === "subpage" && pages.length > 0 ? (
                    <select
                        className="input-base flex-1 min-w-32"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                    >
                        <option value="">- 서브페이지 선택 -</option>
                        {pages.map((p) => (
                            <option key={p.id} value={p.slug}>
                                /{p.slug} {p.title ? `· ${p.title}` : ""}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        className="input-base flex-1 min-w-32"
                        placeholder="https://... 또는 /slug"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                add();
                            }
                        }}
                    />
                )}
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={add}
                >
                    추가
                </button>
            </div>
            {items.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {items.map((m) => {
                        const isSub = m.linkType === "subpage";
                        const display = isSub ? `/${m.link}` : m.link;
                        return (
                            <span
                                key={m.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-xs text-slate-700"
                                title={display}
                            >
                                {isSub ? (
                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1 rounded">
                                        SUB
                                    </span>
                                ) : null}
                                {m.name}
                                <button
                                    type="button"
                                    className="text-slate-400 hover:text-red-500"
                                    onClick={() =>
                                        onChange(items.filter((x) => x.id !== m.id))
                                    }
                                    aria-label="삭제"
                                >
                                    ×
                                </button>
                            </span>
                        );
                    })}
                </div>
            ) : (
                <div className="text-[11px] text-slate-400 py-2">
                    추가된 메뉴가 없습니다.
                </div>
            )}
        </div>
    );
}
