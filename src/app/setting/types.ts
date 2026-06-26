// 헤더 스크롤 동작 모드:
// - fix: 항상 상단에 고정 (sticky)
// - nonfix: 페이지 최상단에만 위치, 스크롤 시 함께 사라짐 (in-flow)
// - interaction: 최상단에 위치하다 스크롤 다운 시 고정 헤더가 슬라이드 인 / 업 시 슬라이드 아웃
export type HeaderStyle = "fix" | "nonfix" | "interaction";
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
    | "gallery"
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
export type HeroTextPosition = "top" | "center" | "bottom";
export type CountdownPosition = "top" | "bottom" | "floating";
export type BottomSlotMode = "image" | "text";
// 클릭 시 동작 — "url" 은 link 로 이동, "form" 은 페이지 내 마지막 폼으로 스크롤.
export type FixedLinkType = "url" | "form";

export type BottomSlot = {
    enabled: boolean;
    mode: BottomSlotMode;
    image: string | null;
    text: string;
    bgColor: string;
    textColor: string;
    link: string;
    linkType?: FixedLinkType;
};

// 옛 contentList 항목 한 개의 원본 형태 (formInviteImg, formButtonImg, formAgree 등
// 새 에디터 UI엔 노출 안 되지만 저장 시 보존해야 하는 키들).
export type LegacyContentItem = Record<string, unknown>;

// gallery(여러 이미지) 섹션의 항목.
// - id: 드래그 정렬 안정성을 위한 고유 키 (URL 중복 가능성 회피)
// - image: 이미지 url
// - legacy: 옛 imgList 항목 원본 (url 외 부가 키 보존)
export type GalleryImage = {
    id: string;
    image: string;
    legacy?: Record<string, unknown>;
};

export type Section = {
    id: string;
    type: SectionType;
    title: string;
    image: string | null;
    images?: GalleryImage[];           // gallery 타입에서 사용 (드래그로 순서 변경 가능)
    content: string;
    link?: string;                     // 이미지 클릭 시 이동할 URL (옛 formInviteImg 등)
    effect?: ImageEffect;
    animation?: SectionAnimation;
    textPosition?: HeroTextPosition;
    formVariant?: FormVariant;
    formData?: FormSectionData;
    legacy?: {
        contentListIndex: number;       // 원본 contentList 의 몇 번째 항목에서 왔는지
        sourceItem: LegacyContentItem;  // 해당 contentList 항목 통째로
        imgListIndex?: number;          // imgList 에서 왔다면 몇 번째 이미지인지
        role?: "form-invite";           // form 의 formInviteImg 에서 추출된 image 섹션 표식
    };
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
    legacy?: {
        sourceMenu: Record<string, unknown>;  // ld_json_menus.menus[i] 통째로
        menuIndex: number;
    };
};

