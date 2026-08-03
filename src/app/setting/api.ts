import {
  BottomSlotMode,
  FixedImageEffect,
  GalleryImage,
  HeroTextPosition,
  ImageEffect,
  initialSettings,
  FontKey,
  MenuFontWeight,
  LegacyContentItem,
  Section,
  SectionAnimation,
  Settings,
  SubPage,
} from "./types";
import { normalizeColor } from "./color";

const LIST_URL = "/api/test";
const ASSET_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE ?? "").replace(
  /\/+$/,
  "",
);

type Land = Record<string, unknown> & { ld_domain?: string };

async function readBody(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("application/json") ? await res.json() : await res.text();
}

function asError(body: unknown): string {
  return typeof body === "string" ? body : JSON.stringify(body);
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// 나타나는 효과(섹션 애니메이션) 라운드트립.
// 라이브 사이트는 on/off(`effect`)만 이해하므로 그건 계속 쓰되,
// 구체적 종류(slide-up · zoom-in 등)는 신규 키 `effectType` 로 별도 저장/복원한다.
const ANIMATION_VALUES: SectionAnimation[] = [
  "none",
  "fade-in",
  "slide-up",
  "slide-right",
  "slide-left",
  "zoom-in",
  "zoom-out",
];

function parseAnimation(rec: Record<string, unknown>): SectionAnimation {
  const t = asString(rec.effectType);
  if (t && (ANIMATION_VALUES as string[]).includes(t)) {
    return t as SectionAnimation;
  }
  // 구버전 데이터: effect on/off 만 있고 종류 정보가 없다.
  // 옛 렌더러는 on 이면 '아래서 위로 올라오기' 한 가지만 그렸으므로 slide-up 으로 매핑한다.
  // (fade-in 으로 두면 기존 사이트들이 편집기에서 실제와 다르게 보이고,
  //  한 번 저장하면 effectType: "fade-in" 이 박혀 원래 모습을 잃는다.)
  return asString(rec.effect) === "on" ? "slide-up" : "none";
}

// 메인 배너 전용 키들의 파서. 알 수 없는 값이면 에디터 기본값으로 폴백.
const HERO_TEXT_POSITIONS: HeroTextPosition[] = ["top", "center", "bottom"];

function parseHeroTextPosition(v: unknown): HeroTextPosition {
  const s = asString(v);
  return (HERO_TEXT_POSITIONS as string[]).includes(s)
    ? (s as HeroTextPosition)
    : "center";
}

const IMAGE_EFFECTS: ImageEffect[] = [
  "none",
  "shadow",
  "rounded",
  "grayscale",
  "sepia",
  "blur",
  "hover-zoom",
  "gradient",
];

function parseImageEffect(v: unknown): ImageEffect {
  const s = asString(v);
  return (IMAGE_EFFECTS as string[]).includes(s) ? (s as ImageEffect) : "none";
}

// 하단 고정바 슬롯의 표시 방식. 저장된 값이 없거나 이상하면 fallback(옛 컬럼 기반 유추).
function parseBottomMode(v: unknown, fallback: BottomSlotMode): BottomSlotMode {
  const s = asString(v);
  return s === "image" || s === "text" ? s : fallback;
}

const MENU_FONT_WEIGHTS: MenuFontWeight[] = [
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
];

function parseMenuFontWeight(v: unknown): MenuFontWeight {
  const s = asString(v);
  return (MENU_FONT_WEIGHTS as string[]).includes(s)
    ? (s as MenuFontWeight)
    : initialSettings.subMenus.fontWeight;
}

// 불리언 설정 — 저장된 값이 없으면(옛 행) 기본값. 명시된 false 는 그대로 존중.
function parseBool(rec: Record<string, unknown>, key: string, dflt: boolean) {
  return key in rec ? !!rec[key] : dflt;
}

const FIXED_IMAGE_EFFECTS: FixedImageEffect[] = [
  "none",
  "blink",
  "bounce",
  "shake",
  "pulse",
  "glow",
];

// 저장된 값이 없으면(= 옛 DB 행) 옛 렌더러의 기본 동작인 깜빡임으로 복원한다.
// "없음"으로 두면 기존 사이트들이 편집기·라이브에서 실제와 다르게 보이고,
// 그 상태로 한 번 저장하면 원래 동작을 잃는다. (parseAnimation 과 같은 이유)
// 값이 명시돼 있으면 "none" 포함 그대로 따른다.
function parseFixedImageEffect(rec: Record<string, unknown>): FixedImageEffect {
  if (!("fixedImageEffect" in rec)) return "blink";
  const s = asString(rec.fixedImageEffect);
  return (FIXED_IMAGE_EFFECTS as string[]).includes(s)
    ? (s as FixedImageEffect)
    : "none";
}

function tryParseJson(v: unknown): unknown {
  if (typeof v !== "string") return v ?? null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function pickRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

// 옛 DB 에는 '이미지 없음'이 빈 문자열이 아니라 "0" · "null" 같은 값으로 들어 있는
// 행이 있다. 옛 렌더러는 이런 값을 없는 것으로 취급했지만 그대로 URL 로 만들어버리면
// 깨진 이미지가 남는다 (예: 원본엔 안 뜨던 팝업이 이미지 없는 빈 창으로 뜸).
const EMPTY_ASSET_SENTINELS = new Set([
  "0",
  "null",
  "undefined",
  "none",
  "false",
  "-",
  "#",
]);

function resolveAsset(path: string): string | null {
  const p = path.trim();
  if (!p || EMPTY_ASSET_SENTINELS.has(p.toLowerCase())) return null;
  if (/^(https?:|data:|blob:)/i.test(p) || p.startsWith("/")) {
    return p;
  }
  return ASSET_BASE ? `${ASSET_BASE}/${p}` : p;
}

// ── 옛 관리자와 ld_json_main 을 공유하기 위한 사이드카 메타 ────────────────────
// 옛 관리자 페이지가 저장하면 contentList 를 통째로 다시 쓰면서 신규 키
// (sectionType · heroText · effectType · imgEffect …) 를 전부 날려버린다.
// 그러면 메인 배너 · 유튜브 · HTML 섹션이 통째로 사라지고 제목 · 애니메이션 종류가
// 리셋된다. 그래서 같은 값을 옛 관리자가 모르는 컬럼(ld_json_secmeta)에 복사해 두고,
// 읽을 때 contentList 위에 덮어써서 복구한다.
//
// 인덱스가 어긋나면(옛 관리자가 섹션을 추가 · 삭제 · 재정렬) 엉뚱한 섹션에 메타가
// 붙으므로, 저장 시 contentList 의 '모양'을 함께 기록해 두고 읽을 때 대조한다.
// 다르면 사이드카를 통째로 버리고 contentList 만으로 파싱한다(= 사이드카 이전 동작).
// 본문 문구나 이미지 URL 은 모양에 넣지 않는다 — 옛 관리자에서 텍스트만 고쳤다고
// 애니메이션까지 날릴 이유는 없다.
const SECMETA_KEYS = [
  "sectionType",
  "sectionTitle",
  "heroText",
  "heroTextPos",
  "imgEffect",
  "effectType",
  "videoUrl",
  "inviteTitle",
] as const;

// imgList 항목 하나가 섹션 하나인 경우(이미지 섹션)의 항목별 키.
const SECMETA_IMG_KEYS = ["secTitle", "imgEffect"] as const;

function contentShape(contentList: unknown[]): string {
  return contentList
    .map((item) => {
      const rec = pickRecord(item);
      if (Array.isArray(rec.imgList)) return `img:${rec.imgList.length}`;
      if (Array.isArray(rec.formList)) return "form";
      if (asString(rec.text) || asString(rec.content)) return "text";
      return "other";
    })
    .join(",");
}

function buildSecMeta(contentList: unknown[]): string {
  const items: Record<string, Record<string, unknown>> = {};
  contentList.forEach((item, idx) => {
    const rec = pickRecord(item);
    const meta: Record<string, unknown> = {};
    for (const k of SECMETA_KEYS) {
      if (rec[k] !== undefined) meta[k] = rec[k];
    }
    if (Array.isArray(rec.imgList)) {
      const imgItems = rec.imgList.map((g) => {
        const gr = pickRecord(g);
        const one: Record<string, unknown> = {};
        for (const k of SECMETA_IMG_KEYS) {
          if (gr[k] !== undefined) one[k] = gr[k];
        }
        return one;
      });
      if (imgItems.some((o) => Object.keys(o).length > 0)) meta.imgItems = imgItems;
    }
    if (Object.keys(meta).length > 0) items[String(idx)] = meta;
  });
  return JSON.stringify({ v: 1, shape: contentShape(contentList), items });
}

function parseSecMeta(
  raw: unknown,
  contentList: unknown[],
): Record<number, Record<string, unknown>> {
  const rec = pickRecord(tryParseJson(raw));
  if (rec.v !== 1) return {};
  // 모양이 달라졌으면 인덱스를 못 믿는다 → 사이드카 폐기.
  if (asString(rec.shape) !== contentShape(contentList)) return {};
  const out: Record<number, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(pickRecord(rec.items))) {
    const i = Number(k);
    if (Number.isInteger(i)) out[i] = pickRecord(v);
  }
  return out;
}

function contentListToSections(
  contentList: unknown[],
  meta: Record<number, Record<string, unknown>> = {},
): Section[] {
  const out: Section[] = [];
  contentList.forEach((item, idx) => {
    // 사이드카 메타를 contentList 항목 위에 덮어쓴 뒤 기존 파싱 로직을 그대로 태운다.
    // (옛 관리자가 키를 지웠어도 여기서 되살아난다)
    let rec = pickRecord(item);
    const m = meta[idx];
    if (m) {
      rec = { ...rec, ...m };
      delete rec.imgItems;
      if (Array.isArray(m.imgItems) && Array.isArray(rec.imgList)) {
        const imgItems = m.imgItems;
        rec.imgList = rec.imgList.map((g, i) => ({
          ...pickRecord(g),
          ...pickRecord(imgItems[i]),
        }));
      }
    }
    const sourceItem: LegacyContentItem = rec;
    const animated = parseAnimation(rec);

    // 메인 배너(hero). 옛 포맷엔 전용 슬롯이 없어 imgList 한 장 + `sectionType: "hero"`
    // 표식으로 저장한다. imgList 분기보다 먼저 봐야 갤러리로 오인되지 않음.
    // 이미지가 비어 있어도(placeholder 미교체 등) 섹션 자체는 살려둔다 —
    // 여기서 걸러버리면 배너가 통째로 사라진다.
    if (asString(rec.sectionType) === "hero") {
      const first = Array.isArray(rec.imgList)
        ? pickRecord(rec.imgList[0])
        : {};
      out.push({
        id: `sec-${idx}-hero`,
        type: "hero",
        title: asString(rec.sectionTitle),
        image: resolveAsset(asString(first.url)),
        content: asString(rec.heroText),
        textPosition: parseHeroTextPosition(rec.heroTextPos),
        effect: parseImageEffect(rec.imgEffect),
        animation: animated,
        legacy: { contentListIndex: idx, sourceItem },
      });
      return;
    }

    // 이미지 섹션. 표식이 없으면 아래 imgList 분기에서 갤러리 한 개로 합쳐져
    // 타입이 뒤바뀐다. imgList 항목 하나가 섹션 하나이므로 제목·꾸미기도 항목에서 읽음.
    if (asString(rec.sectionType) === "image") {
      const imgList = Array.isArray(rec.imgList) ? rec.imgList : [];
      imgList.forEach((img, i) => {
        const imgRec = pickRecord(img);
        out.push({
          id: `sec-${idx}-img-${i}`,
          type: "image",
          title: asString(imgRec.secTitle),
          image: resolveAsset(asString(imgRec.url)),
          content: "",
          effect: parseImageEffect(imgRec.imgEffect),
          animation: animated,
          legacy: { contentListIndex: idx, sourceItem, imgListIndex: i },
        });
      });
      return;
    }

    if (asString(rec.sectionType) === "youtube") {
      out.push({
        id: `sec-${idx}-youtube`,
        type: "youtube",
        title: asString(rec.sectionTitle),
        image: null,
        content: asString(rec.videoUrl),
        animation: animated,
        legacy: { contentListIndex: idx, sourceItem },
      });
      return;
    }

    if (asString(rec.sectionType) === "html") {
      out.push({
        id: `sec-${idx}-html`,
        type: "html",
        title: asString(rec.sectionTitle),
        image: null,
        content: asString(rec.text),
        animation: animated,
        legacy: { contentListIndex: idx, sourceItem },
      });
      return;
    }

    if (Array.isArray(rec.imgList) && rec.imgList.length > 0) {
      const images: GalleryImage[] = rec.imgList.flatMap((img, i) => {
        const imgRec = pickRecord(img);
        const url = asString(imgRec.url);
        if (!url) return [];
        const resolved = resolveAsset(url);
        if (!resolved) return [];
        return [{ id: `sec-${idx}-img-${i}`, image: resolved, legacy: imgRec }];
      });
      // 표식이 있는(= 새 에디터가 저장한) 갤러리는 이미지가 전부 비어도 섹션을 유지한다.
      // 구버전 데이터는 종전대로 빈 항목을 버림 — 옛 행에서 빈 섹션이 되살아나지 않게.
      if (images.length > 0 || asString(rec.sectionType) === "gallery") {
        out.push({
          id: `sec-${idx}-gallery`,
          type: "gallery",
          title: asString(rec.sectionTitle),
          image: null,
          images,
          content: "",
          effect: parseImageEffect(rec.imgEffect),
          animation: animated,
          legacy: { contentListIndex: idx, sourceItem },
        });
      }
      return;
    }

    if (Array.isArray(rec.formList) && rec.formList.length > 0) {
      // formInviteImg 는 폼 위에 별도 클릭 가능 배너로 노출되는 컨텐츠 → 독립 image 섹션
      const inviteImg = resolveAsset(asString(rec.formInviteImg));
      if (inviteImg) {
        out.push({
          id: `sec-${idx}-invite`,
          type: "image",
          title: asString(rec.inviteTitle),
          image: inviteImg,
          content: "",
          link: "/sms",
          legacy: {
            contentListIndex: idx,
            sourceItem,
            role: "form-invite",
          },
        });
      }
      // 폼 박스 자체 — 양식 제목은 텍스트(formSubject) / 이미지(formSubjectImg) 둘 중 하나.
      // 이미지가 있으면 이미지 모드로, 없으면 텍스트 모드(default).
      const subjectImg = resolveAsset(asString(rec.formSubjectImg));
      const subjectText = asString(rec.formSubject);
      const subjectType: "text" | "image" = subjectImg ? "image" : "text";
      const fixedBottom =
        asString(rec.fixedBottom) === "fixed" ? "fixed" : "nonfixed";
      const buttonTypeRaw = asString(rec.formButtonType);
      const buttonType: "image" | "text" =
        buttonTypeRaw === "image" ? "image" : "text";
      const agreeMode: "use" | "notuse" =
        asString(rec.formAgree) === "use" ? "use" : "notuse";
      const agreeAddWords = Array.isArray(rec.formAgreeAddWord)
        ? (rec.formAgreeAddWord as unknown[]).map((w) => asString(w))
        : [];
      out.push({
        id: `sec-${idx}-form`,
        type: "form",
        title: asString(rec.sectionTitle),
        image: subjectImg,
        content: "",
        formVariant: "consult",
        formData: {
          subjectType,
          title: subjectText || undefined,
          submitLabel: asString(rec.formButtonText) || undefined,
          buttonColor: asString(rec.formButtonColor) || undefined,
          fixedBottom,
          buttonType,
          buttonImage: resolveAsset(asString(rec.formButtonImg)),
          agreeMode,
          agreeAddWords,
        },
        animation: animated,
        legacy: { contentListIndex: idx, sourceItem },
      });
      return;
    }

    const text = asString(rec.text) || asString(rec.content);
    if (text) {
      out.push({
        id: `sec-${idx}-text`,
        type: "text",
        title: asString(rec.sectionTitle),
        image: null,
        content: text,
        animation: animated,
        legacy: { contentListIndex: idx, sourceItem },
      });
    }
  });
  return out;
}

function menuToSubPage(menu: unknown, index: number): SubPage {
  const rec = pickRecord(menu);
  const imgArr = Array.isArray(rec.imgArr) ? rec.imgArr : [];
  const animated = parseAnimation(rec);
  const images: GalleryImage[] = imgArr.flatMap((u, i) => {
    const url = asString(u);
    if (!url) return [];
    const resolved = resolveAsset(url);
    if (!resolved) return [];
    return [{ id: `pg-menu-${index}-img-${i}`, image: resolved }];
  });
  return {
    id: `pg-menu-${index}`,
    slug: asString(rec.link) || `page-${index + 1}`,
    title: asString(rec.name) || `페이지 ${index + 1}`,
    sections:
      images.length > 0
        ? [
            {
              id: `pg-menu-${index}-gallery`,
              type: "gallery" as const,
              title: "",
              image: null,
              images,
              content: "",
              effect: "none" as const,
              animation: animated,
            },
          ]
        : [],
    legacy: { sourceMenu: rec, menuIndex: index },
  };
}

function parsePgSlot(raw: unknown, index: number): SubPage | null {
  const parsed = tryParseJson(raw);
  if (!parsed) return null;

  // 1) 이미 새 SubPage 형태로 저장된 경우
  const rec = pickRecord(parsed);
  if (Array.isArray(rec.sections)) {
    return {
      id: asString(rec.id) || `pg-slot-${index}`,
      slug: asString(rec.slug) || `slot-${index + 1}`,
      title: asString(rec.title) || `슬롯 ${index + 1}`,
      sections: rec.sections as Section[],
      legacy: { sourceMenu: rec, menuIndex: -1 - index },
    };
  }

  // 2) ld_json_main 과 같은 구조 (배열의 첫 항목 contentList)
  if (Array.isArray(parsed) && parsed.length > 0) {
    const first = pickRecord(parsed[0]);
    if (Array.isArray(first.contentList)) {
      return {
        id: `pg-slot-${index}`,
        slug: `slot-${index + 1}`,
        title: `슬롯 ${index + 1}`,
        sections: contentListToSections(first.contentList),
        legacy: { sourceMenu: first, menuIndex: -1 - index },
      };
    }
  }
  return null;
}

function parseFooterLine(line: string): {
  company: string;
  ceo: string;
  bizNumber: string;
  phone: string;
} {
  const parts = line
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  const out = { company: "", ceo: "", bizNumber: "", phone: "" };
  if (parts.length === 0) return out;

  out.company = parts[0];

  for (const chunk of parts.slice(1)) {
    const [rawKey, ...rest] = chunk.split(":");
    const key = rawKey.trim();
    const value = rest.join(":").trim();
    if (!value) continue;

    if (/대표\s*번호|전화|연락처|tel|phone/i.test(key)) {
      out.phone = value;
    } else if (/사업자|법인/i.test(key)) {
      out.bizNumber = value;
    } else if (/대표(?!\s*번호)|담당자|ceo/i.test(key)) {
      out.ceo = value;
    }
  }
  return out;
}

function landToSettings(land: Land): Settings {
  const header = pickRecord(tryParseJson(land.ld_json_header));
  const menusJson = pickRecord(tryParseJson(land.ld_json_menus));
  const menusArr = Array.isArray(menusJson.menus) ? menusJson.menus : [];
  const footer = parseFooterLine(asString(land.ld_footer));

  const mainJson = tryParseJson(land.ld_json_main);
  const mainFirst = Array.isArray(mainJson)
    ? pickRecord(mainJson[0])
    : pickRecord(mainJson);
  const mainContentList = Array.isArray(mainFirst.contentList)
    ? mainFirst.contentList
    : [];
  const sections = contentListToSections(
    mainContentList,
    parseSecMeta(land.ld_json_secmeta, mainContentList),
  );

  // ld_json_subpages 가 우선 — 신규 에디터가 source of truth 로 쓰는 컬럼.
  // 마이그레이션 전 / 신규 생성 row 라 NULL 이면 옛 ld_json_menus + ld_pg* 로 폴백.
  const rawSubpages = tryParseJson(land.ld_json_subpages);
  const subPagesFromColumn = Array.isArray(rawSubpages)
    ? transformSubPagesUrls(rawSubpages as SubPage[], (u) => resolveAsset(u))
    : null;
  const subPagesFromMenus = menusArr.map((m, i) => menuToSubPage(m, i));
  const subPagesFromSlots = (["ld_pg0", "ld_pg1", "ld_pg2", "ld_pg3", "ld_pg4"] as const)
    .map((k, i) => parsePgSlot(land[k], i))
    .filter((p): p is SubPage => p !== null);
  const subPages = subPagesFromColumn ?? [
    ...subPagesFromMenus,
    ...subPagesFromSlots,
  ];

  // 마이그레이션으로 추가될 JSON 컬럼들 (현재는 없을 수 있음)
  const jsonBottom = pickRecord(tryParseJson(land.ld_json_bottom));
  const jsonCountdown = pickRecord(tryParseJson(land.ld_json_countdown));
  const jsonEnabled = pickRecord(tryParseJson(land.ld_json_enabled));
  const jsonFooter = pickRecord(tryParseJson(land.ld_json_footer));
  const jsonLocation = pickRecord(tryParseJson(land.ld_json_location));
  // 옛 스키마에 대응하는 자리가 없는 신규 설정들의 보관소.
  const jsonInfo = pickRecord(tryParseJson(land.ld_json_info));
  const jsonInfoMenu = pickRecord(jsonInfo.menu);

  const popupImage = resolveAsset(asString(land.ld_popup_img));
  const hasKakao = !!asString(land.ld_kakao);
  const hasSms = !!asString(land.ld_sms_num);
  const bottomPhoneImg = resolveAsset(asString(land.ld_mobile_bt_phone_img));
  const bottomConsultImg = resolveAsset(asString(land.ld_mobile_bt_event_img));
  const jsonBottomPhone = pickRecord(jsonBottom.phone);
  const jsonBottomConsult = pickRecord(jsonBottom.consult);
  const hasBottomData =
    !!bottomPhoneImg || !!bottomConsultImg || Object.keys(jsonBottom).length > 0;

  return {
    ...initialSettings,
    domain: asString(land.ld_domain, initialSettings.domain),
    headerStyle: (() => {
      const v = asString(land.ld_Interaction).toLowerCase();
      if (v === "interaction") return "interaction";
      if (v === "nonfix") return "nonfix";
      return "fix";
    })(),
    font: (asString(land.ld_font) || initialSettings.font) as Settings["font"],
    contentFont: (asString(jsonFooter.mainFont) || undefined) as
      | Settings["contentFont"]
      | undefined,
    siteDescription: asString(land.ld_description),
    additionalScript: asString(land.ld_add_scripts),
    header: {
      ...initialSettings.header,
      logoImage: resolveAsset(
        asString(header.logo_img) || asString(land.ld_logo),
      ),
      logoSize: asString(header.logo_width, initialSettings.header.logoSize),
      phoneImage: resolveAsset(
        asString(header.phone_img) || asString(land.ld_ph_img),
      ),
      phoneSize: asString(
        header.top_phone_width,
        initialSettings.header.phoneSize,
      ),
      phoneNumber: asString(header.phone_num),
      color: normalizeColor(
        asString(header.header_color),
        initialSettings.header.color,
      ),
      padding: asString(
        header.header_padding,
        initialSettings.header.padding,
      ),
      // 옛 ld_json_menus.menus 가 라이브 사이트의 헤더 아래 strip 의 메뉴들 = header.menus
      // (이름이 "하부 메뉴들" 이라 헷갈렸지만 위치는 헤더 바로 아래)
      // menu_enabled 가 저장돼 있으면 그 값을, 없으면 메뉴 개수로 폴백.
      // (옛 데이터엔 menu_enabled 키가 없으므로 폴백 필요)
      menuEnabled:
        typeof header.menu_enabled === "boolean"
          ? header.menu_enabled
          : menusArr.length > 0,
      menus: menusArr.map((m, i) => {
        const rec = pickRecord(m);
        return {
          id: `m-${i}`,
          name: asString(rec.name),
          link: asString(rec.link),
          linkType: "subpage" as const,
        };
      }),
    },
    sections,
    subPages,
    subMenus: {
      // 옛 ld_json_menus 의 color/padding_y 는 헤더 strip 의 스타일링이지만
      // 일단 subMenus 스타일 컨테이너에 보존 (SubMenuBar 가 이걸 참고함)
      ...initialSettings.subMenus,
      bgColor: normalizeColor(
        asString(menusJson.color),
        initialSettings.subMenus.bgColor,
      ),
      padding: asString(menusJson.padding_y, initialSettings.subMenus.padding),
      // 메뉴 테두리 · 글자 설정은 옛 스키마에 없던 값 → ld_json_info 에 보관.
      // 값이 없는 옛 행은 기본값(하단 테두리만 1px, 지금까지 보이던 모습)으로.
      borderTop: parseBool(
        jsonInfoMenu,
        "borderTop",
        initialSettings.subMenus.borderTop,
      ),
      borderBottom: parseBool(
        jsonInfoMenu,
        "borderBottom",
        initialSettings.subMenus.borderBottom,
      ),
      borderWidth: asString(jsonInfoMenu.borderWidth),
      borderColor: normalizeColor(asString(jsonInfoMenu.borderColor), ""),
      fontSize: asString(jsonInfoMenu.fontSize),
      fontWeight: parseMenuFontWeight(jsonInfoMenu.fontWeight),
      font: (asString(jsonInfoMenu.font) ||
        initialSettings.subMenus.font) as FontKey,
      items: [], // 옛 데이터엔 별도 subMenus 없음 — header.menus 가 진짜 메뉴
    },
    popupImage,
    info: {
      ...initialSettings.info,
      siteName: asString(land.ld_name),
      dbTitle: asString(land.ld_db_input_subject),
      inviteText: asString(land.ld_invite_message),
      inviteVisible:
        asString(land.ld_invite_bool) === "on" ? "on" : "off",
      belowInviteVisible:
        asString(land.ld_reserve_msg_bool) === "on" ? "on" : "off",
      buttonText: asString(land.ld_btn_message),
      businessCardImage: resolveAsset(asString(land.ld_card_image)),
      fixedImage: resolveAsset(asString(land.ld_invite_image)),
      fixedImageLink: asString(land.ld_invite_image_link),
      fixedImageLinkType:
        asString(land.ld_invite_image_link_type) === "form" ? "form" : "url",
      fixedImageEffect: parseFixedImageEffect(jsonInfo),
    },
    bottomFixed: {
      ...initialSettings.bottomFixed,
      height: asString(
        jsonBottom.height,
        initialSettings.bottomFixed.height,
      ),
      font: (asString(jsonBottom.font) ||
        initialSettings.bottomFixed.font) as Settings["bottomFixed"]["font"],
      // enabled · mode 는 ld_json_bottom 에 저장된 값이 우선.
      // 예전엔 옛 컬럼(ld_mobile_bt_*_img · ld_phone_num)에서만 유추했는데,
      // 그러면 "이미지 없이 텍스트 버튼만" 구성한 경우 저장은 되지만 다시 불러올 때
      // enabled 가 false 로 덮여 하단바가 통째로 사라졌다.
      // 키가 없는 구버전 행은 종전대로 옛 컬럼에서 유추한다.
      phone: {
        ...initialSettings.bottomFixed.phone,
        ...jsonBottomPhone,
        // 구버전 행의 유추 기준은 '이미지 AND 번호' 둘 다다. 옛 사이트 10곳을
        // 대조해 확인했다 (Svelte 의 렌더/미렌더 표식 <!--[--> vs <!--[!-->):
        //   번호 O · 이미지 O → 렌더  (dusan, yangju, jeungpo5, ssangyong)
        //   번호 X · 이미지 O → 미렌더 (platinumcj, thesharp, rayonecity, icjjhl, theest)
        //   번호 O · 이미지 X → 미렌더 (testsite1)
        // 어느 한쪽만 보면 옛 사이트엔 없던 버튼이 생긴다 —
        // 이미지만 보면 번호 없는 13개 행에, 번호만 보면 이미지 없는 행에 생긴다.
        enabled:
          "enabled" in jsonBottomPhone
            ? !!jsonBottomPhone.enabled
            : !!bottomPhoneImg && !!asString(land.ld_phone_num),
        mode: parseBottomMode(
          jsonBottomPhone.mode,
          bottomPhoneImg ? "image" : "text",
        ),
        image: bottomPhoneImg || asString(jsonBottomPhone.image) || null,
        link: asString(land.ld_phone_num) || asString(jsonBottomPhone.link),
      },
      consult: {
        ...initialSettings.bottomFixed.consult,
        ...jsonBottomConsult,
        enabled:
          "enabled" in jsonBottomConsult
            ? !!jsonBottomConsult.enabled
            : !!bottomConsultImg,
        mode: parseBottomMode(
          jsonBottomConsult.mode,
          bottomConsultImg ? "image" : "text",
        ),
        image: bottomConsultImg || asString(jsonBottomConsult.image) || null,
      },
    },
    countdown: {
      ...initialSettings.countdown,
      title: asString(jsonCountdown.title, initialSettings.countdown.title),
      deadline: asString(jsonCountdown.deadline),
      applicantsCount: asString(
        jsonCountdown.applicantsCount,
        initialSettings.countdown.applicantsCount,
      ),
      bgColor: normalizeColor(
        asString(jsonCountdown.bgColor),
        initialSettings.countdown.bgColor,
      ),
      textColor: normalizeColor(
        asString(jsonCountdown.textColor),
        initialSettings.countdown.textColor,
      ),
      font: (asString(jsonCountdown.font) ||
        initialSettings.countdown.font) as Settings["countdown"]["font"],
      position:
        (asString(jsonCountdown.position) as Settings["countdown"]["position"]) ||
        initialSettings.countdown.position,
      sticky: jsonCountdown.sticky === true,
    },
    quickConnect: {
      kakao: { enabled: hasKakao, url: asString(land.ld_kakao) },
      sms: {
        enabled: hasSms,
        phone: asString(land.ld_sms_num),
        content: asString(land.ld_sms_content),
      },
    },
    location: {
      address: asString(jsonLocation.address) || asString(land.ld_location),
      embedUrl: asString(jsonLocation.embedUrl),
    },
    footer: {
      ...initialSettings.footer,
      company: footer.company,
      ceo: asString(jsonFooter.ceo) || footer.ceo || asString(land.ld_ft_name),
      bizNumber: asString(jsonFooter.bizNumber) || footer.bizNumber,
      phone: footer.phone || asString(land.ld_ft_phone),
      font: (asString(jsonFooter.font) ||
        initialSettings.footer.font) as Settings["footer"]["font"],
      bgColor: asString(jsonFooter.bgColor),
      textColor: asString(jsonFooter.textColor),
    },
    privacyPolicy: asString(land.ld_consent_info),
    completeMessage: asString(land.ld_complete_msg),
    enabled: {
      ...initialSettings.enabled,
      header: true,
      sections: sections.length > 0,
      subMenus: false, // 별도 subMenus 데이터 없음 — header.menus 가 메뉴 strip 노출 담당
      popup: !!popupImage,
      fixedImage: !!asString(land.ld_invite_image),
      privacy: asString(land.ld_personal_info_view) === "on",
      bottomFixed: hasBottomData,
      countdown: !!asString(jsonCountdown.deadline),
      // 옛 렌더러엔 떠 있는 카카오·문자 버튼이 없다.
      // ld_sms_num 은 이 버튼의 on/off 가 아니라 /sms 페이지가 쓰는 수신번호라
      // land 114 행 전부에 들어 있다 (ld_kakao 는 0 행). 이걸 근거로 켜면
      // 모든 옛 사이트에 원래 없던 버튼이 생긴다 → 구버전 행에선 끈 채로 둔다.
      // 에디터에서 켠 값(ld_json_enabled)이 있으면 아래 spread 가 덮어쓴다.
      // (번호 자체는 quickConnect.sms.phone 에 그대로 보존돼 켜면 바로 동작)
      quickConnect: false,
      location:
        !!asString(jsonLocation.address) || !!asString(land.ld_location),
      advanced:
        !!asString(land.ld_description) || !!asString(land.ld_add_scripts),
      // ld_json_enabled 가 있으면 위 자동 값들을 덮어씀
      ...(jsonEnabled as Partial<Settings["enabled"]>),
    },
    legacy: {
      fixedImage: resolveAsset(asString(land.ld_invite_image)),
      smsContent: asString(land.ld_sms_content),
      managerEmail: asString(land.ld_manager_email),
      site: asString(land.ld_site),
      menu: asString(land.ld_menu),
      location: asString(land.ld_location),
      ftAddress: asString(land.ld_ft_address),
      viewType: asString(land.ld_view_type),
      rawJsonMain: asString(land.ld_json_main),
      rawJsonHeader: asString(land.ld_json_header),
      rawJsonMenus: asString(land.ld_json_menus),
      rawFooter: asString(land.ld_footer),
      rawPg0: asString(land.ld_pg0),
      rawPg1: asString(land.ld_pg1),
      rawPg2: asString(land.ld_pg2),
      rawPg3: asString(land.ld_pg3),
      rawPg4: asString(land.ld_pg4),
    },
  };
}

export async function getSettings(domain: string): Promise<Settings> {
  const res = await fetch(LIST_URL, { cache: "no-store" });
  const body = await readBody(res);
  if (!res.ok) throw new Error(asError(body));

  const list: Land[] = Array.isArray(body) ? (body as Land[]) : [];
  const land = list.find((row) => row.ld_domain === domain);
  if (!land) throw new Error(`domain '${domain}' not found in /api/test`);

  return landToSettings(land);
}

// resolveAsset의 역연산 — DB에는 ASSET_BASE 떼고 상대 경로만 저장.
// 이미지 업로드 미구현 상태이므로 새로 선택된 파일의 blob:/data: URL 은
// 저장 시 빈 값으로 떨궈서 DB 에 들어가지 않게 함 (기존 저장된 URL 은 그대로 유지).
function stripAssetBase(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return "";
  if (!ASSET_BASE) return url;
  return url.startsWith(ASSET_BASE + "/")
    ? url.slice(ASSET_BASE.length + 1)
    : url;
}

// ld_json_subpages 라운드트립용 — section 내 url 필드 변환.
// 영향 필드: image, images[].image, formData.buttonImage.
function transformSectionUrls(
  section: Section,
  tx: (url: string) => string | null,
): Section {
  const next: Section = { ...section };
  if (next.image) next.image = tx(next.image);
  if (next.images) {
    next.images = next.images.map((g) => ({
      ...g,
      image: tx(g.image) ?? "",
    }));
  }
  if (next.formData?.buttonImage) {
    next.formData = {
      ...next.formData,
      buttonImage: tx(next.formData.buttonImage),
    };
  }
  return next;
}

function transformSubPagesUrls(
  subPages: SubPage[],
  tx: (url: string) => string | null,
): SubPage[] {
  return subPages.map((p) => ({
    ...p,
    sections: p.sections.map((sec) => transformSectionUrls(sec, tx)),
    // children 은 손자 없이 1단만 존재하지만 코드 단순성을 위해 동일 함수로 재귀.
    children: p.children
      ? transformSubPagesUrls(p.children, tx)
      : undefined,
  }));
}

function reconstructFooterLine(s: Settings): string {
  const f = s.footer;
  // 라이브 사이트가 ld_footer 를 한 줄 그대로 출력하므로 동일 포맷으로 재조립.
  // 옛 원본이 있으면 우선 그대로 사용 (사용자가 새 에디터에서 푸터 안 건드렸을 때).
  const raw = s.legacy?.rawFooter ?? "";
  const editedParts = [f.company, f.ceo, f.bizNumber, f.phone].map((v) =>
    asString(v).trim(),
  );
  const rawParts = raw
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  // 단순 휴리스틱: 4개 필드 모두 비어있으면 raw 유지
  if (editedParts.every((v) => !v) && rawParts.length > 0) return raw;
  const out: string[] = [];
  if (f.company) out.push(f.company);
  if (f.phone) out.push(`대표번호 : ${f.phone}`);
  if (f.bizNumber) out.push(`사업자 번호 : ${f.bizNumber}`);
  if (f.ceo) out.push(`개인정보 담당자 : ${f.ceo}`);
  return out.join(" | ");
}

function settingsToHeaderJson(s: Settings): string {
  // 라이브 사이트의 ld_json_header 키 스키마: logo_img/logo_width/header_padding/header_color/phone_img/top_phone_width
  // menu_enabled — 에디터 토글 상태. 라이브 사이트는 이 키를 모름 (덧붙여진 신규 키) → 무시.
  return JSON.stringify({
    logo_img: stripAssetBase(s.header.logoImage),
    logo_width: s.header.logoSize,
    header_padding: s.header.padding,
    header_color: s.header.color,
    phone_img: stripAssetBase(s.header.phoneImage),
    top_phone_width: s.header.phoneSize,
    // 상단 전용 번호가 비어 있으면 공용(하단 대표) 번호로 폴백 — 미리보기와 동일하게
    phone_num: s.header.phoneNumber || s.footer.phone,
    menu_enabled: s.header.menuEnabled,
  });
}

// subPage 의 image / gallery 섹션들에서 url 배열을 뽑는다. legacy.imgListIndex 가 있으면 그 위치에 둠
// (사용자가 순서 안 바꿨으면 원본 순서 유지). 없으면 그냥 순차 append.
function subPageToImgArr(subPage: SubPage | undefined): string[] {
  if (!subPage) return [];
  const slots: (string | undefined)[] = [];
  const tail: string[] = [];
  subPage.sections.forEach((sec) => {
    if (sec.type === "gallery") {
      (sec.images ?? []).forEach((g) => {
        const url = stripAssetBase(g.image);
        if (url) tail.push(url);
      });
      return;
    }
    if (sec.type !== "image" || !sec.image) return;
    const url = stripAssetBase(sec.image);
    const i = sec.legacy?.imgListIndex;
    if (typeof i === "number") slots[i] = url;
    else tail.push(url);
  });
  return [...slots.filter((v): v is string => !!v), ...tail];
}

function settingsToMenusJson(s: Settings): string {
  // 옛 menus[] 의 부속 키(imgArr 외 effect 등)를 보존하기 위해 sourceMenu spread 후 덮어씀.
  // 메뉴 항목 source 는 header.menus (라이브 사이트의 헤더 아래 strip).
  const rawMenus = pickRecord(tryParseJson(s.legacy?.rawJsonMenus));
  return JSON.stringify({
    ...rawMenus,
    color: s.subMenus.bgColor,
    padding_y: s.subMenus.padding,
    menus: s.header.menus.map((item) => {
      const subPage = s.subPages.find((p) => p.slug === item.link);
      const sourceMenu = subPage?.legacy?.sourceMenu ?? {};
      // 하부메뉴 (children) 는 라이브 사이트가 아직 렌더 로직이 없어도 무시하므로
      // 함께 실어두면 향후 확장 시 별도 마이그 없이 노출 가능. 각 자식은
      // 자체 imgArr 도 포함 → 갤러리형 자식이면 이미지 리스트 그대로 렌더 가능.
      // childrenEnabled=false 면 라이브 사이트가 자식 존재를 인지하지 않도록 생략.
      const children = subPage?.childrenEnabled
        ? (subPage.children ?? []).map((c) => ({
            name: c.title || c.slug,
            link: c.slug,
            imgArr: subPageToImgArr(c),
          }))
        : [];
      // 서브페이지 갤러리의 '나타나는 효과' 도 on/off + 종류로 저장.
      const anim =
        subPage?.sections.find((sec) => sec.type === "gallery")?.animation ??
        "none";
      return {
        ...sourceMenu,
        name: item.name,
        link: item.link,
        imgArr: subPageToImgArr(subPage),
        effect: anim !== "none" ? "on" : "off",
        effectType: anim,
        ...(children.length > 0 ? { children } : {}),
      };
    }),
  });
}

// 한 contentList 항목에 속한 섹션 그룹을 받아 옛 contentList 항목으로 재조립.
// 원본 sourceItem 을 spread 한 뒤 사용자가 건드린 부분만 덮어씀.
function rebuildContentItem(group: Section[]): LegacyContentItem {
  const first = group[0];
  const source = first.legacy?.sourceItem ?? {};

  // 메인 배너(hero). 옛 포맷에 전용 슬롯이 없어 imgList 한 장에 담고,
  // 갤러리/이미지 섹션과 구분되도록 `sectionType: "hero"` 표식을 함께 저장한다.
  // 이 분기가 없으면 아래 폴백(`{ ...source }`)으로 떨어져 신규 hero 가 빈 `{}` 로
  // 저장되고, 읽을 때 어느 분기에도 안 걸려 배너가 통째로 사라진다.
  const heroSec = group.find((s) => s.type === "hero");
  if (heroSec) {
    return {
      ...source,
      sectionType: "hero",
      sectionTitle: heroSec.title,
      imgList: [{ url: stripAssetBase(heroSec.image) }],
      heroText: heroSec.content,
      heroTextPos: heroSec.textPosition ?? "center",
      imgEffect: heroSec.effect ?? "none",
      align: "center",
      effect:
        heroSec.animation && heroSec.animation !== "none" ? "on" : "off",
      effectType: heroSec.animation ?? "none",
    };
  }

  // 폼 그룹이면 (form 섹션이 있으면) form 으로 재조립.
  // form-invite 표식 image 섹션이 있으면 그 image url 을 formInviteImg 로 복원.
  const formSec = group.find((s) => s.type === "form");
  if (formSec) {
    const inviteSec = group.find(
      (s) => s.type === "image" && s.legacy?.role === "form-invite",
    );
    const next: LegacyContentItem = { ...source };
    const fd = formSec.formData ?? {};

    // 섹션 제목(에디터 목록에 보이는 이름) — 폼과 초대 이미지가 각각 별도 섹션이라 키도 따로.
    next.sectionTitle = formSec.title;
    if (inviteSec) next.inviteTitle = inviteSec.title;
    else delete next.inviteTitle;

    if (inviteSec?.image) {
      next.formInviteImg = stripAssetBase(inviteSec.image);
    } else {
      delete next.formInviteImg;
    }

    // 양식 제목: subjectType 에 따라 formSubjectImg(이미지) / formSubject(텍스트) 중 하나만 저장.
    // 반대 모드의 키는 삭제해서 라이브 사이트가 잘못된 값을 읽지 않도록 함.
    const subjectType = fd.subjectType ?? "text";
    if (subjectType === "image" && formSec.image) {
      next.formSubjectImg = stripAssetBase(formSec.image);
      delete next.formSubject;
    } else if (subjectType === "text" && fd.title) {
      next.formSubject = fd.title;
      delete next.formSubjectImg;
    } else {
      delete next.formSubjectImg;
      delete next.formSubject;
    }

    if (fd.submitLabel) next.formButtonText = fd.submitLabel;
    if (fd.buttonColor) next.formButtonColor = fd.buttonColor;

    // 새 옵션들
    next.fixedBottom = fd.fixedBottom ?? "nonfixed";
    next.formAgree = fd.agreeMode ?? "notuse";
    next.formButtonType = fd.buttonType ?? (fd.submitLabel ? "text" : "image");
    if (fd.buttonType === "image" && fd.buttonImage) {
      next.formButtonImg = stripAssetBase(fd.buttonImage);
    } else if (fd.buttonType === "text") {
      delete next.formButtonImg;
    }
    if (fd.agreeMode === "use" && fd.agreeAddWords && fd.agreeAddWords.length > 0) {
      next.formAgreeAddWord = fd.agreeAddWords;
    } else {
      delete next.formAgreeAddWord;
    }

    if (!Array.isArray(next.formList))
      next.formList = [{ type: "name" }, { type: "phone" }];
    if (!next.formInviteType) next.formInviteType = "image";
    next.effect =
      formSec.animation && formSec.animation !== "none" ? "on" : "off";
    next.effectType = formSec.animation ?? "none";
    return next;
  }

  // 갤러리(여러 이미지) 섹션: 한 contentList 항목의 imgList 로 매핑.
  // 항목별 legacy(원본 imgList 키들) 가 있으면 spread 해서 url 외 부가 필드 보존.
  const gallerySec = group.find((s) => s.type === "gallery");
  if (gallerySec) {
    const items = gallerySec.images ?? [];
    return {
      ...source,
      sectionType: "gallery",
      sectionTitle: gallerySec.title,
      imgEffect: gallerySec.effect ?? "none",
      imgList: items.map((g) => ({
        ...(g.legacy ?? {}),
        url: stripAssetBase(g.image),
      })),
      align: "center",
      effect:
        gallerySec.animation && gallerySec.animation !== "none" ? "on" : "off",
      effectType: gallerySec.animation ?? "none",
    };
  }

  // 이미지만 있는 그룹: 원본 imgList 위치에 새 url 끼워넣음.
  // imgList 항목 하나 = 이미지 섹션 하나이므로 제목·꾸미기는 항목 안에 담는다
  // (그래야 한 그룹에 여러 장이 있어도 섹션별로 따로 복원된다).
  // `sectionType: "image"` 표식이 없으면 읽을 때 갤러리로 합쳐져버린다.
  const imageSections = group.filter((s) => s.type === "image");
  if (imageSections.length > 0) {
    const origImgList = Array.isArray(source.imgList)
      ? (source.imgList as Record<string, unknown>[])
      : [];
    return {
      ...source,
      sectionType: "image",
      imgList: imageSections.map((sec) => {
        const i = sec.legacy?.imgListIndex;
        const orig = typeof i === "number" ? origImgList[i] ?? {} : {};
        return {
          ...orig,
          url: stripAssetBase(sec.image),
          secTitle: sec.title,
          imgEffect: sec.effect ?? "none",
        };
      }),
      align: "center",
      effect: first.animation && first.animation !== "none" ? "on" : "off",
      effectType: first.animation ?? "none",
    };
  }

  // 유튜브 · HTML 섹션. 전용 분기가 없으면 맨 아래 폴백으로 떨어져
  // 빈 `{}` 로 저장되고 읽을 때 사라진다 (hero 와 같은 버그).
  const youtubeSec = group.find((s) => s.type === "youtube");
  if (youtubeSec) {
    return {
      ...source,
      sectionType: "youtube",
      sectionTitle: youtubeSec.title,
      videoUrl: youtubeSec.content,
      effect:
        youtubeSec.animation && youtubeSec.animation !== "none" ? "on" : "off",
      effectType: youtubeSec.animation ?? "none",
    };
  }

  const htmlSec = group.find((s) => s.type === "html");
  if (htmlSec) {
    // 표식이 유실돼도 텍스트 섹션으로 읽히도록 본문은 `text` 에 담는다.
    return {
      ...source,
      sectionType: "html",
      sectionTitle: htmlSec.title,
      text: htmlSec.content,
      effect: htmlSec.animation && htmlSec.animation !== "none" ? "on" : "off",
      effectType: htmlSec.animation ?? "none",
    };
  }

  // 텍스트 그룹
  const textSec = group.find((s) => s.type === "text");
  if (textSec) {
    return {
      ...source,
      sectionType: "text",
      sectionTitle: textSec.title,
      text: textSec.content,
      effect: textSec.animation && textSec.animation !== "none" ? "on" : "off",
      effectType: textSec.animation ?? "none",
    };
  }

  // 폴백
  return { ...source };
}

// ld_json_main 문자열과, 사이드카 메타를 뽑을 contentList 를 함께 돌려준다.
function settingsToMainJson(s: Settings): {
  json: string;
  contentList: unknown[];
} {
  // 사용자가 sections 비웠고 raw 원본이 있으면 그대로 (편집 안 한 케이스)
  if (s.sections.length === 0 && s.legacy?.rawJsonMain) {
    const raw = tryParseJson(s.legacy.rawJsonMain);
    const first = Array.isArray(raw) ? pickRecord(raw[0]) : pickRecord(raw);
    return {
      json: s.legacy.rawJsonMain,
      contentList: Array.isArray(first.contentList) ? first.contentList : [],
    };
  }

  // contentListIndex 별로 묶음. legacy 없는 신규 섹션은 max+1 부터 부여.
  const groups = new Map<number, Section[]>();
  let nextIndex =
    s.sections.reduce(
      (max, sec) =>
        sec.legacy ? Math.max(max, sec.legacy.contentListIndex) : max,
      -1,
    ) + 1;

  s.sections.forEach((sec) => {
    const idx = sec.legacy?.contentListIndex ?? nextIndex++;
    const arr = groups.get(idx);
    if (arr) arr.push(sec);
    else groups.set(idx, [sec]);
  });

  // 원본 ld_json_main 의 최상위 wrapper(bgType, paddingTopVal 등) 보존
  const rawParsed = tryParseJson(s.legacy?.rawJsonMain);
  const rawWrapper =
    Array.isArray(rawParsed) && rawParsed.length > 0
      ? pickRecord(rawParsed[0])
      : {};

  const contentList = Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([, group]) => rebuildContentItem(group));

  return {
    json: JSON.stringify([{ ...rawWrapper, contentList }]),
    contentList,
  };
}

