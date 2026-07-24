"use client";

import {
    CUSTOM_FIELD_TYPE_META,
    CustomFieldType,
    CustomFormField,
    FormSectionData,
    Section,
    uid,
} from "../types";
import {
    ColorField,
    Field,
    FontSelect,
    ImageUploader,
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

    const subjectType = data.subjectType ?? "text";
    const subjectPlaceholder =
        variant === "visit"
            ? "방문예약"
            : variant === "custom"
              ? "신청 양식"
              : "빠른상담신청";

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
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500">양식 제목</span>
                <RadioPill
                    value={subjectType}
                    onChange={(v) => patchData({ subjectType: v })}
                    options={[
                        { value: "text", label: "텍스트" },
                        { value: "image", label: "이미지" },
                    ]}
                />
            </div>
            {subjectType === "image" ? (
                <Field label="제목 이미지" hint="양식 박스 위에 표시될 안내 이미지예요">
                    <ImageUploader
                        value={sec.image}
                        onChange={(v) => onPatch({ image: v })}
                    />
                </Field>
            ) : (
                <Field label="제목 텍스트">
                    <input
                        type="text"
                        className="input-base w-full"
                        placeholder={subjectPlaceholder}
                        value={data.title ?? ""}
                        onChange={(e) => patchData({ title: e.target.value })}
                    />
                </Field>
            )}
            {variant === "custom" ? (
                <CustomFieldsEditor
                    fields={data.customFields ?? []}
                    onChange={(customFields) => patchData({ customFields })}
                />
            ) : null}
            {variant !== "custom" ? (
                <div className="grid grid-cols-2 gap-3">
                    <Field label="성명 항목 제목" hint="입력칸 위에 보이는 항목 이름이에요">
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
                    <Field label="성명 기본값" hint="입력칸 안에 흐리게 보이는 예시 문구예요">
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
                    <Field label="연락처 항목 제목" hint="입력칸 위에 보이는 항목 이름이에요">
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
                    <Field label="연락처 입력 안내" hint="연락처 입력 형식을 알려주는 문구예요">
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
                    <Field label="방문일 항목 제목">
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
                    <Field label="방문시간 항목 제목">
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
            {(data.agreeMode ?? "notuse") === "use" ? (
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
            ) : null}
            <Field label="폰트">
                <FontSelect
                    value={data.font ?? "pretendard"}
                    onChange={(v) => patchData({ font: v })}
                />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <ColorField
                    label="배경 색상"
                    value={data.bgColor ?? "#FFFFFF"}
                    onChange={(v) => patchData({ bgColor: v })}
                />
                <ColorField
                    label="카드 배경"
                    value={data.cardBgColor ?? "#FFFFFF"}
                    onChange={(v) => patchData({ cardBgColor: v })}
                />
                <ColorField
                    label="텍스트 색상"
                    value={data.textColor ?? "#334155"}
                    onChange={(v) => patchData({ textColor: v })}
                />
                <ColorField
                    label="버튼 색상"
                    value={data.buttonColor ?? "#2563EB"}
                    onChange={(v) => patchData({ buttonColor: v })}
                />
            </div>
            <ColorField
                label="버튼 텍스트 색상"
                value={data.buttonTextColor ?? "#FFFFFF"}
                onChange={(v) => patchData({ buttonTextColor: v })}
            />
            {(data.agreeMode ?? "notuse") === "use" ? (
                <div className="text-[11px] text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1.5">
                    개인정보 동의 본문은 <b>약관 · 메시지</b> 탭의 &quot;개인정보 보호동의 전문&quot;에서 가져옵니다.
                </div>
            ) : null}

            <div className="mt-4 border-t border-slate-200 pt-3 space-y-2">
                <div className="text-xs font-medium text-slate-600">
                    상세 옵션
                </div>
                <Field label="폼 하단 고정 여부">
                    <RadioPill
                        value={data.fixedBottom ?? "nonfixed"}
                        onChange={(v) => patchData({ fixedBottom: v })}
                        options={[
                            { value: "fixed", label: "고정" },
                            { value: "nonfixed", label: "비고정" },
                        ]}
                    />
                </Field>
                <Field label="제출 버튼 종류" hint="버튼을 글자로 보일지 이미지로 보일지 선택하세요">
                    <RadioPill
                        value={data.buttonType ?? "text"}
                        onChange={(v) => patchData({ buttonType: v })}
                        options={[
                            { value: "text", label: "텍스트" },
                            { value: "image", label: "이미지" },
                        ]}
                    />
                </Field>
                {(data.buttonType ?? "text") === "image" ? (
                    <Field label="버튼 이미지">
                        <ImageUploader
                            value={data.buttonImage ?? null}
                            onChange={(v) => patchData({ buttonImage: v })}
                        />
                    </Field>
                ) : (
                    <Field label="버튼 문구">
                        <input
                            type="text"
                            className="input-base w-full"
                            placeholder={
                                variant === "visit"
                                    ? "방문예약 신청"
                                    : variant === "custom"
                                      ? "제출"
                                      : "상담 신청"
                            }
                            value={data.submitLabel ?? ""}
                            onChange={(e) =>
                                patchData({ submitLabel: e.target.value })
                            }
                        />
                    </Field>
                )}
                <Field label="개인정보 동의 사용">
                    <RadioPill
                        value={data.agreeMode ?? "notuse"}
                        onChange={(v) =>
                            v === "notuse"
                                ? patchData({
                                      agreeMode: v,
                                      consentTitle: "",
                                      consentLabel: "",
                                      agreeAddWords: [],
                                  })
                                : patchData({ agreeMode: v })
                        }
                        options={[
                            { value: "use", label: "사용" },
                            { value: "notuse", label: "미사용" },
                        ]}
                    />
                </Field>
                {(data.agreeMode ?? "notuse") === "use" ? (
                    <Field label="개인정보 하단 추가 문구">
                        <AgreeAddWordsEditor
                            words={data.agreeAddWords ?? []}
                            onChange={(agreeAddWords) =>
                                patchData({ agreeAddWords })
                            }
                        />
                    </Field>
                ) : null}
            </div>
        </div>
    );
}

function AgreeAddWordsEditor({
    words,
    onChange,
}: {
    words: string[];
    onChange: (next: string[]) => void;
}) {
    return (
        <div className="space-y-1.5">
            {words.map((w, i) => (
                <div key={i} className="flex gap-1.5">
                    <input
                        type="text"
                        className="input-base flex-1"
                        value={w}
                        onChange={(e) => {
                            const next = [...words];
                            next[i] = e.target.value;
                            onChange(next);
                        }}
                    />
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                            onChange(words.filter((_, idx) => idx !== i))
                        }
                    >
                        삭제
                    </button>
                </div>
            ))}
            <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onChange([...words, ""])}
            >
                + 문구 추가
            </button>
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
                                            CUSTOM_FIELD_TYPE_META,
                                        ) as CustomFieldType[]
                                    ).map((t) => (
                                        <option key={t} value={t}>
                                            {CUSTOM_FIELD_TYPE_META[t].label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    className="input-base flex-1 text-xs"
                                    placeholder="항목 제목"
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
                            {CUSTOM_FIELD_TYPE_META[f.type].hasPlaceholder ? (
                                <input
                                    type="text"
                                    className="input-base w-full text-xs"
                                    placeholder="입력칸 기본값 (선택)"
                                    value={f.placeholder}
                                    onChange={(e) =>
                                        patch(f.id, {
                                            placeholder: e.target.value,
                                        })
                                    }
                                />
                            ) : null}
                            {CUSTOM_FIELD_TYPE_META[f.type].hasOptions ? (
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
