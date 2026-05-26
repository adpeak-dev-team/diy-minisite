"use client";

import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

type ToastKind = "success" | "error" | "info";

type Toast = {
    id: number;
    kind: ToastKind;
    message: string;
};

type Ctx = {
    show: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const seq = useRef(0);
    const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

    const show = useCallback((message: string, kind: ToastKind = "success") => {
        const id = ++seq.current;
        setToasts((cur) => [...cur, { id, kind, message }]);
        timers.current[id] = setTimeout(() => {
            setToasts((cur) => cur.filter((t) => t.id !== id));
            delete timers.current[id];
        }, 2400);
    }, []);

    useEffect(() => {
        const t = timers.current;
        return () => {
            for (const id of Object.keys(t)) clearTimeout(t[Number(id)]);
        };
    }, []);

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            <div className="pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
                            t.kind === "success"
                                ? "bg-slate-900 text-white"
                                : t.kind === "error"
                                  ? "bg-red-600 text-white"
                                  : "bg-slate-700 text-white"
                        }`}
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): Ctx {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
