"use client";

import { AccordionSection } from "../../widgets";
import { useSettings } from "./context";

export function LegalTab() {
    const { s, update } = useSettings();
    return (
        <>
            <AccordionSection title="개인정보 보호동의 전문">
                <textarea
                    rows={8}
                    className="input-base w-full text-xs"
                    value={s.privacyPolicy}
                    onChange={(e) => update("privacyPolicy", e.target.value)}
                />
            </AccordionSection>

            <AccordionSection title="신청접수 완료 메시지">
                <textarea
                    rows={4}
                    className="input-base w-full"
                    value={s.completeMessage}
                    onChange={(e) => update("completeMessage", e.target.value)}
                />
            </AccordionSection>
        </>
    );
}
