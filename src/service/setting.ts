"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSettings, putSettings } from "@/app/setting/api";
import { Settings } from "@/app/setting/types";

export const settingKey = (domain: string) => ["setting", domain] as const;

export function useSettings(domain: string | null) {
    return useQuery({
        queryKey: settingKey(domain ?? ""),
        queryFn: () => getSettings(domain as string),
        enabled: !!domain,
    });
}

export function useSaveSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ domain, settings }: { domain: string; settings: Settings }) =>
            putSettings(domain, settings),
        onSuccess: (_, { domain }) => {
            qc.invalidateQueries({ queryKey: settingKey(domain) });
        },
    });
}
