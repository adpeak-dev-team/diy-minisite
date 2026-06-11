"use client";

import { AccordionSection, Field } from "../../widgets";
import { useSettings } from "./context";

export function LocationTab() {
    const { s, update, updateEnabled } = useSettings();
    return (
        <AccordionSection
            title="위치 · 지도"
            desc="주소 또는 임베드 URL"
            enabled={s.enabled.location}
            onToggle={(v) => updateEnabled("location", v)}
            focusTarget="location"
        >
            <Field label="주소" hint="임베드 URL 미입력 시 구글 지도로 표시">
                <input
                    type="text"
                    className="input-base w-full"
                    placeholder="서울특별시 강남구 ..."
                    value={s.location.address}
                    onChange={(e) =>
                        update("location", {
                            ...s.location,
                            address: e.target.value,
                        })
                    }
                />
            </Field>
            <Field
                label="임베드 URL (선택)"
                hint="카카오맵/네이버지도 공유의 iframe src"
            >
                <input
                    type="text"
                    className="input-base w-full font-mono text-xs"
                    placeholder="https://map.kakao.com/..."
                    value={s.location.embedUrl}
                    onChange={(e) =>
                        update("location", {
                            ...s.location,
                            embedUrl: e.target.value,
                        })
                    }
                />
            </Field>
        </AccordionSection>
    );
}