export type LandPatch = Record<string, string | number | null>;

export function settingsToLand(s: Settings): LandPatch {
  const main = settingsToMainJson(s);
  return {
    // === 평면 컬럼 (라이브 사이트가 직접 읽음) ===
    ld_domain: s.domain,
    ld_font: s.font,
    ld_Interaction: s.headerStyle,
    ld_name: s.info.siteName,
    ld_description: s.siteDescription,
    ld_add_scripts: s.additionalScript,
    ld_db_input_subject: s.info.dbTitle,
    // 초대 문구 · 버튼 영역은 더 이상 사용하지 않음 — 저장 시 빈 값으로 덮어써 라이브 사이트에서도 안 보이게 함.
    ld_invite_message: "",
    ld_invite_bool: "off",
    ld_reserve_msg_bool: "off",
    ld_btn_message: "",
    ld_card_image: stripAssetBase(s.info.businessCardImage),
    ld_popup_img: stripAssetBase(s.popupImage),
    ld_logo: stripAssetBase(s.header.logoImage),
    ld_ph_img: stripAssetBase(s.header.phoneImage),
    ld_kakao: s.quickConnect.kakao.url,
    ld_sms_num: s.quickConnect.sms.phone,
    ld_phone_num: s.bottomFixed.phone.link.replace(/^tel:\s*/i, ""),
    ld_mobile_bt_phone_img: stripAssetBase(s.bottomFixed.phone.image),
    ld_mobile_bt_event_img: stripAssetBase(s.bottomFixed.consult.image),
    ld_consent_info: s.privacyPolicy,
    ld_complete_msg: s.completeMessage,
    // 개인정보 전문 노출 토글은 편집기에서 제거됨(폼에서 자동 연동) → 항상 on 으로 저장
    ld_personal_info_view: "on",
    ld_footer: reconstructFooterLine(s),
    ld_ft_name: s.footer.ceo,
    ld_ft_phone: s.footer.phone,

    // === 옛 JSON 컬럼 (라이브 사이트가 파싱해서 읽음) ===
    ld_json_header: settingsToHeaderJson(s),
    ld_json_menus: settingsToMenusJson(s),
    ld_json_main: main.json,
    // 옛 관리자가 ld_json_main 을 덮어써도 신규 키를 되살릴 수 있게 복사본을 남긴다.
    // (옛 관리자는 이 컬럼의 존재를 모르므로 건드리지 않는다)
    ld_json_secmeta: buildSecMeta(main.contentList),

    // === legacy carry-over (라이브 사이트가 계속 읽지만 새 에디터 UI는 안 건드림) ===
    // fixedImage 는 이제 info.fixedImage 가 source of truth. 없으면 legacy 폴백.
    ld_invite_image: stripAssetBase(
      s.info.fixedImage ?? s.legacy?.fixedImage,
    ),
    ld_invite_image_link: s.info.fixedImageLink,
    ld_invite_image_link_type: s.info.fixedImageLinkType,
    // 옛 스키마에 자리가 없는 신규 설정들. 새 값이 생기면 여기에 더한다.
    // ld_json_menus 가 아니라 여기 두는 이유: 그 컬럼은 옛 관리자도 덮어쓴다.
    ld_json_info: JSON.stringify({
      fixedImageEffect: s.info.fixedImageEffect,
      menu: {
        borderTop: s.subMenus.borderTop,
        borderBottom: s.subMenus.borderBottom,
        borderWidth: s.subMenus.borderWidth,
        borderColor: s.subMenus.borderColor,
        fontSize: s.subMenus.fontSize,
        fontWeight: s.subMenus.fontWeight,
        font: s.subMenus.font,
      },
    }),
    // sms.content 도 정식 슬롯. 빈 값이면 legacy 폴백.
    ld_sms_content: s.quickConnect.sms.content || s.legacy?.smsContent || "",
    // location.address 도 user-editable. 새 값 없으면 legacy 폴백.
    ld_location: s.location.address || s.legacy?.location || "",
    ld_manager_email: s.legacy?.managerEmail ?? "",
    ld_site: s.legacy?.site ?? "",
    ld_menu: s.legacy?.menu ?? "",
    ld_ft_address: s.legacy?.ftAddress ?? "",
    ld_view_type: s.legacy?.viewType ?? "",
    ld_pg0: s.legacy?.rawPg0 ?? "",
    ld_pg1: s.legacy?.rawPg1 ?? "",
    ld_pg2: s.legacy?.rawPg2 ?? "",
    ld_pg3: s.legacy?.rawPg3 ?? "",
    ld_pg4: s.legacy?.rawPg4 ?? "",

    // === 새 JSON 컬럼 (마이그 001 ADD) ===
    ld_json_bottom: JSON.stringify(s.bottomFixed),
    ld_json_countdown: JSON.stringify(s.countdown),
    ld_json_enabled: JSON.stringify(s.enabled),
    ld_json_footer: JSON.stringify({
      ceo: s.footer.ceo,
      bizNumber: s.footer.bizNumber,
      font: s.footer.font,
      bgColor: s.footer.bgColor,
      textColor: s.footer.textColor,
      mainFont: s.contentFont ?? "",
    }),
    ld_json_location: JSON.stringify(s.location),
    ld_json_header_menus: JSON.stringify(s.header.menus),
    // subPages 의 source of truth — header.menus 에 등록 안 된 신규 서브페이지도
    // 여기 들어가야 reload 시 안 사라짐. URL 은 strip 해서 DB 일관성 유지.
    ld_json_subpages: JSON.stringify(
      transformSubPagesUrls(s.subPages, (u) => stripAssetBase(u) || null),
    ),
  };
}

