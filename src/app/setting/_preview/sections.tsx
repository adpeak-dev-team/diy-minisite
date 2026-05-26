"use client";

import { useEffect, useRef, useState } from "react";
import { ImageEffect, Section, SectionAnimation } from "../types";
import { parseYouTubeId } from "../lib";
import { FormBlock } from "./form";

export function SectionBlock({
    sec,
    pc = false,
    privacyText,
}: {
    sec: Section;
    pc?: boolean;
    privacyText: string;
}) {
    return (
        <AnimatedSection animation={sec.animation ?? "none"}>
            <SectionBody sec={sec} pc={pc} privacyText={privacyText} />
        </AnimatedSection>
    );
}

function SectionBody({
    sec,
    pc = false,
    privacyText,
}: {
    sec: Section;
    pc?: boolean;
    privacyText: string;
}) {
    if (sec.type === "hero") {
        if (!sec.image) {
            return (
                <div className={`${pc ? "px-8 py-6" : "p-4"} text-xs text-slate-400 text-center border-b border-slate-100`}>
                    {sec.title}
                </div>
            );
        }
        const position = sec.textPosition ?? "center";
        const alignY =
            position === "top"
                ? "items-start pt-6"
                : position === "bottom"
                  ? "items-end pb-6"
                  : "items-center";
        return (
            <div className="relative border-b border-slate-100 overflow-hidden">
                <ImageWithEffect
                    src={sec.image}
                    alt={sec.title}
                    effect={sec.effect ?? "none"}
                />
                {sec.content ? (
                    <div
                        className={`absolute inset-0 flex justify-center ${alignY} ${
                            pc ? "px-12" : "px-6"
                        }`}
                    >
                        <div
                            className="hero-richtext max-w-full"
                            dangerouslySetInnerHTML={{ __html: sec.content }}
                        />
                    </div>
                ) : null}
            </div>
        );
    }

    if (sec.type === "image") {
        if (!sec.image) {
            return (
                <div className={`${pc ? "px-8 py-6" : "p-4"} text-xs text-slate-400 text-center border-b border-slate-100`}>
                    {sec.title}
                </div>
            );
        }
        return (
            <div className="border-b border-slate-100">
                <ImageWithEffect
                    src={sec.image}
                    alt={sec.title}
                    effect={sec.effect ?? "none"}
                />
            </div>
        );
    }

    if (sec.type === "text") {
        return (
            <div className="border-b border-slate-100">
                {sec.content ? (
                    <div
                        className={pc ? "px-8 py-6 text-base max-w-3xl mx-auto" : "p-4 text-sm"}
                        dangerouslySetInnerHTML={{ __html: sec.content }}
                    />
                ) : (
                    <div
                        className={`${pc ? "px-8 py-6 text-base max-w-3xl mx-auto" : "p-4 text-sm"} text-slate-300`}
                    >
                        {sec.title}
                    </div>
                )}
            </div>
        );
    }

    if (sec.type === "html") {
        return (
            <div className="border-b border-slate-100">
                <div
                    className={pc ? "px-8 py-6 text-base max-w-3xl mx-auto" : "p-4 text-sm"}
                    dangerouslySetInnerHTML={{ __html: sec.content }}
                />
            </div>
        );
    }

    if (sec.type === "youtube") {
        const id = parseYouTubeId(sec.content);
        return (
            <div className="border-b border-slate-100">
                {id ? (
                    <div className="relative w-full aspect-video bg-black">
                        <iframe
                            src={`https://www.youtube.com/embed/${id}`}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={sec.title}
                        />
                    </div>
                ) : (
                    <div className={`${pc ? "px-8 py-10" : "p-4"} text-xs text-slate-400 text-center`}>
                        유튜브 링크를 입력해주세요.
                    </div>
                )}
            </div>
        );
    }

    if (sec.type === "form") {
        return (
            <div className="border-b border-slate-100">
                <FormBlock
                    variant={sec.formVariant ?? "consult"}
                    pc={pc}
                    data={sec.formData ?? {}}
                    privacyText={privacyText}
                />
            </div>
        );
    }

    return null;
}

function ImageWithEffect({
    src,
    alt,
    effect,
}: {
    src: string;
    alt: string;
    effect: ImageEffect;
}) {
    const filter =
        effect === "grayscale"
            ? "grayscale(1)"
            : effect === "sepia"
              ? "sepia(0.8)"
              : effect === "blur"
                ? "blur(2px)"
                : effect === "shadow"
                  ? "drop-shadow(0 8px 20px rgba(0,0,0,0.25))"
                  : undefined;

    const rounded = effect === "rounded" ? "rounded-2xl" : "";
    const wrapClass =
        effect === "hover-zoom" || effect === "gradient"
            ? "relative overflow-hidden"
            : "";
    const imgClass = `w-full block ${rounded} ${
        effect === "hover-zoom"
            ? "transition-transform duration-500 hover:scale-105"
            : ""
    }`;

    const img = (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt={alt} className={imgClass} style={{ filter }} />
    );

    if (effect === "gradient") {
        return (
            <div className={wrapClass}>
                {img}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/55 to-transparent" />
            </div>
        );
    }
    if (effect === "hover-zoom") {
        return <div className={wrapClass}>{img}</div>;
    }
    return img;
}

function findScrollableAncestor(el: Element | null): Element | null {
    let cur = el;
    while (cur) {
        const style = window.getComputedStyle(cur);
        if (
            style.overflowY === "auto" ||
            style.overflowY === "scroll" ||
            style.overflow === "auto" ||
            style.overflow === "scroll"
        ) {
            return cur;
        }
        cur = cur.parentElement;
    }
    return null;
}

function useInView<T extends HTMLElement>(): [
    React.RefObject<T | null>,
    boolean,
] {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const root = findScrollableAncestor(el.parentElement);
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { root, threshold: 0.15 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return [ref, inView];
}

function AnimatedSection({
    animation,
    children,
}: {
    animation: SectionAnimation;
    children: React.ReactNode;
}) {
    const [ref, inView] = useInView<HTMLDivElement>();

    if (animation === "none") {
        return <div ref={ref}>{children}</div>;
    }

    const initial =
        animation === "fade-in"
            ? "opacity-0"
            : animation === "slide-up"
              ? "opacity-0 translate-y-8"
              : animation === "slide-right"
                ? "opacity-0 -translate-x-8"
                : animation === "slide-left"
                  ? "opacity-0 translate-x-8"
                  : animation === "zoom-in"
                    ? "opacity-0 scale-90"
                    : animation === "zoom-out"
                      ? "opacity-0 scale-110"
                      : "";
    const finalCls = "opacity-100 translate-x-0 translate-y-0 scale-100";

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${
                inView ? finalCls : initial
            }`}
        >
            {children}
        </div>
    );
}
