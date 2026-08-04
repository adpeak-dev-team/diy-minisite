"use client";

import {
    FIXED_IMAGE_EFFECT_LABEL,
    FixedImageEffect,
    MENU_FONT_WEIGHT_LABEL,
    MenuFontWeight,
    Settings,
} from "../../types";
import {
    AccordionSection,
    ColorField,
    ColorPicker,
    Field,
    FontSelect,
    ImageUploader,
    RadioPill,
    Toggle,
} from "../../widgets";
import { BottomFixedEditor } from "../bottom";
import { NavManager } from "../nav";
import { useSettings } from "./context";

// 메인 + 서브페이지 전체에서 form 섹션이 하나라도 있는지 — "폼 바로가기" 옵션 노출 여부 판단.
function anyFormExists(s: Settings): boolean {
    if (s.sections.some((sec) => sec.type === "form")) return true;
    return s.subPages.some((p) => p.sections.some((sec) => sec.type === "form"));
}

export function InfoSubTab() {
    const { s, update, updateInfo, updateHeader, updateEnabled } = useSettings();

    // === 공통 정보 통합 입력 ===
    // 여러 기능에 흩어져 있던 값을 여기서 한 번에 입력하면 관련 필드에 모두 반영된다.
    const setCompanyName = (v: string) => {
        updateInfo("siteName", v);
        update("footer", { ...s.footer, company: v });
    };
    const setRepPhone = (v: string) => {
        const tel = v.replace(/[^0-9+]/g, "");
        update("footer", { ...s.footer, phone: v });
        // 상단 전화는 별도 '상단 전용 번호'로 관리 → 비어 있을 때만 이 공용 번호로 폴백
        update("quickConnect", {
            ...s.quickConnect,
            sms: { ...s.quickConnect.sms, phone: v },
        });
        update("bottomFixed", {
            ...s.bottomFixed,
            phone: { ...s.bottomFixed.phone, link: tel ? `tel:${tel}` : "" },
        });
    };

    return (
        <>
            <AccordionSection
                title="사이트 기본 정보"
                desc="여러 기능에서 공통으로 쓰는 정보를 여기서 한 번에 입력하세요"
                anchor="info-basic"
            >
                <Field
                    label="사이트 주소 (도메인)"
                    hint="도메인은 여기서 바꿀 수 없습니다 — 사이트를 구분하는 키라서 변경하려면 관리자에게 문의하세요."
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            className="input-base flex-1 bg-slate-50 text-slate-500"
                            value={s.domain}
                            readOnly
                        />
                        <button
                            type="button"
                            className="btn btn-accent btn-sm"
                            onClick={() => {
                                navigator.clipboard
                                    ?.writeText(s.domain)
                                    .catch(() => { });
                            }}
                        >
                            사이트 복사
                        </button>
                    </div>
                </Field>
                <Field label="상호명" hint="사이트 이름과 하단 사업자 정보에 함께 적용됩니다">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.info.siteName}
                        onChange={(e) => setCompanyName(e.target.value)}
                    />
                </Field>
                <Field
                    label="전화번호"
                    hint="하단 대표번호 · 모바일 하단 · 문자 발송에 적용됩니다"
                >
                    <input
                        type="tel"
                        inputMode="tel"
                        className="input-base w-full"
                        placeholder="010-0000-0000"
                        value={s.footer.phone}
                        onChange={(e) => setRepPhone(e.target.value)}
                    />
                </Field>
                <Field
                    label="대표 전화번호 (상단 전화 전용)"
                    hint="상단 전화번호 이미지 클릭 시 연결됩니다. 비워두면 위 전화번호가 사용됩니다"
                >
                    <input
                        type="tel"
                        inputMode="tel"
                        className="input-base w-full"
                        placeholder="비워두면 위 전화번호 사용"
                        value={s.header.phoneNumber}
                        onChange={(e) =>
                            updateHeader("phoneNumber", e.target.value)
                        }
                    />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="대표자명">
                        <input
                            type="text"
                            className="input-base w-full"
                            value={s.footer.ceo}
                            onChange={(e) =>
                                update("footer", {
                                    ...s.footer,
                                    ceo: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="사업자등록번호">
                        <input
                            type="text"
                            className="input-base w-full"
                            placeholder="000-00-00000"
                            value={s.footer.bizNumber}
                            onChange={(e) =>
                                update("footer", {
                                    ...s.footer,
                                    bizNumber: e.target.value,
                                })
                            }
                        />
                    </Field>
                </div>
                <Field label="상담 접수 제목" hint="상담 신청이 들어올 때 관리자에게 보이는 제목">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.info.dbTitle}
                        onChange={(e) => updateInfo("dbTitle", e.target.value)}
                    />
                </Field>
                <Field
                    label="사이트 글씨체"
                    hint="메뉴 · 상단 · 하단에 적용됩니다 (각 페이지 본문 글씨체는 ‘페이지 구성’에서 따로 지정)"
                >
                    <FontSelect
                        value={s.font}
                        onChange={(v) => update("font", v)}
                    />
                </Field>
                <Field
                    label="링크 공유 이미지 (명함 이미지)"
                    hint="카카오톡 · 문자 · SNS로 링크를 보낼 때 함께 뜨는 대표 이미지(썸네일)예요"
                >
                    <ImageUploader
                        value={s.info.businessCardImage}
                        onChange={(v) => updateInfo("businessCardImage", v)}
                    />
                </Field>
            </AccordionSection>

            <AccordionSection
                title="위치 · 지도"
                desc="주소를 입력하면 페이지 맨 아래에 지도가 표시됩니다"
                enabled={s.enabled.location}
                onToggle={(v) => updateEnabled("location", v)}
                focusTarget="location"
                anchor="location"
            >
                <div className="mb-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[12px] text-blue-700 leading-relaxed">
                    여기에 주소를 입력하면 <b>페이지 맨 아래(푸터 위)</b>에 지도가
                    자동으로 표시됩니다.
                </div>
                <Field
                    label="주소"
                    hint="임베드 URL을 비워두면 이 주소로 구글 지도가 표시됩니다"
                >
                    <input
                        type="text"
                        className="input-base w-full"
                        placeholder="서울특별시 강남구 ..."
                        value={s.location.address}
                        onChange={(e) =>
                            update("location", {
                                ...s.location,
                                address: e.target.value,
                            })
                        }
                    />
                </Field>
                <Field
                    label="지도 임베드 URL (선택)"
                    hint="카카오맵/네이버지도 '공유'의 iframe 주소를 넣으면 그 지도로 표시됩니다"
                >
                    <input
                        type="text"
                        className="input-base w-full font-mono text-xs"
                        placeholder="https://map.kakao.com/..."
                        value={s.location.embedUrl}
                        onChange={(e) =>
                            update("location", {
                                ...s.location,
                                embedUrl: e.target.value,
                            })
                        }
                    />
                </Field>
            </AccordionSection>
        </>
    );
}

export function HeaderSubTab() {
    const { s, update, updateHeader, updateEnabled } = useSettings();
    return (
        <AccordionSection
            title="상단 스타일"
            desc="상단 영역 스타일, 로고, 전화번호 이미지"
            enabled={s.enabled.header}
            onToggle={(v) => updateEnabled("header", v)}
            focusTarget="header"
            anchor="header"
        >
            <Field
                label="상단 고정 방식"
                hint="고정: 항상 상단 / 비고정: 최상단에만 / 스크롤 상호작용: 스크롤 다운 시 슬라이드 인"
            >
                <RadioPill
                    value={s.headerStyle}
                    onChange={(v) => update("headerStyle", v)}
                    options={[
                        { value: "fix", label: "고정" },
                        { value: "nonfix", label: "비고정" },
                        { value: "interaction", label: "스크롤 상호작용" },
                    ]}
                />
            </Field>
            {/*
              '상단 색상'(header.color) 입력은 편집 UI 에서 뺐다.
              값 자체는 그대로 살아 있고 저장·복원도 계속된다 —
              헤더 바 배경, 메뉴 strip 배경(subMenus.bgColor 폴백),
              글자색·기본 테두리색 자동 결정(chrome.tsx 의 isLightColor)에 쓰이므로
              지우면 기존 사이트 색이 전부 기본값으로 바뀐다.
            */}
            <Field label="위아래 여백 (px)" hint="기본 12px">
                <input
                    type="number"
                    min={0}
                    className="input-base w-28"
                    placeholder="12"
                    value={s.header.padding}
                    onChange={(e) => updateHeader("padding", e.target.value)}
                />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="로고 이미지">
                    <ImageUploader
                        value={s.header.logoImage}
                        onChange={(v) => updateHeader("logoImage", v)}
                    />
                    <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">사이즈</span>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                className="input-base w-20 text-xs"
                                placeholder="100"
                                value={s.header.logoSize}
                                onChange={(e) =>
                                    updateHeader("logoSize", e.target.value)
                                }
                            />
                            <span className="text-xs text-slate-500">%</span>
                        </div>
                        {!s.header.phoneImage ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">정렬</span>
                                <RadioPill
                                    value={s.header.logoAlign}
                                    onChange={(v) =>
                                        updateHeader("logoAlign", v)
                                    }
                                    options={[
                                        { value: "left", label: "좌" },
                                        { value: "center", label: "중앙" },
                                        { value: "right", label: "우" },
                                    ]}
                                />
                            </div>
                        ) : null}
                    </div>
                </Field>
                <Field label="상단 전화번호 이미지">
                    <ImageUploader
                        value={s.header.phoneImage}
                        onChange={(v) => updateHeader("phoneImage", v)}
                    />
                    <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">사이즈</span>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                className="input-base w-20 text-xs"
                                placeholder="100"
                                value={s.header.phoneSize}
                                onChange={(e) =>
                                    updateHeader("phoneSize", e.target.value)
                                }
                            />
                            <span className="text-xs text-slate-500">%</span>
                        </div>
                        {!s.header.logoImage ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">정렬</span>
                                <RadioPill
                                    value={s.header.phoneAlign}
                                    onChange={(v) =>
                                        updateHeader("phoneAlign", v)
                                    }
                                    options={[
                                        { value: "left", label: "좌" },
                                        { value: "center", label: "중앙" },
                                        { value: "right", label: "우" },
                                    ]}
                                />
                            </div>
                        ) : null}
                    </div>
                    {s.header.phoneImage ? (
                        <div className="text-[11px] text-slate-400 mt-2">
                            클릭 시 <b>기본정보</b>의 전화번호로 연결됩니다.
                        </div>
                    ) : null}
                </Field>
            </div>
        </AccordionSection>
    );
}

