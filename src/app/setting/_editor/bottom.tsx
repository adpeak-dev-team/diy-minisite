"use client";

import { Settings } from "../types";
import {
    ColorPicker,
    Field,
    FontSelect,
    ImageUploader,
    RadioPill,
    Toggle,
} from "../widgets";

export function BottomFixedEditor({
    value,
    onChange,
}: {
    value: Settings["bottomFixed"];
    onChange: (next: Settings["bottomFixed"]) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <Field label="높이 (px)">
                    <input
                        type="number"
                        min={40}
                        max={120}
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
            />
            <BottomSlotEditor
                label="상담 바로가기 슬롯"
                slot={value.consult}
                onChange={(consult) => onChange({ ...value, consult })}
            />
        </div>
    );
}

function BottomSlotEditor({
    label,
    slot,
    onChange,
}: {
    label: string;
    slot: Settings["bottomFixed"]["phone"];
    onChange: (next: Settings["bottomFixed"]["phone"]) => void;
}) {
    const patch = (p: Partial<Settings["bottomFixed"]["phone"]>) =>
        onChange({ ...slot, ...p });

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
                                onChange={(v) => patch({ image: v })}
                                aspect="wide"
                                note="권장: 가로 384 / 세로 슬롯 높이"
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
                        <Field label="배경 색상">
                            <ColorPicker
                                value={slot.bgColor}
                                onChange={(v) => patch({ bgColor: v })}
                            />
                        </Field>
                        {slot.mode === "text" ? (
                            <Field label="텍스트 색상">
                                <ColorPicker
                                    value={slot.textColor}
                                    onChange={(v) => patch({ textColor: v })}
                                />
                            </Field>
                        ) : null}
                    </div>
                    <Field label="링크" hint="tel:01012345678 / https://...">
                        <input
                            type="text"
                            className="input-base w-full font-mono text-xs"
                            placeholder="tel:01012345678"
                            value={slot.link}
                            onChange={(e) => patch({ link: e.target.value })}
                        />
                    </Field>
                </>
            ) : null}
        </div>
    );
}
