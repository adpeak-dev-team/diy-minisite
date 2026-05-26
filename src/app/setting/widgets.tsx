"use client";

import {
    ChangeEvent,
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { FONT_OPTIONS, FontKey, OnOff } from "./types";

export const AutoFocusContext = createContext(false);

export function Toggle({
    on,
    onChange,
    label,
}: {
    on: boolean;
    onChange: (next: boolean) => void;
    label?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            data-on={on}
            className="toggle-switch"
            onClick={(e) => {
                e.stopPropagation();
                onChange(!on);
            }}
        />
    );
}

export function AccordionSection({
    title,
    desc,
    enabled,
    onToggle,
    defaultOpen = false,
    focusTarget,
    children,
}: {
    title: string;
    desc?: string;
    enabled?: boolean;
    onToggle?: (next: boolean) => void;
    defaultOpen?: boolean;
    focusTarget?: string;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const dimmed = enabled === false;
    const autoFocus = useContext(AutoFocusContext);

    useEffect(() => {
        if (!open || !autoFocus || !focusTarget) return;
        const el = document.querySelector(
            `[data-focus-target="${focusTarget}"]`,
        );
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [open, autoFocus, focusTarget]);

    return (
        <div className="accordion-row">
            <div
                className="accordion-head"
                onClick={() => setOpen((o) => !o)}
            >
                {onToggle ? (
                    <Toggle
                        on={enabled ?? true}
                        onChange={onToggle}
                        label={title}
                    />
                ) : (
                    <div className="w-11 shrink-0" />
                )}
                <div className="flex-1">
                    <div className={`accordion-title ${dimmed ? "text-slate-400" : ""}`}>
                        {title}
                    </div>
                    {desc ? (
                        <div className="text-[12px] text-slate-500 mt-0.5">{desc}</div>
                    ) : null}
                </div>
                <svg
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>
            {open ? <div className="accordion-body">{children}</div> : null}
        </div>
    );
}

export function Field({
    label,
    hint,
    children,
}: {
    label?: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div className="mb-3 last:mb-0">
            {label ? <label className="field-label">{label}</label> : null}
            {children}
            {hint ? <div className="field-hint">{hint}</div> : null}
        </div>
    );
}

export function RadioPill<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    className={`px-3 py-1.5 text-xs rounded-md transition ${
                        value === o.value
                            ? "bg-white shadow text-slate-900 font-medium"
                            : "text-slate-500 hover:text-slate-800"
                    }`}
                    onClick={() => onChange(o.value)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function OnOffPill({
    value,
    onChange,
}: {
    value: OnOff;
    onChange: (v: OnOff) => void;
}) {
    return (
        <RadioPill
            options={[
                { value: "on", label: "있음" },
                { value: "off", label: "없음" },
            ]}
            value={value}
            onChange={onChange}
        />
    );
}

export function RichTextEditor({
    value,
    onChange,
    rows = 4,
}: {
    value: string;
    onChange: (html: string) => void;
    rows?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const savedRange = useRef<Range | null>(null);
    const [color, setColor] = useState("#000000");

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (el.innerHTML !== value) el.innerHTML = value;
    }, [value]);

    const emit = () => {
        if (ref.current) onChange(ref.current.innerHTML);
    };

    const saveSelection = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (!ref.current?.contains(range.commonAncestorContainer)) return;
        savedRange.current = range.cloneRange();
    };

    const restoreSelection = () => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        const sel = window.getSelection();
        if (!sel) return;
        if (savedRange.current && el.contains(savedRange.current.commonAncestorContainer)) {
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
            return;
        }
        // Place cursor at end as fallback
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    };

    const exec = (cmd: string, arg?: string) => {
        restoreSelection();
        try {
            document.execCommand("styleWithCSS", false, "true");
        } catch {}
        document.execCommand(cmd, false, arg);
        saveSelection();
        emit();
    };

    const BLOCK_TAGS = new Set([
        "DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6",
        "LI", "BLOCKQUOTE", "PRE", "FIGURE", "FIGCAPTION",
    ]);

    const findBlockAncestor = (node: Node | null): HTMLElement | null => {
        const root = ref.current;
        if (!root) return null;
        let cur: Node | null = node;
        while (cur && cur !== root) {
            if (cur.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((cur as Element).tagName)) {
                return cur as HTMLElement;
            }
            cur = cur.parentNode;
        }
        return null;
    };

    const align = (alignment: "left" | "center" | "right") => {
        const el = ref.current;
        if (!el) return;
        restoreSelection();
        const sel = window.getSelection();
        const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

        if (!range || !el.contains(range.commonAncestorContainer)) {
            el.style.textAlign = alignment;
            emit();
            return;
        }

        const targets: HTMLElement[] = [];
        const startBlock = findBlockAncestor(range.startContainer);
        const endBlock = findBlockAncestor(range.endContainer);

        if (startBlock && endBlock && startBlock !== endBlock) {
            const all = Array.from(el.querySelectorAll<HTMLElement>(
                "div,p,h1,h2,h3,h4,h5,h6,li,blockquote,pre",
            ));
            let collecting = false;
            for (const node of all) {
                if (node === startBlock) collecting = true;
                if (collecting) targets.push(node);
                if (node === endBlock) break;
            }
        } else if (startBlock) {
            targets.push(startBlock);
        }

        if (targets.length === 0) {
            // No block wrapper exists — wrap entire content in a div with alignment
            const wrapper = document.createElement("div");
            wrapper.style.textAlign = alignment;
            while (el.firstChild) wrapper.appendChild(el.firstChild);
            el.appendChild(wrapper);
            // restore cursor inside the wrapper
            const r = document.createRange();
            r.selectNodeContents(wrapper);
            r.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(r);
        } else {
            for (const t of targets) {
                t.style.textAlign = alignment;
            }
        }

        saveSelection();
        emit();
    };

    const toolBtnClass =
        "w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-700 text-xs";
    const onToolMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        saveSelection();
    };

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div className="flex items-center gap-0.5 px-2 py-1 border-b border-slate-200 bg-slate-50 flex-wrap">
                <button
                    type="button"
                    title="굵게"
                    className={toolBtnClass}
                    onMouseDown={onToolMouseDown}
                    onClick={() => exec("bold")}
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    title="기울임"
                    className={toolBtnClass}
                    onMouseDown={onToolMouseDown}
                    onClick={() => exec("italic")}
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    title="밑줄"
                    className={toolBtnClass}
                    onMouseDown={onToolMouseDown}
                    onClick={() => exec("underline")}
                >
                    <u>U</u>
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <select
                    className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white max-w-27.5"
                    title="폰트"
                    defaultValue=""
                    onChange={(e) => exec("fontName", e.target.value)}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        saveSelection();
                    }}
                >
                    <option value="" disabled>
                        폰트
                    </option>
                    {FONT_OPTIONS.map((o) => (
                        <option
                            key={o.key}
                            value={o.family}
                            style={{ fontFamily: o.family }}
                        >
                            {o.label}
                        </option>
                    ))}
                </select>
                <select
                    className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white"
                    title="크기"
                    defaultValue="3"
                    onChange={(e) => exec("fontSize", e.target.value)}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        saveSelection();
                    }}
                >
                    <option value="1">아주작게</option>
                    <option value="2">작게</option>
                    <option value="3">보통</option>
                    <option value="4">크게</option>
                    <option value="5">더 크게</option>
                    <option value="6">아주 크게</option>
                    <option value="7">초대형</option>
                </select>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <label
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer"
                    title="색상"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                    }}
                >
                    <span
                        className="w-4 h-4 rounded-sm border border-slate-300"
                        style={{ background: color }}
                    />
                    <input
                        type="color"
                        className="hidden"
                        value={color}
                        onChange={(e) => {
                            setColor(e.target.value);
                            exec("foreColor", e.target.value);
                        }}
                    />
                </label>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button
                    type="button"
                    title="왼쪽 정렬"
                    className={toolBtnClass}
                    onMouseDown={onToolMouseDown}
                    onClick={() => align("left")}
                >
                    ⇤
                </button>
                <button
                    type="button"
                    title="가운데 정렬"
                    className={toolBtnClass}
                    onMouseDown={onToolMouseDown}
                    onClick={() => align("center")}
                >
                    ⇔
                </button>
                <button
                    type="button"
                    title="오른쪽 정렬"
                    className={toolBtnClass}
                    onMouseDown={onToolMouseDown}
                    onClick={() => align("right")}
                >
                    ⇥
                </button>
            </div>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                className="px-3 py-2 text-sm outline-none focus:bg-slate-50/50"
                style={{ minHeight: `${rows * 1.5}rem` }}
                onInput={() => {
                    saveSelection();
                    emit();
                }}
                onKeyUp={saveSelection}
                onMouseUp={saveSelection}
                onBlur={emit}
            />
        </div>
    );
}

