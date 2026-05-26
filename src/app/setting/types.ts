export type HeaderStyle = "fix" | "interaction";
export type FontKey =
    | "pretendard"
    | "noto-sans-kr"
    | "escoredream"
    | "nanum-gothic"
    | "ibm-plex-kr"
    | "black-han-sans"
    | "paperozi"
    | "noto-serif-kr"
    | "nanum-myeongjo"
    | "gowun-batang"
    | "jua"
    | "gaegu"
    | "nanum-pen";
export type OnOff = "on" | "off";
export type HeaderAlign = "left" | "center" | "right";

export type SectionType =
    | "hero"
    | "image"
    | "text"
    | "html"
    | "youtube"
    | "form";
export type ImageEffect =
    | "none"
    | "shadow"
    | "rounded"
    | "grayscale"
    | "sepia"
    | "blur"
    | "hover-zoom"
    | "gradient";
export type FormVariant = "consult" | "visit" | "custom";

export type CustomFieldType =
    | "text"
    | "tel"
    | "email"
    | "number"
    | "date"
    | "time"
    | "select"
    | "radio"
    | "textarea"
    | "checkbox";

export type CustomFormField = {
    id: string;
    type: CustomFieldType;
    label: string;
    placeholder: string;
    required: boolean;
    options: string[];
};
export type SectionAnimation =
    | "none"
    | "fade-in"
    | "slide-up"
    | "slide-right"
    | "slide-left"
    | "zoom-in"
    | "zoom-out";
export type CountdownPosition = "top" | "bottom" | "floating";
export type BottomSlotMode = "image" | "text";

export type BottomSlot = {
    enabled: boolean;
    mode: BottomSlotMode;
    image: string | null;
    text: string;
    bgColor: string;
    textColor: string;
    link: string;
};

export type Section = {
    id: string;
    type: SectionType;
    title: string;
    image: string | null;
    content: string;
    effect?: ImageEffect;
    animation?: SectionAnimation;
    formVariant?: FormVariant;
    formData?: FormSectionData;
};

export type MenuLinkType = "subpage" | "url";
export type MenuItem = {
    id: string;
    name: string;
    link: string;
    linkType?: MenuLinkType;
};

export type SubPage = {
    id: string;
    slug: string;
    title: string;
    sections: Section[];
};

export type FormSectionData = {
    title?: string;
    nameLabel?: string;
    namePlaceholder?: string;
    phoneLabel?: string;
    phoneNote?: string;
    phonePlaceholder?: string;
    dateLabel?: string;
    timeLabel?: string;
    timePlaceholder?: string;
    consentTitle?: string;
    consentLabel?: string;
    submitLabel?: string;
    font?: FontKey;
    textColor?: string;
    bgColor?: string;
    cardBgColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    customFields?: CustomFormField[];
};

export type EnabledFlags = {
    header: boolean;
    sections: boolean;
    subMenus: boolean;
    popup: boolean;
    fixedImage: boolean;
    privacy: boolean;
    bottomFixed: boolean;
    countdown: boolean;
    quickConnect: boolean;
    location: boolean;
};

export type Settings = {
    domain: string;
    headerStyle: HeaderStyle;
    font: FontKey;
    siteDescription: string;
    additionalScript: string;
    header: {
        logoImage: string | null;
        logoSize: string;
        logoAlign: HeaderAlign;
        phoneImage: string | null;
        phoneSize: string;
        phoneAlign: HeaderAlign;
        color: string;
        padding: string;
        menuEnabled: boolean;
        menus: MenuItem[];
        menuFont: FontKey;
    };
    sections: Section[];
    subPages: SubPage[];
    subMenus: {
        bgColor: string;
        textColor: string;
        font: FontKey;
        padding: string;
        items: MenuItem[];
    };
    popupImage: string | null;
    info: {
        siteName: string;
        dbTitle: string;
        inviteText: string;
        inviteVisible: OnOff;
        belowInviteVisible: OnOff;
        buttonText: string;
        businessCardImage: string | null;
    };
    bottomFixed: {
        height: string;
        font: FontKey;
        phone: BottomSlot;
        consult: BottomSlot;
    };
    countdown: {
        title: string;
        deadline: string;
        applicantsCount: string;
        bgColor: string;
        textColor: string;
        font: FontKey;
        position: CountdownPosition;
        sticky: boolean;
    };
    quickConnect: {
        kakao: { enabled: boolean; url: string };
        sms: { enabled: boolean; phone: string };
    };
    location: {
        address: string;
        embedUrl: string;
    };
    footer: {
        company: string;
        ceo: string;
        bizNumber: string;
        phone: string;
        font: FontKey;
    };
    privacyPolicy: string;
    completeMessage: string;
    enabled: EnabledFlags;
};

