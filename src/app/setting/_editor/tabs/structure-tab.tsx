"use client";

import { AccordionSection, ColorField, Field, FontSelect } from "../../widgets";
import { Section, Settings } from "../../types";
import { MenuItemsEditor } from "../menus";
import { SectionsEditor } from "../sections";
import { SubPagesEditor } from "../subpages";
import { useSettings } from "./context";

export function StructureTab({
    currentPageId,
    setCurrentPageId,
    currentSubPage,
    pageSections,
    setPageSections,
}: {
    currentPageId: string | null;
    setCurrentPageId: (next: string | null) => void;
    currentSubPage: Settings["subPages"][number] | null;
    pageSections: Section[];
    setPageSections: (next: Section[]) => void;
}) {
    const { s, update, updateEnabled, updateHeader, updateSubMenus } = useSettings();
    return (
        <>
            <AccordionSection
                title={
                    currentSubPage
                        ? `컨텐츠 · /${currentSubPage.slug}`
                        : "컨텐츠 · 메인"
                }
                desc={`${pageSections.length}개 섹션`}
                enabled={s.enabled.sections}
                onToggle={(v) => updateEnabled("sections", v)}
                focusTarget="hero"
                defaultOpen
            >
                <SectionsEditor sections={pageSections} onChange={setPageSections} />
            </AccordionSection>

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

            <AccordionSection
                title="하부 메뉴"
                desc={`${s.subMenus.items.length}개 메뉴`}
                enabled={s.enabled.subMenus}
                onToggle={(v) => updateEnabled("subMenus", v)}
                focusTarget="submenu"
            >
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <ColorField
                        label="배경 색상"
                        value={s.subMenus.bgColor}
                        onChange={(v) => updateSubMenus("bgColor", v)}
                    />
                    <ColorField
                        label="텍스트 색상"
                        value={s.subMenus.textColor}
                        onChange={(v) => updateSubMenus("textColor", v)}
                    />
                    <Field label="폰트">
                        <FontSelect
                            value={s.subMenus.font}
                            onChange={(v) => updateSubMenus("font", v)}
                        />
                    </Field>
                    <Field label="위아래 여백 (px)" hint="기본 12px">
                        <input
                            type="number"
                            min={0}
                            className="input-base w-full"
                            placeholder="12"
                            value={s.subMenus.padding}
                            onChange={(e) =>
                                updateSubMenus("padding", e.target.value)
                            }
                        />
                    </Field>
                </div>
                <MenuItemsEditor
                    items={s.subMenus.items}
                    onChange={(items) => updateSubMenus("items", items)}
                    subPages={s.subPages}
                />
            </AccordionSection>
        </>
    );
}
