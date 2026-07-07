"use client";

import { createContext, ReactNode, useContext } from "react";
import { Settings } from "../../types";
import {
    Updater,
    UpdateEnabled,
    UpdateHeader,
    UpdateInfo,
    UpdateSubMenus,
} from "./shared";

// 모든 탭이 공유하는 settings 상태 + updater 모음.
// 탭마다 동일한 prop 5~6개를 반복 전달하던 것을 대체한다.
export type SettingsContextValue = {
    s: Settings;
    update: Updater;
    updateInfo: UpdateInfo;
    updateHeader: UpdateHeader;
    updateSubMenus: UpdateSubMenus;
    updateEnabled: UpdateEnabled;
    // 현재 섹션 편집 대상 페이지 (null = 메인). 여러 탭이 공유.
    currentPageId: string | null;
    // 페이지의 섹션 디자인 편집으로 이동 — 페이지를 선택하고 "페이지 구성" 탭으로 전환.
    // (메뉴/서브페이지 관리가 기본 탭에 있어도 섹션 편집은 페이지 구성에서 이뤄지므로 탭을 넘겨줌)
    editPageDesign: (id: string | null) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
    value,
    children,
}: {
    value: SettingsContextValue;
    children: ReactNode;
}) {
    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings(): SettingsContextValue {
    const ctx = useContext(SettingsContext);
    if (!ctx) {
        throw new Error("useSettings must be used within SettingsProvider");
    }
    return ctx;
}
