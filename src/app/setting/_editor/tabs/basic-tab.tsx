"use client";

import { Settings } from "../../types";
import {
    AccordionSection,
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
    const { s, update, updateInfo, updateEnabled } = useSettings();
    return (
        <>
            <AccordionSection title="사이트 기본 정보">
                <Field label="사이트 주소 (도메인)">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            className="input-base flex-1"
                            value={s.domain}
                            onChange={(e) => update("domain", e.target.value)}
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
                <Field label="사이트 이름">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.info.siteName}
                        onChange={(e) => updateInfo("siteName", e.target.value)}
                    />
                </Field>
                <Field label="상담 접수 제목" hint="상담 신청이 들어올 때 관리자에게 보이는 제목">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.info.dbTitle}
                        onChange={(e) => updateInfo("dbTitle", e.target.value)}
                    />
                </Field>
                <Field label="사이트 글씨체" hint="메뉴 · 본문 · 신청폼 등 사이트 전체에 적용됩니다">
                    <FontSelect
                        value={s.font}
                        onChange={(v) => update("font", v)}
                    />
                </Field>
                <Field
                    label="링크 공유 이미지"
                    hint="카카오톡 · 문자 · SNS로 링크를 보낼 때 함께 뜨는 대표 이미지(썸네일)예요"
                >
                    <ImageUploader
                        value={s.info.businessCardImage}
                        onChange={(v) => updateInfo("businessCardImage", v)}
                    />
                </Field>
            </AccordionSection>

            <AccordionSection title="고급 설정" desc="사이트 설명 · 추가 스크립트">
                <Field label="사이트 설명" hint="네이버 · 구글 검색 결과에 표시되는 소개 문구">
                    <textarea
                        rows={3}
                        className="input-base w-full"
                        value={s.siteDescription}
                        onChange={(e) => update("siteDescription", e.target.value)}
                        placeholder="사이트를 소개하는 짧은 문구를 입력하세요"
                    />
                </Field>
                <Field label="추가 스크립트" hint="구글 애널리틱스 · 메타 픽셀 등 추적 코드">
                    <textarea
                        rows={4}
                        className="input-base w-full font-mono text-xs"
                        value={s.additionalScript}
                        onChange={(e) =>
                            update("additionalScript", e.target.value)
                        }
                        placeholder="<script>...</script>"
                    />
                </Field>
            </AccordionSection>

            <AccordionSection
                title="위치 · 지도"
                desc="주소를 입력하면 페이지 맨 아래에 지도가 표시됩니다"
                enabled={s.enabled.location}
                onToggle={(v) => updateEnabled("location", v)}
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
            <Field label="상단 색상">
                <ColorPicker
                    value={s.header.color}
                    onChange={(v) => updateHeader("color", v)}
                />
            </Field>
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
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-xs text-slate-500 shrink-0">
                                전화번호
                            </span>
                            <input
                                type="tel"
                                inputMode="tel"
                                className="input-base flex-1 text-xs"
                                placeholder="01012345678"
                                value={s.header.phoneNumber}
                                onChange={(e) =>
                                    updateHeader("phoneNumber", e.target.value)
                                }
                            />
                        </div>
                    ) : null}
                </Field>
            </div>
        </AccordionSection>
    );
}

export function MenuTab() {
    const { s, update, updateHeader, updateEnabled, currentPageId, editPageDesign } =
        useSettings();
    const anyParentWithChildren = s.subPages.some(
        (p) => (p.children ?? []).length > 0,
    );
    return (
        <>
            <AccordionSection
                title="메뉴 · 페이지 관리"
                desc={`페이지 ${s.subPages.length}개 · 상단 메뉴 ${s.header.menus.length}개`}
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
            desc="상호명 / 대표 / 사업자번호 / 대표번호"
            anchor="footer"
        >
            <div className="grid grid-cols-2 gap-3">
                <Field label="상호명">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.footer.company}
                        onChange={(e) =>
                            update("footer", {
                                ...s.footer,
                                company: e.target.value,
                            })
                        }
                    />
                </Field>
                <Field label="대표">
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
                <Field label="대표번호">
                    <input
                        type="text"
                        className="input-base w-full"
                        placeholder="02-0000-0000"
                        value={s.footer.phone}
                        onChange={(e) =>
                            update("footer", {
                                ...s.footer,
                                phone: e.target.value,
                            })
                        }
                    />
                </Field>
            </div>
            <Field label="폰트">
                <FontSelect
                    value={s.footer.font}
                    onChange={(v) => update("footer", { ...s.footer, font: v })}
                />
            </Field>
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
                <Field label="문자 전화번호">
                    <div className="flex items-center gap-2">
                        <Toggle
                            on={s.quickConnect.sms.enabled}
                            onChange={(v) =>
                                update("quickConnect", {
                                    ...s.quickConnect,
                                    sms: { ...s.quickConnect.sms, enabled: v },
                                })
                            }
                        />
                        <input
                            type="text"
                            className="input-base flex-1"
                            placeholder="01012345678"
                            value={s.quickConnect.sms.phone}
                            onChange={(e) =>
                                update("quickConnect", {
                                    ...s.quickConnect,
                                    sms: {
                                        ...s.quickConnect.sms,
                                        phone: e.target.value,
                                    },
                                })
                            }
                        />
                    </div>
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
            >
                <Field label="우측 고정 이미지">
                    <ImageUploader
                        value={s.info.fixedImage}
                        onChange={(v) => updateInfo("fixedImage", v)}
                    />
                </Field>
                {s.info.fixedImage ? (
                    <>
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
