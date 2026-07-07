"use client";

import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode, useState } from "react";
import { MenuItem, SubPage, uid } from "../types";
import { useConfirm } from "../_ui/modal";
import { useToast } from "../_ui/toast";

// 메뉴(header.menus)와 서브페이지(subPages)를 하나의 네비게이션 리스트로 통합 관리.
// - 리스트 순서 = header.menus 순서 = 실제 헤더 노출 순서 (드래그 정렬)
// - 각 행: "페이지"(subPage 연결, 디자인 편집 가능) 또는 "외부 링크"(URL)
// - 페이지는 메뉴 노출 on/off 가능 (off 여도 subPage 는 유지 — 라우트는 살아있고 헤더에서만 숨김)
// - 서브페이지 <-> 메뉴 slug 동기화 (이름/주소 변경 시 매칭 메뉴 자동 갱신)

type PageRow = { kind: "page"; menu: MenuItem | null; page: SubPage };
type LinkRow = { kind: "link"; menu: MenuItem };
type Row = PageRow | LinkRow;

function buildRows(menus: MenuItem[], subPages: SubPage[]): Row[] {
    const rows: Row[] = [];
    const usedSlugs = new Set<string>();
    for (const menu of menus) {
        if (menu.linkType === "subpage") {
            const page = subPages.find((p) => p.slug === menu.link);
            if (page) {
                usedSlugs.add(page.slug);
                rows.push({ kind: "page", menu, page });
                continue;
            }
        }
        // URL 링크 또는 대상 페이지가 사라진 subpage 메뉴 → 링크 행으로 취급
        rows.push({ kind: "link", menu });
    }
    // 메뉴에 등록되지 않은 서브페이지(숨김 페이지) 는 맨 아래에.
    for (const page of subPages) {
        if (!usedSlugs.has(page.slug)) {
            rows.push({ kind: "page", menu: null, page });
        }
    }
    return rows;
}

const cleanSlug = (raw: string) =>
    raw.trim().replace(/^\/+/, "").replace(/\s+/g, "-");

