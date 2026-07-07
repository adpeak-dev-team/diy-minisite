"use client";

import {
    AccordionSection,
    ColorField,
    Field,
    FontSelect,
    ImageUploader,
    RadioPill,
    Toggle,
} from "../../widgets";
import { useSettings } from "./context";

export function MarketingTab() {
    const { s, update, updateEnabled } = useSettings();
    return (
        <>
            <AccordionSection
                title="팝업 이미지"
                desc="첫 방문 시 표시되는 팝업"
                enabled={s.enabled.popup}
                onToggle={(v) => updateEnabled("popup", v)}
            >
                <ImageUploader
                    value={s.popupImage}
                    onChange={(v) => update("popupImage", v)}
                />
            </AccordionSection>

            <AccordionSection
                title="카운트다운 · 신청자"
                desc="마감 타이머 및 현재 신청자 수"
                enabled={s.enabled.countdown}
                onToggle={(v) => updateEnabled("countdown", v)}
                focusTarget="countdown"
                anchor="countdown"
            >
                <Field label="제목">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.countdown.title}
                        onChange={(e) =>
                            update("countdown", {
                                ...s.countdown,
                                title: e.target.value,
                            })
                        }
                        placeholder="이벤트 마감까지"
                    />
                </Field>
                <Field label="마감 일시">
                    <input
                        type="datetime-local"
                        className="input-base w-full"
                        value={s.countdown.deadline}
                        onChange={(e) =>
                            update("countdown", {
                                ...s.countdown,
                                deadline: e.target.value,
                            })
                        }
                    />
                </Field>
                <Field label="현재 신청자 수">
                    <input
                        type="number"
                        min={0}
                        className="input-base w-32"
                        value={s.countdown.applicantsCount}
                        onChange={(e) =>
                            update("countdown", {
                                ...s.countdown,
                                applicantsCount: e.target.value,
                            })
                        }
                    />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <ColorField
                        label="배경 색상"
                        value={s.countdown.bgColor}
                        onChange={(v) =>
                            update("countdown", { ...s.countdown, bgColor: v })
                        }
                    />
                    <ColorField
                        label="텍스트 색상"
                        value={s.countdown.textColor}
                        onChange={(v) =>
                            update("countdown", { ...s.countdown, textColor: v })
                        }
                    />
                </div>
                <Field label="폰트">
                    <FontSelect
                        value={s.countdown.font}
                        onChange={(v) =>
                            update("countdown", { ...s.countdown, font: v })
                        }
                    />
                </Field>
                <Field label="위치">
                    <RadioPill
                        value={s.countdown.position}
                        onChange={(v) =>
                            update("countdown", {
                                ...s.countdown,
                                position: v,
                            })
                        }
                        options={[
                            { value: "top", label: "상단" },
                            { value: "bottom", label: "하단" },
                            { value: "floating", label: "우측 하단 (원형)" },
                        ]}
                    />
                </Field>
                {s.countdown.position !== "floating" ? (
                    <Field label="">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <Toggle
                                on={s.countdown.sticky}
                                onChange={(v) =>
                                    update("countdown", {
                                        ...s.countdown,
                                        sticky: v,
                                    })
                                }
                            />
                            <span className="text-sm text-slate-700">
                                스크롤 시 고정
                            </span>
                        </label>
                    </Field>
                ) : null}
            </AccordionSection>

            <AccordionSection
                title="고급 설정"
                desc="사이트 설명 · 추가 스크립트"
                enabled={s.enabled.advanced}
                onToggle={(v) => updateEnabled("advanced", v)}
            >
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
                        onChange={(e) => update("additionalScript", e.target.value)}
                        placeholder="<script>...</script>"
                    />
                </Field>
            </AccordionSection>
        </>
    );
}