// 상태에 저장된 풀 URL → GCS 객체 경로 (예: "cheonanblooming/abc.jpg") 로 변환.
// ASSET_BASE 와 일치 안 하거나 blob:/data: 면 null (삭제 대상 아님).
export function urlToGcsPath(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("data:")) return null;
  if (!ASSET_BASE) return null;
  if (!url.startsWith(ASSET_BASE + "/")) return null;
  return url.slice(ASSET_BASE.length + 1);
}

// GCS 에서 이미지(객체) 삭제. cleanup 엔드포인트 호출.
// paths: "도메인/파일명.확장자" 형식의 객체 경로들.
export async function deleteImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const res = await fetch("/api/upload/cleanup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paths }),
  });
  if (!res.ok) {
    const body = await readBody(res);
    throw new Error(asError(body));
  }
}

// 페이지 언로드 시 (F5/탭 닫기 등) 동기적으로 orphan 정리를 요청.
// navigator.sendBeacon 은 text/plain 으로 보내야 하며, 백엔드가 그걸 파싱.
export function cleanupImagesBeacon(paths: string[]): void {
  if (paths.length === 0 || typeof navigator === "undefined") return;
  try {
    const blob = new Blob([JSON.stringify({ paths })], {
      type: "text/plain",
    });
    navigator.sendBeacon("/api/upload/cleanup", blob);
  } catch {
    // ignore — beacon 은 best-effort
  }
}

// 이미지를 GCS 에 즉시 업로드. 파일 한 개 또는 여러 개 한 번에 가능.
// 응답은 풀 URL (ASSET_BASE 가 앞에 붙은 형태) — 상태에 그대로 저장하면 됨.
export async function uploadImages(
  domain: string,
  files: File[],
): Promise<string[]> {
  if (files.length === 0) return [];
  if (!domain) throw new Error("도메인 정보가 없어 업로드할 수 없습니다.");
  const fd = new FormData();
  for (const f of files) fd.append("file", f);
  const res = await fetch(
    `/api/upload?domain=${encodeURIComponent(domain)}`,
    { method: "POST", body: fd },
  );
  if (!res.ok) {
    const body = await readBody(res);
    throw new Error(asError(body));
  }
  const data = (await res.json()) as { files?: { url: string }[] };
  const urls = (data.files ?? []).map((f) => f.url);
  return urls.map((u) => resolveAsset(u) ?? u);
}

export async function putSettings(
  domain: string,
  settings: Settings,
): Promise<void> {
  const patch = settingsToLand(settings);
  const res = await fetch(`${LIST_URL}/${encodeURIComponent(domain)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = await readBody(res);
    throw new Error(asError(body));
  }
}
