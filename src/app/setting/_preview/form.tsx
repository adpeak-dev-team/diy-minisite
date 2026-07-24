"use client";

import { useState } from "react";
import { CUSTOM_FIELD_TYPE_META, CustomFormField, FormSectionData } from "../types";
import { fontFamilyOf } from "../lib";

const VISIT_TIMES = [
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
];

const DEFAULT_PRIVACY_TEXT = `*수집하는 개인정보의 항목
회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.

- 수집항목 : 성함, 연락처, 문의사항 등
- 개인정보 수집방법 : 상담문의

*개인정보의 수집 및 이용목적
회사는 수집한 개인정보를 상담을 위해 활용합니다.

*개인정보의 보유 및 이용기간
회사는 개인정보 수집 및 이용목적이 달성된 후에는 예외 없이 해당 정보를 지체 없이 파기합니다.`;

export function FormBlock({
    variant,
    pc,
    data,
    privacyText,
    subjectImage,
}: {
    variant: "consult" | "visit" | "custom";
    pc: boolean;
    data: FormSectionData;
    privacyText: string;
    subjectImage?: string | null;
}) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [customValues, setCustomValues] = useState<Record<string, string | boolean>>({});

    const title =
        data.title ||
        (variant === "visit"
            ? "방문예약"
            : variant === "custom"
              ? "신청 양식"
              : "빠른상담신청");
    const bgColor = data.bgColor || "#FFFFFF";
    const cardBg = data.cardBgColor || "#FFFFFF";
    const fg = data.textColor || "#334155";
    const buttonBg = data.buttonColor || "#2563EB";
    const buttonFg = data.buttonTextColor || "#FFFFFF";
    const fontFamily = fontFamilyOf(data.font);

    const padCls = pc ? "px-8 py-8" : "p-4";
    const labelCls = "text-sm font-medium mb-1.5 block";
    const inputCls =
        "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900";

    return (
        <div
            className={padCls}
            style={{ background: bgColor, color: fg, fontFamily }}
        >
            <div
                className="max-w-xl mx-auto rounded-xl border border-slate-200 p-5 shadow-sm overflow-hidden"
                style={{ background: cardBg }}
            >
                {(data.subjectType ?? "text") === "image" ? (
                    subjectImage ? (
                        // 카드 p-5(20px) 에서 10px 만큼만 negative margin → 이미지 주변 10px 여백 확보
                        <div className="-mx-2.5 -mt-2.5 mb-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={subjectImage}
                                alt=""
                                className="w-full block rounded"
                            />
                        </div>
                    ) : null
                ) : (
                    <div className="text-center mb-4">
                        <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                            {title}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {variant === "custom" ? (
                        (data.customFields ?? []).map((f) => (
                            <CustomFieldRender
                                key={f.id}
                                field={f}
                                value={customValues[f.id]}
                                onChange={(v) =>
                                    setCustomValues({
                                        ...customValues,
                                        [f.id]: v,
                                    })
                                }
                                inputCls={inputCls}
                                labelCls={labelCls}
                            />
                        ))
                    ) : (
                        <>
                            <div>
                                <label className={labelCls}>
                                    {data.nameLabel || "1. 성명"}{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={data.namePlaceholder || "이름"}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>
                                    {data.phoneLabel || "2. 연락처"}{" "}
                                    <span className="text-red-500">*</span>
                                    <span className="text-[11px] text-slate-400 font-normal ml-1">
                                        {data.phoneNote || "(-없이 숫자만 / 예: 01012341234)"}
                                    </span>
                                </label>
                                <input
                                    type="tel"
                                    className={inputCls}
                                    value={phone}
                                    onChange={(e) =>
                                        setPhone(e.target.value.replace(/[^0-9]/g, ""))
                                    }
                                    inputMode="numeric"
                                    maxLength={11}
                                    placeholder={data.phonePlaceholder || "01012341234"}
                                />
                            </div>

                            {variant === "visit" ? (
                                <>
                                    <div>
                                        <label className={labelCls}>
                                            {data.dateLabel || "3. 방문예약일자"}
                                        </label>
                                        <input
                                            type="date"
                                            className={inputCls}
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>
                                            {data.timeLabel || "4. 방문예약시간"}
                                        </label>
                                        <select
                                            className={inputCls}
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                        >
                                            <option value="">
                                                {data.timePlaceholder || "-방문시간선택-"}
                                            </option>
                                            {VISIT_TIMES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : null}
                        </>
                    )}

                    {(data.agreeMode ?? "notuse") === "use" ? (
                        <div>
                            <div className={labelCls}>
                                {data.consentTitle || "개인정보 수집 및 이용 동의"}
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-[11px] text-slate-600 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                                {privacyText || DEFAULT_PRIVACY_TEXT}
                            </div>
                            <label className="flex items-center gap-2 mt-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-4 h-4 accent-blue-600"
                                />
                                {data.consentLabel || "개인정보 수집 이용에 동의합니다."}
                            </label>
                        </div>
                    ) : null}

                    {data.buttonType === "image" && data.buttonImage ? (
                        <button
                            type="button"
                            className="w-full"
                            onClick={(e) => e.preventDefault()}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={data.buttonImage}
                                alt=""
                                className="w-full block"
                            />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="w-full py-3 rounded-lg text-sm font-medium transition"
                            style={{ background: buttonBg, color: buttonFg }}
                            onClick={(e) => e.preventDefault()}
                        >
                            {data.submitLabel ||
                                (variant === "visit"
                                    ? "방문예약 신청"
                                    : variant === "custom"
                                      ? "제출"
                                      : "상담 신청")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function CustomFieldRender({
    field,
    value,
    onChange,
    inputCls,
    labelCls,
}: {
    field: CustomFormField;
    value: string | boolean | undefined;
    onChange: (v: string | boolean) => void;
    inputCls: string;
    labelCls: string;
}) {
    const required = field.required ? (
        <span className="text-red-500 ml-0.5">*</span>
    ) : null;

    if (field.type === "checkbox") {
        return (
            <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                />
                {field.label}
                {required}
            </label>
        );
    }

    if (field.type === "textarea") {
        return (
            <div>
                <label className={labelCls}>
                    {field.label}
                    {required}
                </label>
                <textarea
                    rows={3}
                    className={inputCls}
                    value={(value as string) ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                />
            </div>
        );
    }

    if (field.type === "select") {
        return (
            <div>
                <label className={labelCls}>
                    {field.label}
                    {required}
                </label>
                <select
                    className={inputCls}
                    value={(value as string) ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">- 선택 -</option>
                    {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    if (field.type === "radio") {
        return (
            <div>
                <div className={labelCls}>
                    {field.label}
                    {required}
                </div>
                <div className="flex flex-wrap gap-3 mt-1">
                    {field.options.map((opt) => (
                        <label
                            key={opt}
                            className="inline-flex items-center gap-1.5 text-sm cursor-pointer"
                        >
                            <input
                                type="radio"
                                name={field.id}
                                checked={value === opt}
                                onChange={() => onChange(opt)}
                                className="accent-blue-600"
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            </div>
        );
    }

    const inputType = CUSTOM_FIELD_TYPE_META[field.type].inputType;

    return (
        <div>
            <label className={labelCls}>
                {field.label}
                {required}
            </label>
            <input
                type={inputType}
                className={inputCls}
                value={(value as string) ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder}
            />
        </div>
    );
}
