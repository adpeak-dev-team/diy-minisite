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
import { MenuItemsEditor } from "../menus";
import { useSettings } from "./context";

// 메인 + 서브페이지 전체에서 form 섹션이 하나라도 있는지 — "폼 바로가기" 옵션 노출 여부 판단.
function anyFormExists(s: Settings): boolean {
    if (s.sections.some((sec) => sec.type === "form")) return true;
    return s.subPages.some((p) => p.sections.some((sec) => sec.type === "form"));
}

export function BasicTab() {
    const { s, update, updateInfo, updateHeader, updateEnabled } = useSettings();
    return (
        <>
            <AccordionSection
                title="메인"
                desc="도메인 / 사이트명 / DB 접수 정보"
                defaultOpen
            >
                <Field label="도메인">
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
                <Field label="사이트명">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.info.siteName}
                        onChange={(e) => updateInfo("siteName", e.target.value)}
                    />
                </Field>
                <Field label="DB 접수 제목" hint="상담 접수 시 관리자에게 표시되는 제목">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.info.dbTitle}
                        onChange={(e) => updateInfo("dbTitle", e.target.value)}
                    />
                </Field>
                <Field label="폰트" hint="메뉴 / 본문 / 폼 등 사이트 전반의 기본 폰트">
                    <FontSelect
                        value={s.font}
                        onChange={(v) => update("font", v)}
                    />
                </Field>
            </AccordionSection>

            <AccordionSection
                title="헤더"
                desc="상단 헤더 스타일, 로고, 전화번호 이미지"
                enabled={s.enabled.header}
                onToggle={(v) => updateEnabled("header", v)}
                focusTarget="header"
            >
                <Field
                    label="상단 헤더 스타일"
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
                <Field label="헤더 색상">
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
                                        updateHeader(
                                            "phoneNumber",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        ) : null}
                    </Field>
                </div>

                <Field label="">
                    <div className="flex items-center gap-2 mb-2">
                        <Toggle
                            on={s.header.menuEnabled}
                            onChange={(v) => updateHeader("menuEnabled", v)}
                        />
                        <span className="text-sm font-medium text-slate-700">
                            메뉴 사용
                        </span>
                    </div>
                    {s.header.menuEnabled ? (
                        <MenuItemsEditor
                            items={s.header.menus}
                            onChange={(items) => updateHeader("menus", items)}
                            subPages={s.subPages}
                        />
                    ) : null}
                </Field>
            </AccordionSection>

            <AccordionSection
                title="푸터"
                desc="상호명 / 대표 / 사업자번호 / 대표번호"
                focusTarget="footer"
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
                        onChange={(v) =>
                            update("footer", { ...s.footer, font: v })
                        }
                    />
                </Field>
            </AccordionSection>

            <AccordionSection
                title="모바일 하단 고정"
                desc="모바일 화면에서만 하단에 표시되는 고정 영역 (전화 / 상담)"
                enabled={s.enabled.bottomFixed}
                onToggle={(v) => updateEnabled("bottomFixed", v)}
                focusTarget="bottom"
            >
                <BottomFixedEditor
                    value={s.bottomFixed}
                    onChange={(v) => update("bottomFixed", v)}
                    hasForm={anyFormExists(s)}
                />
            </AccordionSection>

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

            <AccordionSection
                title="명함 이미지"
                desc="메세지 발송 시 함께 보내지는 이미지"
            >
                <Field label="명함 이미지">
                    <ImageUploader
                        value={s.info.businessCardImage}
                        onChange={(v) => updateInfo("businessCardImage", v)}
                    />
                </Field>
            </AccordionSection>

            <AccordionSection title="고급 설정" desc="사이트 설명 · 추가 스크립트">
                <Field label="사이트 설명" hint="검색 결과에 표시되는 메타 설명">
                    <textarea
                        rows={3}
                        className="input-base w-full"
                        value={s.siteDescription}
                        onChange={(e) => update("siteDescription", e.target.value)}
                        placeholder="사이트 메타 설명을 입력하세요"
                    />
                </Field>
                <Field label="추가 스크립트" hint="GA, Meta Pixel 등 head에 삽입">
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
        </>
    );
}
