"use client";

import { AccordionSection } from "../../widgets";
import { Section, SubPage } from "../../types";
import { SectionsEditor } from "../sections";
import { useSettings } from "./context";

export function StructureTab({
    currentSubPage,
    parentSubPage,
    pageSections,
    setPageSections,
}: {
    currentSubPage: SubPage | null;
    parentSubPage: SubPage | null;   // 자식이 선택된 경우 그 부모, 최상위/메인은 null
    pageSections: Section[];
    setPageSections: (next: Section[]) => void;
}) {
    const { s, updateEnabled } = useSettings();

    const isMain = !currentSubPage;
    const isTopSubPage = !!currentSubPage && !parentSubPage;

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
            <SectionsEditor sections={pageSections} onChange={setPageSections} />
        </AccordionSection>
    );
}
