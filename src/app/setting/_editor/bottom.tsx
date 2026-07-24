"use client";

import { Settings } from "../types";
import {
    ColorField,
    Field,
    FontSelect,
    ImageUploader,
    RadioPill,
    Toggle,
} from "../widgets";

export function BottomFixedEditor({
    value,
    onChange,
    hasForm = false,
}: {
    value: Settings["bottomFixed"];
    onChange: (next: Settings["bottomFixed"]) => void;
    hasForm?: boolean;
}) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <Field label="높이 (px)" hint="이미지 슬롯이면 이미지 자연 높이에 맞춰 키우세요">
                    <input
                        type="number"
                        min={10}
                        max={240}
                        className="input-base w-full"
                        value={value.height}
                        onChange={(e) =>
                            onChange({ ...value, height: e.target.value })
                        }
                    />
                </Field>
                <Field label="폰트">
                    <FontSelect
                        value={value.font}
                        onChange={(font) => onChange({ ...value, font })}
                    />
                </Field>
            </div>
            <BottomSlotEditor
                label="전화번호 슬롯"
                slot={value.phone}
                onChange={(phone) => onChange({ ...value, phone })}
                enabledCount={enabledCount(value)}
                onImageHeight={(phone, height) =>
                    onChange({ ...value, phone, height })
                }
                linkManaged
            />
            <BottomSlotEditor
                label="상담 바로가기 슬롯"
                slot={value.consult}
                onChange={(consult) => onChange({ ...value, consult })}
                enabledCount={enabledCount(value)}
                onImageHeight={(consult, height) =>
                    onChange({ ...value, consult, height })
                }
                allowFormShortcut={hasForm}
            />
        </div>
    );
}

// 모바일 프리뷰 가로 폭 기준 (preview.tsx 의 MobilePreview 와 동일)
const MOBILE_WIDTH = 320;
// 바 높이 허용 범위 (BottomFixedEditor 의 height input min/max 와 동일)
const HEIGHT_MIN = 10;
const HEIGHT_MAX = 240;

function enabledCount(bf: Settings["bottomFixed"]): number {
    return [bf.phone, bf.consult].filter((s) => s.enabled).length;
}

function BottomSlotEditor({
    label,
    slot,
    onChange,
    enabledCount: count,
    onImageHeight,
    allowFormShortcut = false,
    linkManaged = false,
}: {
    label: string;
    slot: Settings["bottomFixed"]["phone"];
    onChange: (next: Settings["bottomFixed"]["phone"]) => void;
    enabledCount: number;
    // 이미지+높이를 한 번의 상위 업데이트로 원자적으로 반영 (개별 갱신 시 옛 value
    // 스프레드가 방금 넣은 이미지를 덮어쓰는 문제를 피함).
    onImageHeight: (
        next: Settings["bottomFixed"]["phone"],
        height: string,
    ) => void;
    allowFormShortcut?: boolean;
    // true 면 링크를 기본정보의 대표 전화번호로 자동 연결 — 수동 링크 입력 숨김.
    linkManaged?: boolean;
}) {
    const patch = (p: Partial<Settings["bottomFixed"]["phone"]>) =>
        onChange({ ...slot, ...p });

    // 이미지 업로드 시 자연 비율을 읽어 바 높이를 자동 조정.
    // 슬롯 폭 = 모바일 폭(320) / 활성 슬롯 수.
    const handleImageUpload = (next: string | null) => {
        const nextSlot = { ...slot, image: next };
        patch({ image: next });
        if (!next || typeof window === "undefined") return;
        const img = new window.Image();
        img.onload = () => {
            if (!img.naturalWidth) return;
            const slotW = count > 1 ? MOBILE_WIDTH / count : MOBILE_WIDTH;
            const computed = Math.round(
                (slotW / img.naturalWidth) * img.naturalHeight,
            );
            const clamped = Math.max(HEIGHT_MIN, Math.min(HEIGHT_MAX, computed));
            // 이미지와 높이를 함께 실어 보내 이미지가 지워지지 않게 함.
            onImageHeight(nextSlot, String(clamped));
        };
        img.src = next;
    };

    return (
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2">
                <Toggle on={slot.enabled} onChange={(v) => patch({ enabled: v })} />
                <span className="text-sm font-medium text-slate-700">{label}</span>
            </div>
            {slot.enabled ? (
                <>
                    <Field label="모드">
                        <RadioPill
                            value={slot.mode}
                            onChange={(v) => patch({ mode: v })}
                            options={[
                                { value: "text", label: "텍스트" },
                                { value: "image", label: "이미지" },
                            ]}
                        />
                    </Field>
                    {slot.mode === "image" ? (
                        <Field label="이미지">
                            <ImageUploader
                                value={slot.image}
                                onChange={handleImageUpload}
                                aspect="wide"
                                note="업로드 시 이미지 비율에 맞춰 하단 바 높이가 자동 조정됩니다"
                            />
                        </Field>
                    ) : (
                        <Field label="텍스트">
                            <input
                                type="text"
                                className="input-base w-full"
                                value={slot.text}
                                onChange={(e) => patch({ text: e.target.value })}
                            />
                        </Field>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <ColorField
                            label="배경 색상"
                            value={slot.bgColor}
                            onChange={(v) => patch({ bgColor: v })}
                        />
                        {slot.mode === "text" ? (
                            <ColorField
                                label="텍스트 색상"
                                value={slot.textColor}
                                onChange={(v) => patch({ textColor: v })}
                            />
                        ) : null}
                    </div>
                    {allowFormShortcut ? (
                        <Field label="클릭 동작">
                            <RadioPill
                                value={slot.linkType ?? "url"}
                                onChange={(v) => patch({ linkType: v })}
                                options={[
                                    { value: "form", label: "폼 바로가기" },
                                    { value: "url", label: "링크" },
                                ]}
                            />
                        </Field>
                    ) : null}
                    {(slot.linkType ?? "url") === "url" ? (
                        linkManaged ? (
                            <Field label="링크">
                                <div className="text-[11px] text-slate-400">
                                    <b>기본정보</b>의 대표 전화번호로 자동
                                    연결됩니다.
                                </div>
                            </Field>
                        ) : (
                            <Field label="링크" hint="tel:01012345678 / https://...">
                                <input
                                    type="text"
                                    className="input-base w-full font-mono text-xs"
                                    placeholder="tel:01012345678"
                                    value={slot.link}
                                    onChange={(e) => patch({ link: e.target.value })}
                                />
                            </Field>
                        )
                    ) : null}
                </>
            ) : null}
        </div>
    );
}
