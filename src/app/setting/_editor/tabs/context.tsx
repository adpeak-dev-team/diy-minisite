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
