"use client";

import {
    HeroTextPosition,
    IMAGE_EFFECT_LABEL,
    ImageEffect,
    SECTION_ANIMATION_LABEL,
    SECTION_TYPE_LABEL,
    Section,
    SectionAnimation,
    SectionType,
    uid,
} from "../types";
import {
    ImageUploader,
    MultiImagePicker,
    RadioPill,
    RichTextEditor,
} from "../widgets";
import { ListRowActions } from "../_ui/editable-list";
import { useConfirm } from "../_ui/modal";
import { SECTION_TYPE_DESC, SECTION_TYPE_ICON } from "../lib";
import { FormSectionEditor } from "./form";

const SECTION_TYPES = Object.keys(SECTION_TYPE_LABEL) as SectionType[];

export function SectionsEditor({
    sections,
    onChange,
}: {
    sections: Section[];
    onChange: (next: Section[]) => void;
}) {
    const confirm = useConfirm();

    const add = (type: SectionType = "image") =>
        onChange([
            ...sections,
            {
                id: uid(),
                type,
                title: `섹션 ${sections.length + 1}`,
                image: null,
                content: "",
            },
        ]);

    const patch = (id: string, p: Partial<Section>) =>
        onChange(sections.map((sec) => (sec.id === id ? { ...sec, ...p } : sec)));

    return (
        <div>
            {sections.length === 0 ? (
                <SectionTypePicker onPick={add} />
            ) : (
                <ul className="space-y-2 mb-3">
                    {sections.map((sec, idx) => (
                        <SectionItem
                            key={sec.id}
                            sec={sec}
                            idx={idx}
                            sections={sections}
                            onChange={onChange}
                            onPatch={(p) => patch(sec.id, p)}
                            confirmDelete={async () =>
                                confirm({
                                    title: "이 섹션을 삭제할까요?",
                                    message: "삭제한 섹션은 복구할 수 없습니다.",
                                    confirmLabel: "삭제",
                                    danger: true,
                                })
                            }
                        />
                    ))}
                </ul>
            )}
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    className="btn btn-secondary w-full"
                    onClick={() => add()}
                >
                    + 섹션 추가
                </button>
                <MultiImagePicker
                    label="+ 이미지 일괄 추가"
                    onPick={(urls) =>
                        onChange([
                            ...sections,
                            ...urls.map((url, i) => ({
                                id: uid(),
                                type: "image" as const,
                                title: `섹션 ${sections.length + i + 1}`,
                                image: url,
                                content: "",
                            })),
                        ])
                    }
                />
            </div>
        </div>
    );
}

function SectionTypePicker({ onPick }: { onPick: (type: SectionType) => void }) {
    return (
        <div className="mb-3">
            <div className="text-xs font-medium text-slate-700 mb-2">
                추가할 섹션 유형을 선택하세요
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECTION_TYPES.map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => onPick(t)}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition"
                        title={SECTION_TYPE_DESC[t]}
                    >
                        <span className="text-lg leading-none">
                            {SECTION_TYPE_ICON[t]}
                        </span>
                        <span className="text-xs font-medium text-slate-700">
                            {SECTION_TYPE_LABEL[t]}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function SectionItem({
    sec,
    idx,
    sections,
    onChange,
    onPatch,
    confirmDelete,
}: {
    sec: Section;
    idx: number;
    sections: Section[];
    onChange: (next: Section[]) => void;
    onPatch: (p: Partial<Section>) => void;
    confirmDelete: () => Promise<boolean>;
}) {
    return (
        <li className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-600 text-white rounded">
                    #{idx + 1}
                </span>
                <span className="text-base leading-none" title={SECTION_TYPE_LABEL[sec.type]}>
                    {SECTION_TYPE_ICON[sec.type]}
                </span>
                <input
                    type="text"
                    className="input-base flex-1 text-xs"
                    value={sec.title}
                    onChange={(e) => onPatch({ title: e.target.value })}
                    placeholder="섹션 제목"
                />
                <select
                    className="input-base text-xs"
                    value={sec.type}
                    onChange={(e) =>
                        onPatch({ type: e.target.value as SectionType })
                    }
                >
                    {SECTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {SECTION_TYPE_LABEL[t]}
                        </option>
                    ))}
                </select>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 mb-2 space-y-2">
                <SectionEffects sec={sec} onPatch={onPatch} />
                <SectionBody sec={sec} onPatch={onPatch} />
            </div>
            <div className="flex justify-end">
                <ListRowActions
                    items={sections}
                    index={idx}
                    onChange={onChange}
                    onConfirmDelete={confirmDelete}
                />
            </div>
        </li>
    );
}

function SectionEffects({
    sec,
    onPatch,
}: {
    sec: Section;
    onPatch: (p: Partial<Section>) => void;
}) {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">액션</span>
                <select
                    className="input-base text-xs"
                    value={sec.animation ?? "none"}
                    onChange={(e) =>
                        onPatch({
                            animation: e.target.value as SectionAnimation,
                        })
                    }
                >
                    {(Object.keys(SECTION_ANIMATION_LABEL) as SectionAnimation[]).map(
                        (a) => (
                            <option key={a} value={a}>
                                {SECTION_ANIMATION_LABEL[a]}
                            </option>
                        ),
                    )}
                </select>
            </div>
            {sec.type === "image" || sec.type === "hero" ? (
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">효과</span>
                    <select
                        className="input-base text-xs"
                        value={sec.effect ?? "none"}
                        onChange={(e) =>
                            onPatch({ effect: e.target.value as ImageEffect })
                        }
                    >
                        {(Object.keys(IMAGE_EFFECT_LABEL) as ImageEffect[]).map(
                            (k) => (
                                <option key={k} value={k}>
                                    {IMAGE_EFFECT_LABEL[k]}
                                </option>
                            ),
                        )}
                    </select>
                </div>
            ) : null}
        </div>
    );
}

function SectionBody({
    sec,
    onPatch,
}: {
    sec: Section;
    onPatch: (p: Partial<Section>) => void;
}) {
    if (sec.type === "hero") {
        return (
            <div className="space-y-2">
                <ImageUploader
                    value={sec.image}
                    onChange={(v) => onPatch({ image: v })}
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-500">텍스트 위치</span>
                    <RadioPill
                        value={sec.textPosition ?? "center"}
                        onChange={(v) =>
                            onPatch({ textPosition: v as HeroTextPosition })
                        }
                        options={[
                            { value: "top", label: "상단" },
                            { value: "center", label: "중앙" },
                            { value: "bottom", label: "하단" },
                        ]}
                    />
                </div>
                <RichTextEditor
                    value={sec.content}
                    onChange={(html) => onPatch({ content: html })}
                    rows={3}
                />
            </div>
        );
    }
    if (sec.type === "image") {
        return (
            <ImageUploader
                value={sec.image}
                onChange={(v) => onPatch({ image: v })}
            />
        );
    }
    if (sec.type === "youtube") {
        return (
            <input
                type="text"
                className="input-base w-full text-xs font-mono"
                value={sec.content}
                onChange={(e) => onPatch({ content: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
            />
        );
    }
    if (sec.type === "form") {
        return <FormSectionEditor sec={sec} onPatch={onPatch} />;
    }
    if (sec.type === "text") {
        return (
            <RichTextEditor
                value={sec.content}
                onChange={(html) => onPatch({ content: html })}
                rows={4}
            />
        );
    }
    return (
        <textarea
            rows={3}
            className="input-base w-full text-xs font-mono"
            value={sec.content}
            onChange={(e) => onPatch({ content: e.target.value })}
            placeholder="<div>...</div>"
        />
    );
}