export function NavManager({
    menus,
    onChangeMenus,
    subPages,
    onChangeSubPages,
    currentPageId,
    onSelectPage,
}: {
    menus: MenuItem[];
    onChangeMenus: (next: MenuItem[]) => void;
    subPages: SubPage[];
    onChangeSubPages: (next: SubPage[]) => void;
    currentPageId: string | null;
    onSelectPage: (next: string | null) => void;
}) {
    const toast = useToast();
    const confirm = useConfirm();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const rows = buildRows(menus, subPages);
    const menuRows = rows.filter((r) => r.menu !== null);
    const hiddenRows = rows.filter(
        (r): r is PageRow => r.kind === "page" && r.menu === null,
    );

    // ---- 개별 필드 patch (배열은 서로 독립적이라 각자 onChange 호출) ----
    const patchPage = (pageId: string, p: Partial<SubPage>) =>
        onChangeSubPages(
            subPages.map((x) => (x.id === pageId ? { ...x, ...p } : x)),
        );
    const patchMenu = (menuId: string, p: Partial<MenuItem>) =>
        onChangeMenus(menus.map((m) => (m.id === menuId ? { ...m, ...p } : m)));

    // ---- 하위 페이지(children) 관리 — 각 최상위 페이지 행 아래에서 직접 편집 ----
    const patchChild = (
        parentId: string,
        childId: string,
        p: Partial<SubPage>,
    ) =>
        onChangeSubPages(
            subPages.map((x) =>
                x.id === parentId
                    ? {
                          ...x,
                          children: (x.children ?? []).map((c) =>
                              c.id === childId ? { ...c, ...p } : c,
                          ),
                      }
                    : x,
            ),
        );

    const toggleChildrenEnabled = (parentId: string, next: boolean) =>
        patchPage(parentId, { childrenEnabled: next });

    const addChild = (parent: SubPage, rawSlug: string, rawTitle: string) => {
        const cs = cleanSlug(rawSlug);
        if (!cs) {
            toast.show("주소(slug)를 입력해주세요.", "error");
            return false;
        }
        const kids = parent.children ?? [];
        if (kids.some((c) => c.slug === cs)) {
            toast.show("이미 존재하는 하위 페이지 주소입니다.", "error");
            return false;
        }
        patchPage(parent.id, {
            children: [
                ...kids,
                { id: uid(), slug: cs, title: rawTitle.trim(), sections: [] },
            ],
        });
        toast.show(`/${parent.slug}/${cs} 하위 페이지가 추가되었습니다.`);
        return true;
    };

    const normalizeChildSlugOnBlur = (
        parent: SubPage,
        child: SubPage,
        raw: string,
    ) => {
        const cleaned = cleanSlug(raw);
        if (!cleaned) {
            toast.show("주소(slug)는 비울 수 없습니다.", "error");
            return;
        }
        if ((parent.children ?? []).some((c) => c.id !== child.id && c.slug === cleaned)) {
            toast.show("이미 존재하는 하위 페이지 주소입니다.", "error");
            return;
        }
        if (cleaned !== child.slug) patchChild(parent.id, child.id, { slug: cleaned });
    };

    const deleteChild = async (parent: SubPage, child: SubPage) => {
        const ok = await confirm({
            title: `/${parent.slug}/${child.slug} 하위 페이지 삭제`,
            message: "이 하위 페이지와 모든 섹션이 삭제됩니다. 되돌릴 수 없습니다.",
            confirmLabel: "삭제",
            danger: true,
        });
        if (!ok) return;
        if (currentPageId === child.id) onSelectPage(parent.id);
        patchPage(parent.id, {
            children: (parent.children ?? []).filter((c) => c.id !== child.id),
        });
    };

    const renderChildrenPanel = (page: SubPage) => (
        <ChildrenPanel
            parent={page}
            currentPageId={currentPageId}
            onToggle={(v) => toggleChildrenEnabled(page.id, v)}
            onAddChild={(slug, title) => addChild(page, slug, title)}
            onPatchChild={(childId, p) => patchChild(page.id, childId, p)}
            onSlugBlur={(child, raw) => normalizeChildSlugOnBlur(page, child, raw)}
            onDesign={onSelectPage}
            onDelete={(child) => deleteChild(page, child)}
        />
    );

    // 페이지 이름 변경 → subPage.title + 매칭 메뉴 name 동기화
    const renamePage = (row: PageRow, name: string) => {
        patchPage(row.page.id, { title: name });
        if (row.menu) patchMenu(row.menu.id, { name });
    };

    // 페이지 slug 변경 → subPage.slug + 매칭 메뉴 link 동기화 (매 입력마다)
    const changeSlug = (row: PageRow, raw: string) => {
        patchPage(row.page.id, { slug: raw });
        if (row.menu && row.menu.link === row.page.slug) {
            patchMenu(row.menu.id, { link: raw });
        }
    };

    const normalizeSlugOnBlur = (row: PageRow, raw: string) => {
        const cleaned = cleanSlug(raw);
        if (!cleaned) {
            toast.show("주소(slug)는 비울 수 없습니다.", "error");
            return;
        }
        if (subPages.some((x) => x.id !== row.page.id && x.slug === cleaned)) {
            toast.show("이미 존재하는 주소입니다.", "error");
            return;
        }
        if (cleaned !== row.page.slug) changeSlug(row, cleaned);
    };

    // 메뉴 노출 on/off. on: 매칭 메뉴 추가 / off: 매칭 메뉴 제거 (subPage 는 유지)
    const toggleMenu = (row: PageRow) => {
        if (row.menu) {
            onChangeMenus(menus.filter((m) => m.id !== row.menu!.id));
        } else {
            onChangeMenus([
                ...menus,
                {
                    id: uid(),
                    name: row.page.title || row.page.slug,
                    link: row.page.slug,
                    linkType: "subpage",
                },
            ]);
        }
    };

    const deletePage = async (row: PageRow) => {
        const ok = await confirm({
            title: `/${row.page.slug} 페이지 삭제`,
            message: "이 페이지와 모든 섹션이 삭제됩니다. 되돌릴 수 없습니다.",
            confirmLabel: "삭제",
            danger: true,
        });
        if (!ok) return;
        if (currentPageId === row.page.id) onSelectPage(null);
        onChangeSubPages(subPages.filter((x) => x.id !== row.page.id));
        onChangeMenus(
            menus.filter((m) =>
                row.menu
                    ? m.id !== row.menu.id
                    : !(m.linkType === "subpage" && m.link === row.page.slug),
            ),
        );
    };

    const deleteLink = (menuId: string) =>
        onChangeMenus(menus.filter((m) => m.id !== menuId));

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = menus.findIndex((m) => m.id === String(active.id));
        const newIndex = menus.findIndex((m) => m.id === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        onChangeMenus(arrayMove(menus, oldIndex, newIndex));
    };

    const sortableIds = menuRows.map((r) => r.menu!.id);

    return (
        <div className="space-y-3">
            {menuRows.length > 0 ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={sortableIds}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul className="space-y-1.5">
                            {menuRows.map((row) => (
                                <SortableRow
                                    key={row.menu!.id}
                                    id={row.menu!.id}
                                    below={
                                        row.kind === "page"
                                            ? renderChildrenPanel(row.page)
                                            : undefined
                                    }
                                >
                                    {row.kind === "page" ? (
                                        <PageRowBody
                                            row={row}
                                            active={currentPageId === row.page.id}
                                            onRename={(v) => renamePage(row, v)}
                                            onSlugChange={(v) => changeSlug(row, v)}
                                            onSlugBlur={(v) =>
                                                normalizeSlugOnBlur(row, v)
                                            }
                                            onToggleMenu={() => toggleMenu(row)}
                                            onDesign={() =>
                                                onSelectPage(
                                                    currentPageId === row.page.id
                                                        ? null
                                                        : row.page.id,
                                                )
                                            }
                                            onDelete={() => deletePage(row)}
                                        />
                                    ) : (
                                        <LinkRowBody
                                            menu={row.menu}
                                            onName={(v) =>
                                                patchMenu(row.menu.id, { name: v })
                                            }
                                            onUrl={(v) =>
                                                patchMenu(row.menu.id, { link: v })
                                            }
                                            onDelete={() => deleteLink(row.menu.id)}
                                        />
                                    )}
                                </SortableRow>
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-300 rounded-lg">
                    아직 메뉴가 없습니다. 아래에서 페이지 또는 외부 링크를 추가하세요.
                </div>
            )}

            {hiddenRows.length > 0 ? (
                <div className="pt-1">
                    <div className="text-[11px] text-slate-400 mb-1.5">
                        메뉴에 표시 안 됨 (페이지는 유지)
                    </div>
                    <ul className="space-y-1.5">
                        {hiddenRows.map((row) => (
                            <li
                                key={row.page.id}
                                className="bg-slate-50 border border-slate-200 rounded-md opacity-80"
                            >
                                <div className="flex items-center gap-2 p-2">
                                    <div className="w-5 shrink-0" />
                                    <PageRowBody
                                        row={row}
                                        active={currentPageId === row.page.id}
                                        onRename={(v) => renamePage(row, v)}
                                        onSlugChange={(v) => changeSlug(row, v)}
                                        onSlugBlur={(v) => normalizeSlugOnBlur(row, v)}
                                        onToggleMenu={() => toggleMenu(row)}
                                        onDesign={() =>
                                            onSelectPage(
                                                currentPageId === row.page.id
                                                    ? null
                                                    : row.page.id,
                                            )
                                        }
                                        onDelete={() => deletePage(row)}
                                        bare
                                    />
                                </div>
                                {renderChildrenPanel(row.page)}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <AddArea
                onAddPage={(slug, title) => {
                    const s = cleanSlug(slug);
                    if (!s) {
                        toast.show("주소(slug)를 입력해주세요.", "error");
                        return false;
                    }
                    if (subPages.some((p) => p.slug === s)) {
                        toast.show("이미 존재하는 주소입니다.", "error");
                        return false;
                    }
                    onChangeSubPages([
                        ...subPages,
                        { id: uid(), slug: s, title: title.trim(), sections: [] },
                    ]);
                    onChangeMenus([
                        ...menus,
                        {
                            id: uid(),
                            name: title.trim() || s,
                            link: s,
                            linkType: "subpage",
                        },
                    ]);
                    toast.show(`/${s} 페이지가 추가되었습니다.`);
                    return true;
                }}
                onAddLink={(name, url) => {
                    const n = name.trim();
                    const u = url.trim();
                    if (!n || !u) {
                        toast.show("메뉴 이름과 링크를 모두 입력해주세요.", "error");
                        return false;
                    }
                    onChangeMenus([
                        ...menus,
                        { id: uid(), name: n, link: u, linkType: "url" },
                    ]);
                    return true;
                }}
            />
        </div>
    );
}

function SortableRow({
    id,
    children,
    below,
}: {
    id: string;
    children: ReactNode;
    below?: ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
    };
    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`bg-white border border-slate-200 rounded-md ${
                isDragging ? "shadow-lg z-10 relative" : ""
            }`}
        >
            <div className="flex items-center gap-2 p-2">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 px-1 text-sm leading-none shrink-0"
                    aria-label="드래그하여 순서 변경"
                    title="드래그하여 순서 변경"
                >
                    ⋮⋮
                </button>
                {children}
            </div>
            {below}
        </li>
    );
}

// 최상위 페이지 행 아래에 붙는 하위 페이지(children) 편집 패널.
// childrenEnabled 토글 + 하위 페이지 목록(이름/주소/디자인/삭제) + 추가 입력.
function ChildrenPanel({
    parent,
    currentPageId,
    onToggle,
    onAddChild,
    onPatchChild,
    onSlugBlur,
    onDesign,
    onDelete,
}: {
    parent: SubPage;
    currentPageId: string | null;
    onToggle: (v: boolean) => void;
    onAddChild: (slug: string, title: string) => boolean;
    onPatchChild: (childId: string, p: Partial<SubPage>) => void;
    onSlugBlur: (child: SubPage, raw: string) => void;
    onDesign: (id: string) => void;
    onDelete: (child: SubPage) => void;
}) {
    const kids = parent.children ?? [];
    const enabled = parent.childrenEnabled ?? false;
    const [slug, setSlug] = useState("");
    const [title, setTitle] = useState("");

    const submit = () => {
        if (onAddChild(slug, title)) {
            setSlug("");
            setTitle("");
        }
    };

    return (
        <div className="border-t border-slate-100 bg-slate-50/60 pl-8 pr-2 py-2">
            <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onToggle(e.target.checked)}
                />
                <span className="text-[11px] font-medium text-slate-600">
                    하위 페이지 사용
                    {enabled
                        ? ` · ${kids.length}개 (접속 시 첫 하위 페이지로 이동)`
                        : ""}
                </span>
            </label>

            {enabled ? (
                <div className="space-y-1.5">
                    {kids.length > 0 ? (
                        <ul className="space-y-1">
                            {kids.map((c) => {
                                const active = currentPageId === c.id;
                                return (
                                    <li
                                        key={c.id}
                                        className={`flex items-center gap-1.5 rounded-md border px-2 py-1 ${
                                            active
                                                ? "bg-blue-50 border-blue-200"
                                                : "bg-white border-slate-200"
                                        }`}
                                    >
                                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-1 py-0.5 rounded shrink-0">
                                            SUB
                                        </span>
                                        <input
                                            type="text"
                                            className="input-base text-xs flex-1 min-w-0"
                                            placeholder="하위 페이지 이름"
                                            value={c.title}
                                            onChange={(e) =>
                                                onPatchChild(c.id, {
                                                    title: e.target.value,
                                                })
                                            }
                                        />
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <span className="text-[10px] font-mono text-slate-400">
                                                /{parent.slug}/
                                            </span>
                                            <input
                                                type="text"
                                                className="input-base text-xs font-mono w-16"
                                                value={c.slug}
                                                onChange={(e) =>
                                                    onPatchChild(c.id, {
                                                        slug: e.target.value,
                                                    })
                                                }
                                                onBlur={(e) =>
                                                    onSlugBlur(c, e.target.value)
                                                }
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className={`shrink-0 btn btn-xs ${
                                                active ? "btn-primary" : "btn-outline"
                                            }`}
                                            onClick={() =>
                                                onDesign(active ? parent.id : c.id)
                                            }
                                        >
                                            {active ? "편집 중" : "디자인"}
                                        </button>
                                        <button
                                            type="button"
                                            className="shrink-0 text-slate-400 hover:text-red-500 text-sm px-0.5"
                                            onClick={() => onDelete(c)}
                                            aria-label="삭제"
                                        >
                                            ×
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="text-[11px] text-slate-400 py-1.5 text-center border border-dashed border-slate-300 rounded-md">
                            아직 하위 페이지가 없습니다.
                        </div>
                    )}
                    <div className="flex gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1 flex-1 min-w-28">
                            <span className="text-xs text-slate-400 font-mono">
                                /{parent.slug}/
                            </span>
                            <input
                                type="text"
                                className="input-base text-xs flex-1 font-mono"
                                placeholder="84a"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                            />
                        </div>
                        <input
                            type="text"
                            className="input-base text-xs flex-1 min-w-24"
                            placeholder="이름 (선택)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    submit();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={submit}
                        >
                            추가
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function PageRowBody({
    row,
    active,
    onRename,
    onSlugChange,
    onSlugBlur,
    onToggleMenu,
    onDesign,
    onDelete,
    bare,
}: {
    row: PageRow;
    active: boolean;
    onRename: (v: string) => void;
    onSlugChange: (v: string) => void;
    onSlugBlur: (v: string) => void;
    onToggleMenu: () => void;
    onDesign: () => void;
    onDelete: () => void;
    bare?: boolean;
}) {
    const shown = row.menu !== null;
    return (
        <div className={`flex items-center gap-2 flex-1 min-w-0 ${bare ? "" : ""}`}>
            <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1 py-0.5 rounded shrink-0">
                PAGE
            </span>
            <input
                type="text"
                className="input-base text-xs flex-1 min-w-0"
                placeholder="메뉴/페이지 이름"
                value={row.page.title}
                onChange={(e) => onRename(e.target.value)}
            />
            <div className="flex items-center gap-0.5 shrink-0">
                <span className="text-xs font-mono text-slate-400">/</span>
                <input
                    type="text"
                    className="input-base text-xs font-mono w-20"
                    value={row.page.slug}
                    onChange={(e) => onSlugChange(e.target.value)}
                    onBlur={(e) => onSlugBlur(e.target.value)}
                />
            </div>
            <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                섹션 {row.page.sections.length}
            </span>
            <button
                type="button"
                onClick={onToggleMenu}
                className={`shrink-0 px-1.5 py-1 rounded text-[10px] font-medium transition ${
                    shown
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
                title={shown ? "상단 메뉴에서 숨기기" : "상단 메뉴에 표시"}
            >
                {shown ? "노출" : "숨김"}
            </button>
            <button
                type="button"
                className={`shrink-0 btn btn-xs ${
                    active ? "btn-primary" : "btn-outline"
                }`}
                onClick={onDesign}
            >
                {active ? "편집 중" : "디자인"}
            </button>
            <button
                type="button"
                className="shrink-0 text-slate-400 hover:text-red-500 text-sm px-1"
                onClick={onDelete}
                aria-label="삭제"
            >
                ×
            </button>
        </div>
    );
}

function LinkRowBody({
    menu,
    onName,
    onUrl,
    onDelete,
}: {
    menu: MenuItem;
    onName: (v: string) => void;
    onUrl: (v: string) => void;
    onDelete: () => void;
}) {
    return (
        <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1 py-0.5 rounded shrink-0">
                LINK
            </span>
            <input
                type="text"
                className="input-base text-xs w-28 shrink-0"
                placeholder="메뉴 이름"
                value={menu.name}
                onChange={(e) => onName(e.target.value)}
            />
            <input
                type="text"
                className="input-base text-xs font-mono flex-1 min-w-0"
                placeholder="https://..."
                value={menu.link}
                onChange={(e) => onUrl(e.target.value)}
            />
            <button
                type="button"
                className="shrink-0 text-slate-400 hover:text-red-500 text-sm px-1"
                onClick={onDelete}
                aria-label="삭제"
            >
                ×
            </button>
        </div>
    );
}

function AddArea({
    onAddPage,
    onAddLink,
}: {
    onAddPage: (slug: string, title: string) => boolean;
    onAddLink: (name: string, url: string) => boolean;
}) {
    const [mode, setMode] = useState<"page" | "link">("page");
    const [a, setA] = useState(""); // page: slug / link: name
    const [b, setB] = useState(""); // page: title / link: url

    const submit = () => {
        const ok =
            mode === "page" ? onAddPage(a, b) : onAddLink(a, b);
        if (ok) {
            setA("");
            setB("");
        }
    };

    return (
        <div className="border-t border-slate-100 pt-3">
            <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1 mb-2">
                {(["page", "link"] as const).map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => {
                            setMode(m);
                            setA("");
                            setB("");
                        }}
                        className={`px-3 py-1 text-xs rounded-md transition ${
                            mode === m
                                ? "bg-white shadow text-slate-900 font-medium"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        {m === "page" ? "페이지" : "외부 링크"}
                    </button>
                ))}
            </div>
            <div className="flex gap-2 flex-wrap">
                {mode === "page" ? (
                    <>
                        <div className="flex items-center gap-1 flex-1 min-w-32">
                            <span className="text-sm text-slate-400 font-mono">
                                /
                            </span>
                            <input
                                type="text"
                                className="input-base flex-1 font-mono"
                                placeholder="about"
                                value={a}
                                onChange={(e) => setA(e.target.value)}
                            />
                        </div>
                        <input
                            type="text"
                            className="input-base flex-1 min-w-32"
                            placeholder="페이지 이름 (선택)"
                            value={b}
                            onChange={(e) => setB(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    submit();
                                }
                            }}
                        />
                    </>
                ) : (
                    <>
                        <input
                            type="text"
                            className="input-base flex-1 min-w-32"
                            placeholder="메뉴 이름"
                            value={a}
                            onChange={(e) => setA(e.target.value)}
                        />
                        <input
                            type="text"
                            className="input-base flex-1 min-w-32 font-mono"
                            placeholder="https://..."
                            value={b}
                            onChange={(e) => setB(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    submit();
                                }
                            }}
                        />
                    </>
                )}
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={submit}
                >
                    추가
                </button>
            </div>
        </div>
    );
}
