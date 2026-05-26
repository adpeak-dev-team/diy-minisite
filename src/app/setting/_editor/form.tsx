"use client";

import {
    CUSTOM_FIELD_TYPE_LABEL,
    CustomFieldType,
    CustomFormField,
    FormSectionData,
    Section,
    uid,
} from "../types";
import {
    ColorPicker,
    Field,
    FontSelect,
    RadioPill,
} from "../widgets";
import { ListRowActions } from "../_ui/editable-list";

export function FormSectionEditor({
    sec,
    onPatch,
}: {
    sec: Section;
    onPatch: (p: Partial<Section>) => void;
}) {
    const data: FormSectionData = sec.formData ?? {};
    const variant = sec.formVariant ?? "consult";
    const patchData = (p: Partial<FormSectionData>) =>
        onPatch({ formData: { ...data, ...p } });

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500">양식 종류</span>
                <RadioPill
                    value={variant}
                    onChange={(v) => onPatch({ formVariant: v })}
                    options={[
                        { value: "consult", label: "빠른상담신청" },
                        { value: "visit", label: "방문예약" },
                        { value: "custom", label: "커스텀" },
                    ]}
                />
            </div>
            <Field label="제목">
                <input
                    type="text"
                    className="input-base w-full"
                    placeholder={
                        variant === "visit"
                            ? "방문예약"
                            : variant === "custom"
                              ? "신청 양식"
                              : "빠른상담신청"
                    }
                    value={data.title ?? ""}
                    onChange={(e) => patchData({ title: e.target.value })}
                />
            </Field>
            {variant === "custom" ? (
                <CustomFieldsEditor
                    fields={data.customFields ?? []}
                    onChange={(customFields) => patchData({ customFields })}
                />
            ) : null}
            {variant !== "custom" ? (
                <div className="grid grid-cols-2 gap-3">
                    <Field label="성명 라벨">
                        <input
                            type="text"
                            className="input-base w-full"
                            placeholder="1. 성명"
                            value={data.nameLabel ?? ""}
                            onChange={(e) =>
                                patchData({ nameLabel: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="성명 placeholder">
                        <input
                            type="text"
                            className="input-base w-full"
                            placeholder="이름"
                            value={data.namePlaceholder ?? ""}
                            onChange={(e) =>
                                patchData({ namePlaceholder: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="연락처 라벨">
                        <input
                            type="text"
                            className="input-base w-full"
                            placeholder="2. 연락처"
                            value={data.phoneLabel ?? ""}
                            onChange={(e) =>
                                patchData({ phoneLabel: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="연락처 안내">
                        <input
                            type="text"
                            className="input-base w-full"
                            placeholder="(-없이 숫자만)"
                            value={data.phoneNote ?? ""}
                            onChange={(e) =>
                                patchData({ phoneNote: e.target.value })
                            }
                        />
                    </Field>
                </div>
            ) : null}
            {variant === "visit" ? (
                <div className="grid grid-cols-2 gap-3">
                    <Field label="방문일 라벨">
                        <input
                            type="text"
                            className="input-base w-full"
                            placeholder="3. 방문예약일자"
                            value={data.dateLabel ?? ""}
                            onChange={(e) =>
                                patchData({ dateLabel: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="방문시간 라벨">
                        <input
                            type="text"
                            className="input-base w-full"
                            placeholder="4. 방문예약시간"
                            value={data.timeLabel ?? ""}
                            onChange={(e) =>
                                patchData({ timeLabel: e.target.value })
                            }
                        />
                    </Field>
                </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
                <Field label="동의 제목">
                    <input
                        type="text"
                        className="input-base w-full"
                        placeholder="개인정보 수집 및 이용 동의"
                        value={data.consentTitle ?? ""}
                        onChange={(e) =>
                            patchData({ consentTitle: e.target.value })
                        }
                    />
                </Field>
                <Field label="동의 체크박스 문구">
                    <input
                        type="text"
                        className="input-base w-full"
                        placeholder="개인정보 수집 이용에 동의합니다."
                        value={data.consentLabel ?? ""}
                        onChange={(e) =>
                            patchData({ consentLabel: e.target.value })
                        }
                    />
                </Field>
            </div>
            <Field label="제출 버튼 문구">
                <input
                    type="text"
                    className="input-base w-full"
                    placeholder={
                        variant === "visit" ? "방문예약 신청" : "상담 신청"
                    }
                    value={data.submitLabel ?? ""}
                    onChange={(e) => patchData({ submitLabel: e.target.value })}
                />
            </Field>
            <Field label="폰트">
                <FontSelect
                    value={data.font ?? "pretendard"}
                    onChange={(v) => patchData({ font: v })}
                />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="배경 색상">
                    <ColorPicker
                        value={data.bgColor ?? "#F8FAFC"}
                        onChange={(v) => patchData({ bgColor: v })}
                    />
                </Field>
                <Field label="카드 배경">
                    <ColorPicker
                        value={data.cardBgColor ?? "#FFFFFF"}
                        onChange={(v) => patchData({ cardBgColor: v })}
                    />
                </Field>
                <Field label="텍스트 색상">
                    <ColorPicker
                        value={data.textColor ?? "#334155"}
                        onChange={(v) => patchData({ textColor: v })}
                    />
                </Field>
                <Field label="버튼 색상">
                    <ColorPicker
                        value={data.buttonColor ?? "#2563EB"}
                        onChange={(v) => patchData({ buttonColor: v })}
                    />
                </Field>
            </div>
            <Field label="버튼 텍스트 색상">
                <ColorPicker
                    value={data.buttonTextColor ?? "#FFFFFF"}
                    onChange={(v) => patchData({ buttonTextColor: v })}
                />
            </Field>
            <div className="text-[11px] text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1.5">
                개인정보 동의 본문은 <b>약관 · 메시지</b> 탭의 &quot;개인정보 보호동의 전문&quot;에서 가져옵니다.
            </div>
        </div>
    );
}

function CustomFieldsEditor({
    fields,
    onChange,
}: {
    fields: CustomFormField[];
    onChange: (next: CustomFormField[]) => void;
}) {
    const add = () =>
        onChange([
            ...fields,
            {
                id: uid(),
                type: "text",
                label: `필드 ${fields.length + 1}`,
                placeholder: "",
                required: false,
                options: [],
            },
        ]);

    const patch = (id: string, p: Partial<CustomFormField>) =>
        onChange(fields.map((f) => (f.id === id ? { ...f, ...p } : f)));

    return (
        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-2">
            <div className="text-xs font-medium text-slate-600 px-1">
                커스텀 필드 ({fields.length}개)
            </div>
            {fields.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-300 rounded bg-white">
                    필드를 추가해 양식을 자유롭게 구성하세요.
                </div>
            ) : (
                <ul className="space-y-2">
                    {fields.map((f, idx) => (
                        <li
                            key={f.id}
                            className="bg-white border border-slate-200 rounded-lg p-2 space-y-2"
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-600 text-white rounded">
                                    #{idx + 1}
                                </span>
                                <select
                                    className="input-base text-xs"
                                    value={f.type}
                                    onChange={(e) =>
                                        patch(f.id, {
                                            type: e.target
                                                .value as CustomFieldType,
                                        })
                                    }
                                >
                                    {(
                                        Object.keys(
                                            CUSTOM_FIELD_TYPE_LABEL,
                                        ) as CustomFieldType[]
                                    ).map((t) => (
                                        <option key={t} value={t}>
                                            {CUSTOM_FIELD_TYPE_LABEL[t]}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    className="input-base flex-1 text-xs"
                                    placeholder="라벨"
                                    value={f.label}
                                    onChange={(e) =>
                                        patch(f.id, { label: e.target.value })
                                    }
                                />
                                <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={f.required}
                                        onChange={(e) =>
                                            patch(f.id, {
                                                required: e.target.checked,
                                            })
                                        }
                                        className="w-3.5 h-3.5 accent-blue-600"
                                    />
                                    필수
                                </label>
                            </div>
                            {f.type !== "checkbox" &&
                            f.type !== "date" &&
                            f.type !== "time" &&
                            f.type !== "select" &&
                            f.type !== "radio" ? (
                                <input
                                    type="text"
                                    className="input-base w-full text-xs"
                                    placeholder="placeholder (선택)"
                                    value={f.placeholder}
                                    onChange={(e) =>
                                        patch(f.id, {
                                            placeholder: e.target.value,
                                        })
                                    }
                                />
                            ) : null}
                            {f.type === "select" || f.type === "radio" ? (
                                <textarea
                                    rows={2}
                                    className="input-base w-full text-xs font-mono"
                                    placeholder="옵션 (줄바꿈으로 구분)"
                                    value={f.options.join("\n")}
                                    onChange={(e) =>
                                        patch(f.id, {
                                            options: e.target.value
                                                .split("\n")
                                                .map((x) => x.trim())
                                                .filter(Boolean),
                                        })
                                    }
                                />
                            ) : null}
                            <div className="flex justify-end">
                                <ListRowActions
                                    items={fields}
                                    index={idx}
                                    onChange={onChange}
                                    deleteLabel="삭제"
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={add}
            >
                + 필드 추가
            </button>
        </div>
    );
}
