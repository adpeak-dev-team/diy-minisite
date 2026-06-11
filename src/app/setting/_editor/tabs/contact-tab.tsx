"use client";

import { AccordionSection, Field, ImageUploader, Toggle } from "../../widgets";
import { BottomFixedEditor } from "../bottom";
import { useSettings } from "./context";

export function ContactTab() {
    const { s, update, updateInfo, updateEnabled } = useSettings();
    return (
        <>
            <AccordionSection
                title="하단 고정"
                desc="페이지 하단 고정 영역 (전화 / 상담)"
                enabled={s.enabled.bottomFixed}
                onToggle={(v) => updateEnabled("bottomFixed", v)}
                focusTarget="bottom"
            >
                <BottomFixedEditor
                    value={s.bottomFixed}
                    onChange={(v) => update("bottomFixed", v)}
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
        </>
    );
}
