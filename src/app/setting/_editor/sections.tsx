"use client";

import { useState } from "react";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    GalleryImage,
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
import { useImageLifecycle } from "./image-lifecycle";

const SECTION_TYPES = Object.keys(SECTION_TYPE_LABEL) as SectionType[];

export function SectionsEditor({
    sections,
    onChange,
}: {
    sections: Section[];
    onChange: (next: Section[]) => void;
}) {
    const confirm = useConfirm();
    const [picking, setPicking] = useState(false);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = sections.findIndex((s) => s.id === String(active.id));
        const newIndex = sections.findIndex((s) => s.id === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        onChange(arrayMove(sections, oldIndex, newIndex));
    };

    const add = (type: SectionType = "image") => {
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
        setPicking(false);
    };

    const patch = (id: string, p: Partial<Section>) =>
        onChange(sections.map((sec) => (sec.id === id ? { ...sec, ...p } : sec)));

    const bulkAddImages = (urls: string[]) =>
        onChange([
            ...sections,
            ...urls.map((url, i) => ({
                id: uid(),
                type: "image" as const,
                title: `섹션 ${sections.length + i + 1}`,
                image: url,
                content: "",
            })),
        ]);

    if (sections.length === 0) {
        return (
            <div>
                <div className="text-sm font-medium text-slate-700 mb-2">
                    무엇을 추가할까요?
                </div>
                <SectionTypePicker onPick={add} />
                <div className="mt-2">
                    <MultiImagePicker
                        label="＋ 사진 여러 장 한 번에"
                        onPick={bulkAddImages}
                    />
                </div>
            </div>
        );
    }

    return (
        <div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={sections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                >
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
                                        title: "이 내용을 삭제할까요?",
                                        message: "삭제한 내용은 복구할 수 없습니다.",
                                        confirmLabel: "삭제",
                                        danger: true,
                                    })
                                }
                            />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>

            {picking ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                            무엇을 추가할까요?
                        </span>
                        <button
                            type="button"
                            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
                            onClick={() => setPicking(false)}
                        >
                            닫기
                        </button>
                    </div>
                    <SectionTypePicker onPick={add} />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        className="btn btn-secondary w-full"
                        onClick={() => setPicking(true)}
                    >
                        ＋ 내용 추가
                    </button>
                    <MultiImagePicker
                        label="＋ 사진 여러 장"
                        onPick={bulkAddImages}
                    />
                </div>
            )}
        </div>
    );
}

