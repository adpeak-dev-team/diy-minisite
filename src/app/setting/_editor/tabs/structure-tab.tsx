"use client";

import { AccordionSection } from "../../widgets";
import { patchSubPage, Section, SubPage } from "../../types";
import { SectionsEditor } from "../sections";
import { ChildPagesEditor, SubPagesEditor } from "../subpages";
import { useSettings } from "./context";

export function StructureTab({
    currentPageId,
    setCurrentPageId,
    currentSubPage,
    parentSubPage,
    pageSections,
    setPageSections,
}: {
    currentPageId: string | null;
    setCurrentPageId: (next: string | null) => void;
    currentSubPage: SubPage | null;
    parentSubPage: SubPage | null;   // 자식이 선택된 경우 그 부모, 최상위/메인은 null
    pageSections: Section[];
    setPageSections: (next: Section[]) => void;
}) {
    const { s, update, updateEnabled, updateHeader } = useSettings();

    // 편집 컨텍스트:
    //   - 메인 편집: currentSubPage=null
    //   - 최상위 서브페이지 편집: currentSubPage 존재 && parentSubPage=null
    //   - 자식 서브페이지 편집: currentSubPage 존재 && parentSubPage 존재
    const isMain = !currentSubPage;
    const isTopSubPage = !!currentSubPage && !parentSubPage;
    const isChildSubPage = !!parentSubPage;

    // 최상위 서브페이지가 childrenEnabled=true 면 컨테이너로만 동작 → 자체 컨텐츠 편집 UI 숨김.
    const parentAsContainer =
        isTopSubPage && currentSubPage?.childrenEnabled === true;

    const contentTitle = (() => {
        if (isMain) return "컨텐츠 · 메인";
        if (isChildSubPage && parentSubPage) {
            return `컨텐츠 · /${parentSubPage.slug}/${currentSubPage!.slug}`;
        }
        return `컨텐츠 · /${currentSubPage!.slug}`;
    })();

    // 최상위 서브페이지의 children 을 patch. patchSubPage 는 재귀 안 하지만
    // 최상위만 다루므로 안전.
    const setChildrenOfTop = (topId: string, nextChildren: SubPage[]) => {
        update(
            "subPages",
            patchSubPage(s.subPages, topId, (p) => ({
                ...p,
                children: nextChildren,
            })),
        );
    };

    // 부모의 childrenEnabled 토글. ON 으로 바꿀 때 children 배열이 비어있으면
    // 사용자가 뭘 편집해야 할지 알 수 있도록 초기값 유지 (없으면 ChildPagesEditor 가 안내).
    const toggleChildrenEnabled = (topId: string, next: boolean) => {
        update(
            "subPages",
            patchSubPage(s.subPages, topId, (p) => ({
                ...p,
                childrenEnabled: next,
            })),
        );
    };

    // 사이트 어딘가에 자식이 있는 부모가 있어야 자식 네비 스타일 아코디언이 의미 있음.
    const anyParentWithChildren = s.subPages.some(
        (p) => (p.children ?? []).length > 0,
    );

    return (
        <>
            {parentAsContainer ? null : (
                <AccordionSection
                    title={contentTitle}
                    desc={`${pageSections.length}개 섹션`}
                    enabled={s.enabled.sections}
                    onToggle={(v) => updateEnabled("sections", v)}
                    focusTarget="hero"
                    defaultOpen
                >
                    <SectionsEditor sections={pageSections} onChange={setPageSections} />
                </AccordionSection>
            )}

            {isTopSubPage && currentSubPage ? (
                <AccordionSection
                    title="하부메뉴"
                    desc={
                        currentSubPage.childrenEnabled
                            ? `${(currentSubPage.children ?? []).length}개 · 자체 컨텐츠 없음, 첫 하부메뉴로 이동`
                            : "OFF — 이 페이지 자체 컨텐츠 사용"
                    }
                    enabled={currentSubPage.childrenEnabled ?? false}
                    onToggle={(v) =>
                        toggleChildrenEnabled(currentSubPage.id, v)
                    }
                    defaultOpen
                >
                    {currentSubPage.childrenEnabled ? (
                        <ChildPagesEditor
                            parent={currentSubPage}
                            onChange={(next) =>
                                setChildrenOfTop(currentSubPage.id, next)
                            }
                            currentPageId={currentPageId}
                            onSelectPage={setCurrentPageId}
                        />
                    ) : (
                        <div className="text-xs text-slate-500 py-2">
                            하부메뉴를 켜면 이 페이지는 하부메뉴 컨테이너가 되고,
                            자체 컨텐츠 대신 첫 하부메뉴로 자동 이동합니다.
                        </div>
                    )}
                </AccordionSection>
            ) : null}

            {isMain ? (
                <AccordionSection
                    title="서브페이지"
                    desc={`${s.subPages.length}개 · /slug 라우트`}
                >
                    <SubPagesEditor
                        items={s.subPages}
                        onChange={(items) => update("subPages", items)}
                        menus={s.header.menus}
                        onChangeMenus={(menus) => updateHeader("menus", menus)}
                        currentPageId={currentPageId}
                        onSelectPage={setCurrentPageId}
                    />
                </AccordionSection>
            ) : null}

            {isMain && anyParentWithChildren ? (
                <AccordionSection
                    title="하부메뉴 이동 스타일"
                    desc={`${s.enabled.childNavGrid ? "상단 그리드" : ""}${
                        s.enabled.childNavGrid && s.enabled.childNavHover
                            ? " · "
                            : ""
                    }${s.enabled.childNavHover ? "헤더 hover" : ""}${
                        !s.enabled.childNavGrid && !s.enabled.childNavHover
                            ? "둘 다 꺼짐"
                            : ""
                    }`}
                >
                    <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-1"
                                checked={s.enabled.childNavGrid}
                                onChange={(e) =>
                                    updateEnabled(
                                        "childNavGrid",
                                        e.target.checked,
                                    )
                                }
                            />
                            <div>
                                <div className="text-sm font-medium">
                                    상단 그리드
                                </div>
                                <div className="text-xs text-slate-500">
                                    페이지 최상단(헤더 아래)에 하부메뉴들이
                                    그리드로 노출됩니다.
                                </div>
                            </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-1"
                                checked={s.enabled.childNavHover}
                                onChange={(e) =>
                                    updateEnabled(
                                        "childNavHover",
                                        e.target.checked,
                                    )
                                }
                            />
                            <div>
                                <div className="text-sm font-medium">
                                    헤더 메뉴 hover 슬라이드
                                </div>
                                <div className="text-xs text-slate-500">
                                    상단 고정된 메뉴에 마우스를 올리면 아래로
                                    슬라이드해 하부메뉴가 나옵니다.
                                </div>
                            </div>
                        </label>
                    </div>
                </AccordionSection>
            ) : null}
        </>
    );
}
