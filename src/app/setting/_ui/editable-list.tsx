"use client";

import { ReactNode } from "react";

export type ListItem = { id: string };

export function ListRowActions<T extends ListItem>({
    items,
    index,
    onChange,
    onAfterDelete,
    onConfirmDelete,
    deleteLabel = "삭제",
}: {
    items: T[];
    index: number;
    onChange: (next: T[]) => void;
    onAfterDelete?: (removed: T) => void;
    onConfirmDelete?: () => Promise<boolean>;
    deleteLabel?: string;
}) {
    const move = (dir: -1 | 1) => {
        const target = index + dir;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    const remove = async () => {
        if (onConfirmDelete) {
            const ok = await onConfirmDelete();
            if (!ok) return;
        }
        const removed = items[index];
        onChange(items.filter((_, i) => i !== index));
        onAfterDelete?.(removed);
    };

    return (
        <div className="flex items-center gap-0.5">
            <button
                type="button"
                className="w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                onClick={() => move(-1)}
                disabled={index === 0}
                aria-label="위로 이동"
                title="위로 이동"
            >
                ↑
            </button>
            <button
                type="button"
                className="w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                onClick={() => move(1)}
                disabled={index === items.length - 1}
                aria-label="아래로 이동"
                title="아래로 이동"
            >
                ↓
            </button>
            <button
                type="button"
                className="px-2 h-7 rounded-md text-red-600 hover:bg-red-50 text-xs font-medium"
                onClick={remove}
                aria-label={deleteLabel}
            >
                {deleteLabel}
            </button>
        </div>
    );
}

export function EmptyListState({
    icon,
    children,
}: {
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="text-xs text-slate-400 py-8 text-center border border-dashed border-slate-300 rounded-lg flex flex-col items-center gap-2">
            {icon ? <div className="text-slate-300">{icon}</div> : null}
            <div>{children}</div>
        </div>
    );
}