function SectionTypePicker({ onPick }: { onPick: (type: SectionType) => void }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTION_TYPES.map((t) => (
                <button
                    key={t}
                    type="button"
                    onClick={() => onPick(t)}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-left transition"
                >
                    <span className="text-2xl leading-none shrink-0">
                        {SECTION_TYPE_ICON[t]}
                    </span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                            {SECTION_TYPE_LABEL[t]}
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {SECTION_TYPE_DESC[t]}
                        </span>
                    </span>
                </button>
            ))}
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
    const [showAdvanced, setShowAdvanced] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: sec.id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
    };
    return (
        <li
            ref={setNodeRef}
            style={style}
            data-section-id={sec.id}
            className={`border border-slate-200 rounded-xl p-3 bg-white ${
                isDragging ? "shadow-lg z-10 relative" : ""
            }`}
        >
            <div className="flex items-center gap-2 mb-2">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 shrink-0 text-sm leading-none"
                    aria-label="드래그하여 순서 변경"
                    title="드래그하여 순서 변경"
                >
                    ⋮⋮
                </button>
                <span className="text-[11px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded shrink-0">
                    {idx + 1}
                </span>
                <span className="text-xl leading-none shrink-0">
                    {SECTION_TYPE_ICON[sec.type]}
                </span>
                <span className="flex-1 min-w-0 text-sm font-semibold text-slate-800 truncate">
                    {SECTION_TYPE_LABEL[sec.type]}
                    {sec.title ? (
                        <span className="ml-1 text-xs font-normal text-slate-400">
                            · {sec.title}
                        </span>
                    ) : null}
                </span>
                <ListRowActions
                    items={sections}
                    index={idx}
                    onChange={onChange}
                    onConfirmDelete={confirmDelete}
                />
            </div>

            <div className="space-y-2">
                <SectionBody sec={sec} onPatch={onPatch} />
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100">
                <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    onClick={() => setShowAdvanced((v) => !v)}
                >
                    <span className="text-[10px]">
                        {showAdvanced ? "▾" : "▸"}
                    </span>
                    옵션
                </button>
                {showAdvanced ? (
                    <div className="mt-2 space-y-3 bg-slate-50 rounded-lg p-3">
                        <label className="block">
                            <span className="block text-xs text-slate-500 mb-1">
                                이름 (관리용, 사이트엔 안 보임)
                            </span>
                            <input
                                type="text"
                                className="input-base w-full text-xs"
                                value={sec.title}
                                onChange={(e) =>
                                    onPatch({ title: e.target.value })
                                }
                                placeholder="예: 첫 번째 사진"
                            />
                        </label>
                        <label className="block">
                            <span className="block text-xs text-slate-500 mb-1">
                                유형 변경
                            </span>
                            <select
                                className="input-base text-xs w-full"
                                value={sec.type}
                                onChange={(e) =>
                                    onPatch({
                                        type: e.target.value as SectionType,
                                    })
                                }
                            >
                                {SECTION_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {SECTION_TYPE_LABEL[t]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <SectionEffects sec={sec} onPatch={onPatch} />
                    </div>
                ) : null}
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
                <span className="text-xs text-slate-500">나타나는 효과</span>
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
            {sec.type === "image" || sec.type === "hero" || sec.type === "gallery" ? (
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">이미지 꾸미기</span>
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
    if (sec.type === "gallery") {
        return (
            <GalleryEditor
                images={sec.images ?? []}
                onChange={(next) => onPatch({ images: next })}
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

function GalleryEditor({
    images,
    onChange,
}: {
    images: GalleryImage[];
    onChange: (next: GalleryImage[]) => void;
}) {
    const lifecycle = useImageLifecycle();
    // PointerSensor 의 distance 임계값을 두지 않으면 삭제 버튼 클릭이 드래그로 오인됨.
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = images.findIndex((g) => g.id === String(active.id));
        const newIndex = images.findIndex((g) => g.id === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        onChange(arrayMove(images, oldIndex, newIndex));
    };

    const itemIds = images.map((g) => g.id);

    return (
        <div className="space-y-2">
            {images.length > 0 ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={itemIds}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul className="space-y-1.5">
                            {images.map((g, i) => (
                                <SortableImageRow
                                    key={g.id}
                                    id={g.id}
                                    src={g.image}
                                    index={i}
                                    onRemove={() => {
                                        lifecycle.markRemoved(g.image);
                                        onChange(images.filter((_, idx) => idx !== i));
                                    }}
                                />
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-300 rounded-lg">
                    아래 버튼으로 이미지를 추가해주세요.
                </div>
            )}
            <MultiImagePicker
                label="+ 이미지 추가"
                onPick={(urls) =>
                    onChange([
                        ...images,
                        ...urls.map((url) => ({ id: uid(), image: url })),
                    ])
                }
            />
        </div>
    );
}

function SortableImageRow({
    id,
    src,
    index,
    onRemove,
}: {
    id: string;
    src: string;
    index: number;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
    };
    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 bg-white border border-slate-200 rounded-md p-2 ${
                isDragging ? "shadow-lg z-10 relative" : ""
            }`}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 px-1 text-sm leading-none"
                aria-label="드래그하여 순서 변경"
                title="드래그하여 순서 변경"
            >
                ⋮⋮
            </button>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                #{index + 1}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt=""
                className="w-12 h-12 object-cover rounded border border-slate-200"
            />
            <div className="flex-1 text-[11px] text-slate-500 truncate">{src}</div>
            <button
                type="button"
                className="px-2 h-7 rounded-md text-red-600 hover:bg-red-50 text-xs font-medium"
                onClick={onRemove}
            >
                삭제
            </button>
        </li>
    );
}