export function ColorPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const safe = /^#([0-9a-fA-F]{6})$/.test(value) ? value : "#000000";
    return (
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={safe}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                className="w-10 h-9 rounded-md border border-slate-200 cursor-pointer bg-white p-0.5"
                aria-label="색상 선택"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="input-base w-32 font-mono uppercase"
                spellCheck={false}
            />
        </div>
    );
}

export function FontSelect({
    value,
    onChange,
}: {
    value: FontKey;
    onChange: (v: FontKey) => void;
}) {
    const current = FONT_OPTIONS.find((o) => o.key === value);
    return (
        <select
            className="input-base w-full appearance-none bg-white pr-9 bg-no-repeat bg-position-[right_0.75rem_center] cursor-pointer"
            style={{
                fontFamily: current?.family,
                backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
            }}
            value={value}
            onChange={(e) => onChange(e.target.value as FontKey)}
        >
            {FONT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key} style={{ fontFamily: o.family }}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

export function ImageUploader({
    value,
    onChange,
    note,
    aspect = "default",
}: {
    value: string | null;
    onChange: (v: string | null) => void;
    note?: string;
    aspect?: "default" | "square" | "wide";
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        const url = URL.createObjectURL(files[0]);
        onChange(url);
        e.target.value = "";
    };

    const aspectClass =
        aspect === "square"
            ? "aspect-square"
            : aspect === "wide"
              ? "aspect-[5/1]"
              : "h-28";

    return (
        <div>
            {value ? (
                <div
                    className={`relative ${aspectClass} w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-50`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={value}
                        alt="uploaded"
                        className="w-full h-full object-contain"
                    />
                    <button
                        type="button"
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600 transition"
                        onClick={() => onChange(null)}
                        aria-label="삭제"
                    >
                        ×
                    </button>
                    <button
                        type="button"
                        className="absolute bottom-1.5 left-1.5 px-2 h-6 rounded-full bg-black/60 text-white text-[11px] font-medium hover:bg-blue-600 transition"
                        onClick={() => inputRef.current?.click()}
                    >
                        교체
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    className={`${aspectClass} w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-xs text-slate-500 flex flex-col items-center justify-center gap-1 transition`}
                    onClick={() => inputRef.current?.click()}
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <span>이미지 업로드</span>
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFile}
            />
            {note ? <div className="field-hint mt-1">{note}</div> : null}
        </div>
    );
}

export function MultiImagePicker({
    onPick,
    label = "여러 이미지 한번에 추가",
}: {
    onPick: (urls: string[]) => void;
    label?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const handle = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        onPick(files.map((f) => URL.createObjectURL(f)));
        e.target.value = "";
    };
    return (
        <>
            <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={() => inputRef.current?.click()}
            >
                {label}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handle}
            />
        </>
    );
}
