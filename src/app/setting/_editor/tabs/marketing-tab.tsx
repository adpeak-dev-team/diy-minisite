"use client";

import {
    AccordionSection,
    ColorField,
    Field,
    FontSelect,
    ImageUploader,
    OnOffPill,
    RadioPill,
    Toggle,
} from "../../widgets";
import { useSettings } from "./context";

export function MarketingTab() {
    const { s, update, updateInfo, updateEnabled } = useSettings();
    return (
        <>
            <AccordionSection title="초대 문구 · 버튼" desc="메인 CTA 영역">
                <Field label="초대 문구">
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            className="input-base flex-1"
                            value={s.info.inviteText}
                            onChange={(e) =>
                                updateInfo("inviteText", e.target.value)
                            }
                        />
                        <OnOffPill
                            value={s.info.inviteVisible}
                            onChange={(v) => updateInfo("inviteVisible", v)}
                        />
                    </div>
                </Field>
                <Field label="초대 아래 영역">
                    <OnOffPill
                        value={s.info.belowInviteVisible}
                        onChange={(v) => updateInfo("belowInviteVisible", v)}
                    />
                </Field>
                <Field label="버튼 문구">
                    <input
                        type="text"
                        className="input-base w-full"
                        value={s.info.buttonText}
                        onChange={(e) =>
                            updateInfo("buttonText", e.target.value)
                        }
                    />
                </Field>
            </AccordionSection>

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
        </>
    );
}
