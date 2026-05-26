"use client";

import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

type ConfirmOptions = {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
};

type Ctx = {
    confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ModalContext = createContext<Ctx | null>(null);

type Pending = {
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
};

export function ModalProvider({ children }: { children: ReactNode }) {
    const [pending, setPending] = useState<Pending | null>(null);

    const confirm = useCallback(
        (opts: ConfirmOptions) =>
            new Promise<boolean>((resolve) => {
                setPending({ opts, resolve });
            }),
        [],
    );

    const close = (result: boolean) => {
        if (!pending) return;
        pending.resolve(result);
        setPending(null);
    };

    useEffect(() => {
        if (!pending) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close(false);
            else if (e.key === "Enter") close(true);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    return (
        <ModalContext.Provider value={{ confirm }}>
            {children}
            {pending ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => close(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-base font-semibold text-slate-900">
                            {pending.opts.title}
                        </div>
                        {pending.opts.message ? (
                            <div className="text-sm text-slate-600 mt-2 leading-relaxed">
                                {pending.opts.message}
                            </div>
                        ) : null}
                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => close(false)}
                            >
                                {pending.opts.cancelLabel ?? "취소"}
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${
                                    pending.opts.danger
                                        ? "btn-danger"
                                        : "btn-primary"
                                }`}
                                onClick={() => close(true)}
                                autoFocus
                            >
                                {pending.opts.confirmLabel ?? "확인"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </ModalContext.Provider>
    );
}

export function useConfirm(): Ctx["confirm"] {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useConfirm must be used within ModalProvider");
    return ctx.confirm;
}
