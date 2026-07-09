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
import { toSwatchHex } from "./color";
import { uploadImages } from "./api";
import { useImageLifecycle } from "./_editor/image-lifecycle";

export const AutoFocusContext = createContext(false);

// 미리보기에서 특정 영역을 클릭하면 편집기의 해당 아코디언을 열고 강조하기 위한 컨텍스트.
// anchor 문자열이 AccordionSection 의 anchor 와 일치하면 열림 + 스크롤 + 하이라이트.
// nonce 는 같은 anchor 를 다시 클릭해도 재트리거되도록 하는 카운터.
export type EditorFocus = { anchor: string; nonce: number } | null;
export const EditorFocusContext = createContext<EditorFocus>(null);

// 이미지 업로드 시 GCS 폴더 prefix 로 쓰이는 현재 사이트 도메인.
// 빈 문자열이면 업로드 불가 (도메인 로드 전 / no-domain 모드).
export const DomainContext = createContext<string>("");

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
    anchor,
    focusScroll = true,
    children,
}: {
    title: string;
    desc?: string;
    enabled?: boolean;
    onToggle?: (next: boolean) => void;
    defaultOpen?: boolean;
    focusTarget?: string;
    anchor?: string;
    // anchor 로 열릴 때 아코디언 자체를 스크롤·강조할지. false 면 열기만 하고
    // (내부에서 특정 섹션을 직접 스크롤·강조하는 경우) 아코디언 강조는 생략.
    focusScroll?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const dimmed = enabled === false;
    const autoFocus = useContext(AutoFocusContext);
    const focus = useContext(EditorFocusContext);
    const rowRef = useRef<HTMLDivElement>(null);

    // 사용자가 이 아코디언을 직접 "열었을 때"(닫힘→열림)만 미리보기를 해당
    // 섹션으로 스크롤한다. 최초 마운트(탭 전환 등, defaultOpen 이면 open=true 로 시작)
    // 에는 스크롤하지 않는다 — 탭만 눌러도 미리보기가 튀는 문제 방지.
    const prevOpenRef = useRef(open);
    useEffect(() => {
        const wasOpen = prevOpenRef.current;
        prevOpenRef.current = open;
        if (!open || !autoFocus || !focusTarget) return;
        if (wasOpen) return; // 이미 열려 있던 상태(마운트/탭전환) → 스크롤 안 함
        const el = document.querySelector(
            `[data-focus-target="${focusTarget}"]`,
        );
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [open, autoFocus, focusTarget]);

    // 미리보기에서 이 영역을 클릭한 경우: 아코디언 열고 스크롤 + 잠깐 강조.
    useEffect(() => {
        if (!focus || !anchor || focus.anchor !== anchor) return;
        let clearTimer = 0;
        // 렌더/탭 전환 직후일 수 있어 다음 틱에 실행 (동기 setState 회피).
        const openTimer = window.setTimeout(() => {
            setOpen(true);
            if (!focusScroll) return; // 열기만 하고 강조는 내부(섹션)에 위임
            const el = rowRef.current;
            if (!el) return;
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.style.outline = "2px solid #2563eb";
            el.style.outlineOffset = "2px";
            clearTimer = window.setTimeout(() => {
                el.style.outline = "";
                el.style.outlineOffset = "";
            }, 1600);
        }, 0);
        return () => {
            window.clearTimeout(openTimer);
            window.clearTimeout(clearTimer);
        };
    }, [focus, anchor, focusScroll]);

    return (
        <div ref={rowRef} className="accordion-row" data-guide={anchor}>
            <div
                // 열렸을 때는 헤더 아래 패딩을 없애 제목을 구분선에 붙임.
                // → 본문(p-4)의 위/아래 여백이 콘텐츠 기준 대칭으로 보인다.
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
            {open ? <div className="accordion-body px-4 py-4">{children}</div> : null}
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
        <div className="border border-slate-200 rounded-lg bg-white min-w-0">
            <div className="flex items-center gap-0.5 px-2 py-1 border-b border-slate-200 bg-slate-50 rounded-t-lg flex-wrap">
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
                    className="relative w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer"
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
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                className="px-3 py-2 text-sm outline-none focus:bg-slate-50/50 rounded-b-lg"
                style={{
                    minHeight: `${rows * 1.5}rem`,
                    width: "100%",
                    minWidth: 0,
                    whiteSpace: "nowrap",
                    overflowX: "auto",
                    overflowY: "hidden",
                }}
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
    const safe = toSwatchHex(value);
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

// Field + ColorPicker 조합. 색상 입력은 거의 항상 이 형태로 쓰여서 한 줄로 줄인다.
export function ColorField({
    label,
    hint,
    value,
    onChange,
}: {
    label?: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <Field label={label} hint={hint}>
            <ColorPicker value={value} onChange={onChange} />
        </Field>
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
    const domain = useContext(DomainContext);
    const lifecycle = useImageLifecycle();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length === 0) return;
        if (!domain) {
            setError("도메인 정보가 없어 업로드할 수 없습니다.");
            return;
        }
        setError(null);
        setUploading(true);
        try {
            const [url] = await uploadImages(domain, [files[0]]);
            if (url) {
                // 기존 값이 있던 자리를 교체하는 경우 → 이전 이미지 라이프사이클 처리
                if (value) lifecycle.markRemoved(value);
                lifecycle.markUploaded(url);
                onChange(url);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? `업로드 실패: ${err.message}`
                    : "업로드 실패",
            );
        } finally {
            setUploading(false);
        }
    };

    const handleClear = () => {
        if (value) lifecycle.markRemoved(value);
        onChange(null);
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
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-default"
                        onClick={handleClear}
                        aria-label="삭제"
                        disabled={uploading}
                    >
                        ×
                    </button>
                    <button
                        type="button"
                        className="absolute bottom-1.5 left-1.5 px-2 h-6 rounded-full bg-black/60 text-white text-[11px] font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-default"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? "업로드 중…" : "교체"}
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    className={`${aspectClass} w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-xs text-slate-500 flex flex-col items-center justify-center gap-1 transition disabled:cursor-default disabled:opacity-70`}
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <>
                            <Spinner />
                            <span>업로드 중…</span>
                        </>
                    ) : (
                        <>
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
                        </>
                    )}
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
            />
            {error ? (
                <div className="text-[11px] text-red-600 mt-1">{error}</div>
            ) : note ? (
                <div className="field-hint mt-1">{note}</div>
            ) : null}
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
    const domain = useContext(DomainContext);
    const lifecycle = useImageLifecycle();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handle = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length === 0) return;
        if (!domain) {
            setError("도메인 정보가 없어 업로드할 수 없습니다.");
            return;
        }
        setError(null);
        setUploading(true);
        try {
            const urls = await uploadImages(domain, files);
            if (urls.length > 0) {
                urls.forEach((u) => lifecycle.markUploaded(u));
                onPick(urls);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? `업로드 실패: ${err.message}`
                    : "업로드 실패",
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                className="btn btn-secondary w-full disabled:opacity-60 disabled:cursor-default"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
            >
                {uploading ? "업로드 중…" : label}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handle}
            />
            {error ? (
                <div className="text-[11px] text-red-600 mt-1">{error}</div>
            ) : null}
        </>
    );
}

function Spinner() {
    return (
        <svg
            className="w-5 h-5 animate-spin text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="3"
            />
            <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}