export function MenuTab() {
    const {
        s,
        update,
        updateHeader,
        updateEnabled,
        updateSubMenus,
        currentPageId,
        editPageDesign,
    } = useSettings();
    const anyParentWithChildren = s.subPages.some(
        (p) => (p.children ?? []).length > 0,
    );
    return (
        <>
            <AccordionSection
                title="메뉴 · 페이지 관리"
                desc={`페이지 ${s.subPages.length}개 · 상단 메뉴 ${s.header.menus.length}개`}
                focusTarget="submenu"
                anchor="menu"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Toggle
                        on={s.header.menuEnabled}
                        onChange={(v) => updateHeader("menuEnabled", v)}
                    />
                    <span className="text-sm font-medium text-slate-700">
                        상단에 메뉴 노출
                    </span>
                    <span className="text-[11px] text-slate-400">
                        (끄면 페이지는 유지되고 상단 메뉴만 숨겨집니다)
                    </span>
                </div>
                <div className="mb-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[12px] text-blue-700 leading-relaxed">
                    페이지를 추가한 뒤, 각 페이지의 내용(사진·글·신청폼 등)은{" "}
                    <b>‘페이지 구성’ 탭</b>에서 편집할 수 있어요. 목록의{" "}
                    <b>디자인</b> 버튼을 누르면 해당 페이지 편집으로 바로 이동합니다.
                </div>
                <NavManager
                    menus={s.header.menus}
                    onChangeMenus={(menus) => updateHeader("menus", menus)}
                    subPages={s.subPages}
                    onChangeSubPages={(items) => update("subPages", items)}
                    currentPageId={currentPageId}
                    onSelectPage={editPageDesign}
                />
            </AccordionSection>

            {s.header.menuEnabled ? (
                <AccordionSection
                    title="메뉴 디자인"
                    desc="상단 메뉴 줄의 테두리 · 글자 설정"
                    anchor="menudesign"
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 accent-blue-600"
                                    checked={s.subMenus.borderTop}
                                    onChange={(e) =>
                                        updateSubMenus("borderTop", e.target.checked)
                                    }
                                />
                                상단 테두리
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 accent-blue-600"
                                    checked={s.subMenus.borderBottom}
                                    onChange={(e) =>
                                        updateSubMenus(
                                            "borderBottom",
                                            e.target.checked,
                                        )
                                    }
                                />
                                하단 테두리
                            </label>
                        </div>

                        {s.subMenus.borderTop || s.subMenus.borderBottom ? (
                            <>
                                <Field label="테두리 굵기" hint="비우면 1px">
                                    <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        placeholder="1"
                                        className="input-base w-full text-xs"
                                        value={s.subMenus.borderWidth}
                                        onChange={(e) =>
                                            updateSubMenus(
                                                "borderWidth",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <ColorField
                                    label="테두리 색상"
                                    hint="비우면 헤더 밝기에 맞춘 기본색"
                                    value={s.subMenus.borderColor}
                                    onChange={(v) =>
                                        updateSubMenus("borderColor", v)
                                    }
                                />
                            </>
                        ) : null}

                        <Field
                            label="글자 크기"
                            hint="PC 기준 (비우면 14px) · 모바일은 같은 비율로 자동 축소"
                        >
                            <input
                                type="number"
                                min={8}
                                max={40}
                                placeholder="14"
                                className="input-base w-full text-xs"
                                value={s.subMenus.fontSize}
                                onChange={(e) =>
                                    updateSubMenus("fontSize", e.target.value)
                                }
                            />
                        </Field>

                        <Field label="글자 굵기">
                            <select
                                className="input-base w-full text-xs"
                                value={s.subMenus.fontWeight}
                                onChange={(e) =>
                                    updateSubMenus(
                                        "fontWeight",
                                        e.target.value as MenuFontWeight,
                                    )
                                }
                            >
                                {(
                                    Object.keys(
                                        MENU_FONT_WEIGHT_LABEL,
                                    ) as MenuFontWeight[]
                                ).map((k) => (
                                    <option key={k} value={k}>
                                        {MENU_FONT_WEIGHT_LABEL[k]}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="글씨체">
                            <FontSelect
                                value={s.subMenus.font}
                                onChange={(v) => updateSubMenus("font", v)}
                            />
                        </Field>
                    </div>
                </AccordionSection>
            ) : null}

            {anyParentWithChildren ? (
                <AccordionSection title="하위 페이지 열기 방식">
                    <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-1"
                                checked={s.enabled.childNavGrid}
                                onChange={(e) =>
                                    updateEnabled("childNavGrid", e.target.checked)
                                }
                            />
                            <div>
                                <div className="text-sm font-medium">
                                    상단 그리드
                                </div>
                                <div className="text-xs text-slate-500">
                                    페이지 최상단(상단 영역 아래)에 하위 페이지들이
                                    바둑판처럼 노출됩니다.
                                </div>
                            </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-1"
                                checked={s.enabled.childNavHover}
                                onChange={(e) =>
                                    updateEnabled("childNavHover", e.target.checked)
                                }
                            />
                            <div>
                                <div className="text-sm font-medium">
                                    상단 메뉴 hover 슬라이드
                                </div>
                                <div className="text-xs text-slate-500">
                                    상단 고정된 메뉴에 마우스를 올리면 아래로
                                    슬라이드해 하위 페이지가 나옵니다.
                                </div>
                            </div>
                        </label>
                    </div>
                </AccordionSection>
            ) : null}
        </>
    );
}

export function FooterSubTab() {
    const { s, update } = useSettings();
    return (
        <AccordionSection
            title="하단 스타일"
            desc="하단 배경 · 글자 색상"
            focusTarget="footer"
            anchor="footer"
        >
            <div className="mb-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[12px] text-blue-700 leading-relaxed">
                상호명 · 대표자 · 사업자등록번호 · 대표번호는 <b>기본정보</b> 탭에서
                한 번에 입력하면 하단에 자동으로 표시됩니다. 글씨체는{" "}
                <b>기본정보 · 사이트 글씨체</b>를 따릅니다.
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="배경 색상">
                    <ColorPicker
                        value={s.footer.bgColor}
                        onChange={(v) =>
                            update("footer", { ...s.footer, bgColor: v })
                        }
                    />
                </Field>
                <Field label="글자 색상">
                    <ColorPicker
                        value={s.footer.textColor}
                        onChange={(v) =>
                            update("footer", { ...s.footer, textColor: v })
                        }
                    />
                </Field>
            </div>
        </AccordionSection>
    );
}

export function MobileBottomTab() {
    const { s, update, updateEnabled } = useSettings();
    return (
        <AccordionSection
            title="모바일 하단 고정"
            desc="모바일 화면에서만 맨 아래에 고정 표시되는 버튼 (전화 / 상담)"
            enabled={s.enabled.bottomFixed}
            onToggle={(v) => updateEnabled("bottomFixed", v)}
            focusTarget="bottom"
            anchor="bottom"
        >
            <BottomFixedEditor
                value={s.bottomFixed}
                onChange={(v) => update("bottomFixed", v)}
                hasForm={anyFormExists(s)}
            />
        </AccordionSection>
    );
}

export function FixedSubTab() {
    const { s, update, updateInfo, updateEnabled } = useSettings();
    return (
        <>
            <AccordionSection
                title="빠른 연결"
                desc="카카오톡 · 문자 플로팅 버튼"
                enabled={s.enabled.quickConnect}
                onToggle={(v) => updateEnabled("quickConnect", v)}
                anchor="quickconnect"
            >
                <Field label="카카오톡 채널 URL">
                    <div className="flex items-center gap-2">
                        <Toggle
                            on={s.quickConnect.kakao.enabled}
                            onChange={(v) =>
                                update("quickConnect", {
                                    ...s.quickConnect,
                                    kakao: { ...s.quickConnect.kakao, enabled: v },
                                })
                            }
                        />
                        <input
                            type="text"
                            className="input-base flex-1"
                            placeholder="https://pf.kakao.com/_xxxxxx"
                            value={s.quickConnect.kakao.url}
                            onChange={(e) =>
                                update("quickConnect", {
                                    ...s.quickConnect,
                                    kakao: {
                                        ...s.quickConnect.kakao,
                                        url: e.target.value,
                                    },
                                })
                            }
                        />
                    </div>
                </Field>
                <Field label="문자 보내기" hint="기본정보에 입력된 전화번호로 발송됩니다 ">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Toggle
                            on={s.quickConnect.sms.enabled}
                            onChange={(v) =>
                                update("quickConnect", {
                                    ...s.quickConnect,
                                    sms: { ...s.quickConnect.sms, enabled: v },
                                })
                            }
                        />
                        <span className="text-sm text-slate-600">
                            문자 버튼 사용
                        </span>
                    </label>
                </Field>
                <Field label="문자내용">
                    <textarea
                        rows={3}
                        className="input-base w-full"
                        placeholder="문자 발송 시 본문에 들어갈 기본 내용"
                        value={s.quickConnect.sms.content}
                        onChange={(e) =>
                            update("quickConnect", {
                                ...s.quickConnect,
                                sms: {
                                    ...s.quickConnect.sms,
                                    content: e.target.value,
                                },
                            })
                        }
                    />
                </Field>
            </AccordionSection>

            <AccordionSection
                title="우측 고정 이미지"
                desc="페이지 우측 중간에 floating 표시되는 원형 이미지 (정사각형 권장)"
                enabled={s.enabled.fixedImage}
                onToggle={(v) => updateEnabled("fixedImage", v)}
                anchor="fiximage"
            >
                <Field label="우측 고정 이미지">
                    <ImageUploader
                        value={s.info.fixedImage}
                        onChange={(v) => updateInfo("fixedImage", v)}
                    />
                </Field>
                {s.info.fixedImage ? (
                    <>
                        <Field label="시선 끌기 효과">
                            <select
                                className="input-base w-full text-xs"
                                value={s.info.fixedImageEffect}
                                onChange={(e) =>
                                    updateInfo(
                                        "fixedImageEffect",
                                        e.target.value as FixedImageEffect,
                                    )
                                }
                            >
                                {(
                                    Object.keys(
                                        FIXED_IMAGE_EFFECT_LABEL,
                                    ) as FixedImageEffect[]
                                ).map((k) => (
                                    <option key={k} value={k}>
                                        {FIXED_IMAGE_EFFECT_LABEL[k]}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        {anyFormExists(s) ? (
                            <Field label="클릭 동작">
                                <RadioPill
                                    value={s.info.fixedImageLinkType}
                                    onChange={(v) =>
                                        updateInfo("fixedImageLinkType", v)
                                    }
                                    options={[
                                        { value: "form", label: "폼 바로가기" },
                                        { value: "url", label: "링크" },
                                    ]}
                                />
                            </Field>
                        ) : null}
                        {s.info.fixedImageLinkType !== "form" ? (
                            <Field label="링크 URL">
                                <input
                                    type="text"
                                    className="input-base w-full text-xs font-mono"
                                    placeholder="https://..."
                                    value={s.info.fixedImageLink}
                                    onChange={(e) =>
                                        updateInfo(
                                            "fixedImageLink",
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                        ) : null}
                    </>
                ) : null}
            </AccordionSection>
        </>
    );
}
