import { EnabledFlags, Settings } from "../../types";

export type Updater = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
) => void;

export type UpdateInfo = <K extends keyof Settings["info"]>(
    key: K,
    value: Settings["info"][K],
) => void;

export type UpdateHeader = <K extends keyof Settings["header"]>(
    key: K,
    value: Settings["header"][K],
) => void;

export type UpdateSubMenus = <K extends keyof Settings["subMenus"]>(
    key: K,
    value: Settings["subMenus"][K],
) => void;

export type UpdateEnabled = <K extends keyof EnabledFlags>(
    key: K,
    value: boolean,
) => void;