export type FormSectionData = {
    // 폼 박스 상단 "양식 제목" 영역을 텍스트로 보일지 이미지로 보일지.
    // 기본값은 "text" — 비어있으면 양식 종류별 기본 문구가 placeholder 로 노출.
    // "image" 면 Section.image (옛 formSubjectImg) 로 렌더.
    subjectType?: "text" | "image";
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
    // === 옛 land 호환 옵션 ===
    fixedBottom?: "fixed" | "nonfixed";  // 폼 박스를 화면 하단에 고정할지
    buttonType?: "image" | "text";        // 제출 버튼을 이미지/텍스트 중 어느 걸로 표시
    buttonImage?: string | null;          // buttonType='image' 일 때 사용 (옛 formButtonImg)
    agreeMode?: "use" | "notuse";         // 개인정보 동의 사용 여부 (옛 formAgree)
    agreeAddWords?: string[];             // 개인정보 하단 추가 문구 (옛 formAgreeAddWord)
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

// 옛 land 컬럼 중 새 Settings UI에는 노출되지 않지만 라운드트립으로
// 보존해야 하는 값들. 라이브 SvelteKit 사이트가 계속 읽기 때문에 절대 잃으면 안 됨.
export type LegacyFields = {
    fixedImage?: string | null;  // ld_invite_image (우측 고정 원형 이미지)
    smsContent?: string;          // ld_sms_content (문자내용)
    managerEmail?: string;        // ld_manager_email
    site?: string;                // ld_site
    menu?: string;                // ld_menu
    location?: string;            // ld_location (텍스트, ld_json_location.address와 별도)
    ftAddress?: string;           // ld_ft_address
    viewType?: string;            // ld_view_type
    // 새 에디터가 일부만 수정한 경우, 옛 JSON 컬럼 원본 보존
    rawJsonMain?: string;         // ld_json_main 원본 (contentList 구조)
    rawJsonHeader?: string;       // ld_json_header 원본
    rawJsonMenus?: string;        // ld_json_menus 원본
    rawFooter?: string;           // ld_footer 원본 (파이프 문자열)
    rawPg0?: string;
    rawPg1?: string;
    rawPg2?: string;
    rawPg3?: string;
    rawPg4?: string;
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
        phoneNumber: string;  // 전화번호 이미지 클릭 시 연결할 tel: 번호

        color: string;
        padding: string;
        menuEnabled: boolean;
        menus: MenuItem[];
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
        fixedImage: string | null;       // 우측 고정 원형 이미지 (옛 ld_invite_image)
        fixedImageLink: string;          // 클릭 시 이동할 url (linkType === "url" 일 때)
        fixedImageLinkType: FixedLinkType; // "url" 외 이동 / "form" 페이지 마지막 폼으로 스크롤
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
        sms: { enabled: boolean; phone: string; content: string };
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
    legacy?: LegacyFields;
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
    gallery: "여러 이미지",
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

// 커스텀 필드 타입별 동작 메타데이터 (라벨 · 에디터/프리뷰 분기의 단일 소스)
// - label: 에디터의 타입 선택 옵션 라벨
// - inputType: 프리뷰에서 일반 input으로 렌더할 때의 HTML type
//   (checkbox/textarea/select/radio 는 별도 위젯으로 렌더되어 사용되지 않음)
// - hasPlaceholder: 에디터에서 placeholder 입력 노출 여부
// - hasOptions: 옵션 목록(select/radio)을 가지는지 — 에디터의 옵션 입력 / 프리뷰의 옵션 렌더 분기
export const CUSTOM_FIELD_TYPE_META: Record<
    CustomFieldType,
    {
        label: string;
        inputType: string;
        hasPlaceholder: boolean;
        hasOptions: boolean;
    }
> = {
    text: { label: "텍스트", inputType: "text", hasPlaceholder: true, hasOptions: false },
    tel: { label: "전화번호", inputType: "tel", hasPlaceholder: true, hasOptions: false },
    email: { label: "이메일", inputType: "email", hasPlaceholder: true, hasOptions: false },
    number: { label: "숫자", inputType: "number", hasPlaceholder: true, hasOptions: false },
    date: { label: "날짜", inputType: "date", hasPlaceholder: false, hasOptions: false },
    time: { label: "시간", inputType: "time", hasPlaceholder: false, hasOptions: false },
    select: { label: "셀렉트", inputType: "text", hasPlaceholder: false, hasOptions: true },
    radio: { label: "라디오", inputType: "text", hasPlaceholder: false, hasOptions: true },
    textarea: { label: "긴 텍스트", inputType: "text", hasPlaceholder: true, hasOptions: false },
    checkbox: { label: "체크박스", inputType: "text", hasPlaceholder: false, hasOptions: false },
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
        phoneNumber: "",
        color: "#0F172A",
        padding: "12",
        menuEnabled: false,
        menus: [],
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
        fixedImage: null,
        fixedImageLink: "",
        fixedImageLinkType: "url",
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
        sms: { enabled: false, phone: "", content: "" },
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