export const FONT_OPTIONS: { key: FontKey; label: string; family: string }[] = [
    { key: "pretendard", label: "프리텐다드", family: "var(--font-pretendard)" },
    { key: "noto-sans-kr", label: "노토 산스", family: "'Noto Sans KR', sans-serif" },
    { key: "escoredream", label: "에스코어 드림", family: "'S-Core Dream', sans-serif" },
    { key: "nanum-gothic", label: "나눔 고딕", family: "'Nanum Gothic', sans-serif" },
    { key: "ibm-plex-kr", label: "IBM Plex Sans KR", family: "'IBM Plex Sans KR', sans-serif" },
    { key: "black-han-sans", label: "검은고딕", family: "'Black Han Sans', sans-serif" },
    { key: "paperozi", label: "페이퍼로지", family: "'Paperlogy', serif" },
    { key: "noto-serif-kr", label: "노토 세리프", family: "'Noto Serif KR', serif" },
    { key: "nanum-myeongjo", label: "나눔 명조", family: "'Nanum Myeongjo', serif" },
    { key: "gowun-batang", label: "고운 바탕", family: "'Gowun Batang', serif" },
    { key: "jua", label: "주아체", family: "'Jua', sans-serif" },
    { key: "gaegu", label: "개구체", family: "'Gaegu', cursive" },
    { key: "nanum-pen", label: "나눔 손글씨", family: "'Nanum Pen Script', cursive" },
];

export const SECTION_TYPE_LABEL: Record<SectionType, string> = {
    hero: "이미지 + 텍스트",
    image: "이미지",
    text: "텍스트",
    html: "HTML",
    youtube: "유튜브",
    form: "양식폼",
};

export const IMAGE_EFFECT_LABEL: Record<ImageEffect, string> = {
    none: "없음",
    shadow: "그림자",
    rounded: "라운드",
    grayscale: "흑백",
    sepia: "세피아",
    blur: "블러",
    "hover-zoom": "호버 줌",
    gradient: "하단 그라데이션",
};

export const FORM_VARIANT_LABEL: Record<FormVariant, string> = {
    consult: "빠른상담신청",
    visit: "방문예약",
    custom: "커스텀",
};

export const CUSTOM_FIELD_TYPE_LABEL: Record<CustomFieldType, string> = {
    text: "텍스트",
    tel: "전화번호",
    email: "이메일",
    number: "숫자",
    date: "날짜",
    time: "시간",
    select: "셀렉트",
    radio: "라디오",
    textarea: "긴 텍스트",
    checkbox: "체크박스",
};

export const SECTION_ANIMATION_LABEL: Record<SectionAnimation, string> = {
    none: "없음",
    "fade-in": "페이드 인",
    "slide-up": "아래에서 올라오기",
    "slide-right": "왼쪽에서 들어오기",
    "slide-left": "오른쪽에서 들어오기",
    "zoom-in": "확대",
    "zoom-out": "축소",
};

export const COUNTDOWN_POSITION_LABEL: Record<CountdownPosition, string> = {
    top: "상단",
    bottom: "하단",
    floating: "우측 하단",
};

export const initialSettings: Settings = {
    domain: "test",
    headerStyle: "fix",
    font: "pretendard",
    siteDescription: "",
    additionalScript: "",
    header: {
        logoImage: null,
        logoSize: "100",
        logoAlign: "left",
        phoneImage: null,
        phoneSize: "100",
        phoneAlign: "right",
        color: "#0F172A",
        padding: "12",
        menuEnabled: false,
        menus: [],
        menuFont: "pretendard",
    },
    sections: [],
    subPages: [],
    subMenus: {
        bgColor: "",
        textColor: "#334155",
        font: "pretendard",
        padding: "",
        items: [{ id: "m-1", name: "e-모델하우스", link: "e-modelhouse" }],
    },
    popupImage: null,
    info: {
        siteName: "",
        dbTitle: "",
        inviteText: "",
        inviteVisible: "off",
        belowInviteVisible: "off",
        buttonText: "",
        businessCardImage: null,
    },
    bottomFixed: {
        height: "64",
        font: "pretendard",
        phone: {
            enabled: false,
            mode: "text",
            image: null,
            text: "전화 상담",
            bgColor: "#0F172A",
            textColor: "#FFFFFF",
            link: "",
        },
        consult: {
            enabled: false,
            mode: "text",
            image: null,
            text: "온라인 상담",
            bgColor: "#2563EB",
            textColor: "#FFFFFF",
            link: "",
        },
    },
    countdown: {
        title: "이벤트 마감까지",
        deadline: "",
        applicantsCount: "0",
        bgColor: "#2563EB",
        textColor: "#FFFFFF",
        font: "pretendard",
        position: "top",
        sticky: false,
    },
    quickConnect: {
        kakao: { enabled: false, url: "" },
        sms: { enabled: false, phone: "" },
    },
    location: {
        address: "",
        embedUrl: "",
    },
    footer: {
        company: "",
        ceo: "",
        bizNumber: "",
        phone: "",
        font: "pretendard",
    },
    privacyPolicy: "",
    completeMessage: "",
    enabled: {
        header: true,
        sections: true,
        subMenus: true,
        popup: false,
        fixedImage: false,
        privacy: true,
        bottomFixed: false,
        countdown: false,
        quickConnect: false,
        location: false,
    },
};

export const uid = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
