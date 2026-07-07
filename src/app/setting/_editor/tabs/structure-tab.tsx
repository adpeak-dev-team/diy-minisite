"use client";

import { AccordionSection, Field } from "../../widgets";
import {
    FONT_OPTIONS,
    FontKey,
    patchSubPage,
    Section,
    SubPage,
} from "../../types";
import { SectionsEditor } from "../sections";
import { useSettings } from "./context";

export function StructureTab({
    scope,
    currentSubPage,
    parentSubPage,
    pageSections,
    setPageSections,
}: {
    // "main": 메인 페이지 전용 / "subpages": 선택된 서브페이지 편집
    scope: "main" | "subpages";
    currentSubPage: SubPage | null;
    parentSubPage: SubPage | null;   // 자식이 선택된 경우 그 부모, 최상위는 null
    pageSections: Section[];
    setPageSections: (next: Section[]) => void;
}) {
    const { s, update, updateEnabled } = useSettings();

    const isMain = scope === "main";

    // 서브페이지 탭인데 아직 선택된 서브페이지가 없으면 안내만 표시.
    if (scope === "subpages" && !currentSubPage) {
        return (
            <div className="text-xs text-slate-500 leading-relaxed border border-dashed border-slate-300 rounded-lg px-4 py-5 text-center">
                위 목록에서 편집할 <b>서브페이지</b>를 선택하세요.
                {s.subPages.length === 0
                    ? " ‘메뉴관리’ 탭에서 페이지를 먼저 추가할 수 있어요."
                    : ""}
            </div>
        );
    }

    const isTopSubPage = !!currentSubPage && !parentSubPage;

    // 이 페이지 본문 글씨체 (미지정이면 사이트 기본 글씨체 사용).
    // 메인은 s.contentFont, 서브페이지는 SubPage.font 에 저장.
    const pageFont = isMain ? s.contentFont : currentSubPage?.font;
    const setPageFont = (v: string) => {
        const font = (v || undefined) as FontKey | undefined;
        if (isMain) {
            update("contentFont", font);
        } else if (currentSubPage) {
            update(
                "subPages",
                patchSubPage(s.subPages, currentSubPage.id, (p) => ({
                    ...p,
                    font,
                })),
            );
        }
    };

    // 최상위 서브페이지가 childrenEnabled=true 면 컨테이너로만 동작 → 자체 컨텐츠 없음.
    // (하위 페이지 추가/삭제/토글은 '메뉴 · 페이지 관리' 탭에서 관리한다.)
    const parentAsContainer =
        isTopSubPage && currentSubPage?.childrenEnabled === true;

    const contentTitle = isMain
        ? "메인 페이지 내용"
        : `${currentSubPage!.title || `/${currentSubPage!.slug}`} 내용`;

    if (parentAsContainer) {
        return (
            <div className="text-xs text-slate-500 leading-relaxed border border-dashed border-slate-300 rounded-lg px-4 py-5 text-center">
                이 페이지는 <b>하위 페이지들의 모음</b>으로 설정되어 있어 자체
                내용을 사용하지 않습니다.
                <br />
                하위 페이지의 내용은 <b>‘메뉴 · 페이지 관리’</b> 탭에서 해당 하위
                페이지의 <b>디자인</b> 버튼을 눌러 편집하세요.
            </div>
        );
    }

    return (
        <AccordionSection
            title={contentTitle}
            desc="사진 · 글 · 신청폼 등을 추가하고 순서를 바꿀 수 있어요"
            enabled={s.enabled.sections}
            onToggle={(v) => updateEnabled("sections", v)}
            anchor="sections"
            focusScroll={false}
        >
            <Field
                label="이 페이지 글씨체"
                hint="비워두면 사이트 기본 글씨체(기본정보)를 따릅니다"
            >
                <select
                    className="input-base w-full appearance-none bg-white pr-9 cursor-pointer"
                    value={pageFont ?? ""}
                    onChange={(e) => setPageFont(e.target.value)}
                >
                    <option value="">사이트 기본 글씨체 사용</option>
                    {FONT_OPTIONS.map((o) => (
                        <option
                            key={o.key}
                            value={o.key}
                            style={{ fontFamily: o.family }}
                        >
                            {o.label}
                        </option>
                    ))}
                </select>
            </Field>
            <SectionsEditor sections={pageSections} onChange={setPageSections} />
        </AccordionSection>
    );
}
