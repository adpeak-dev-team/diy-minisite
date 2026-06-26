import {
  GalleryImage,
  initialSettings,
  LegacyContentItem,
  Section,
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

function resolveAsset(path: string): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path) || path.startsWith("/")) {
    return path;
  }
  return ASSET_BASE ? `${ASSET_BASE}/${path}` : path;
}

function contentListToSections(contentList: unknown[]): Section[] {
  const out: Section[] = [];
  contentList.forEach((item, idx) => {
    const rec = pickRecord(item);
    const sourceItem: LegacyContentItem = rec;
    const animated = asString(rec.effect) === "on" ? "fade-in" : "none";

    if (Array.isArray(rec.imgList) && rec.imgList.length > 0) {
      const images: GalleryImage[] = rec.imgList.flatMap((img, i) => {
        const imgRec = pickRecord(img);
        const url = asString(imgRec.url);
        if (!url) return [];
        const resolved = resolveAsset(url);
        if (!resolved) return [];
        return [{ id: `sec-${idx}-img-${i}`, image: resolved, legacy: imgRec }];
      });
      if (images.length > 0) {
        out.push({
          id: `sec-${idx}-gallery`,
          type: "gallery",
          title: "",
          image: null,
          images,
          content: "",
          effect: "none",
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
          title: "",
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
        title: "",
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
        legacy: { contentListIndex: idx, sourceItem },
      });
      return;
    }

    const text = asString(rec.text) || asString(rec.content);
    if (text) {
      out.push({
        id: `sec-${idx}-text`,
        type: "text",
        title: "",
        image: null,
        content: text,
        legacy: { contentListIndex: idx, sourceItem },
      });
    }
  });
  return out;
}

function menuToSubPage(menu: unknown, index: number): SubPage {
  const rec = pickRecord(menu);
  const imgArr = Array.isArray(rec.imgArr) ? rec.imgArr : [];
  const animated = asString(rec.effect) === "on" ? "fade-in" : "none";
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
  const sections = Array.isArray(mainFirst.contentList)
    ? contentListToSections(mainFirst.contentList)
    : [];

  const subPagesFromMenus = menusArr.map((m, i) => menuToSubPage(m, i));
  const subPagesFromSlots = (["ld_pg0", "ld_pg1", "ld_pg2", "ld_pg3", "ld_pg4"] as const)
    .map((k, i) => parsePgSlot(land[k], i))
    .filter((p): p is SubPage => p !== null);
  const subPages = [...subPagesFromMenus, ...subPagesFromSlots];

  // 마이그레이션으로 추가될 JSON 컬럼들 (현재는 없을 수 있음)
  const jsonBottom = pickRecord(tryParseJson(land.ld_json_bottom));
  const jsonCountdown = pickRecord(tryParseJson(land.ld_json_countdown));
  const jsonEnabled = pickRecord(tryParseJson(land.ld_json_enabled));
  const jsonFooter = pickRecord(tryParseJson(land.ld_json_footer));
  const jsonLocation = pickRecord(tryParseJson(land.ld_json_location));

  const popupImage = resolveAsset(asString(land.ld_popup_img));
  const hasKakao = !!asString(land.ld_kakao);
  const hasSms = !!asString(land.ld_sms_num);
  const bottomPhoneImg = resolveAsset(asString(land.ld_mobile_bt_phone_img));
  const bottomConsultImg = resolveAsset(asString(land.ld_mobile_bt_event_img));
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
      menuEnabled: menusArr.length > 0,
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
    },
    bottomFixed: {
      ...initialSettings.bottomFixed,
      height: asString(
        jsonBottom.height,
        initialSettings.bottomFixed.height,
      ),
      font: (asString(jsonBottom.font) ||
        initialSettings.bottomFixed.font) as Settings["bottomFixed"]["font"],
      phone: {
        ...initialSettings.bottomFixed.phone,
        ...pickRecord(jsonBottom.phone),
        enabled: !!bottomPhoneImg || !!asString(land.ld_phone_num),
        mode: bottomPhoneImg ? "image" : "text",
        image:
          bottomPhoneImg ||
          asString(pickRecord(jsonBottom.phone).image) ||
          null,
        link:
          asString(land.ld_phone_num) ||
          asString(pickRecord(jsonBottom.phone).link),
      },
      consult: {
        ...initialSettings.bottomFixed.consult,
        ...pickRecord(jsonBottom.consult),
        enabled: !!bottomConsultImg,
        mode: bottomConsultImg ? "image" : "text",
        image:
          bottomConsultImg ||
          asString(pickRecord(jsonBottom.consult).image) ||
          null,
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
      quickConnect: hasKakao || hasSms,
      location:
        !!asString(jsonLocation.address) || !!asString(land.ld_location),
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
  return JSON.stringify({
    logo_img: stripAssetBase(s.header.logoImage),
    logo_width: s.header.logoSize,
    header_padding: s.header.padding,
    header_color: s.header.color,
    phone_img: stripAssetBase(s.header.phoneImage),
    top_phone_width: s.header.phoneSize,
    phone_num: s.header.phoneNumber,
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
      return {
        ...sourceMenu,
        name: item.name,
        link: item.link,
        imgArr: subPageToImgArr(subPage),
      };
    }),
  });
}

// 한 contentList 항목에 속한 섹션 그룹을 받아 옛 contentList 항목으로 재조립.
// 원본 sourceItem 을 spread 한 뒤 사용자가 건드린 부분만 덮어씀.
function rebuildContentItem(group: Section[]): LegacyContentItem {
  const first = group[0];
  const source = first.legacy?.sourceItem ?? {};

  // 폼 그룹이면 (form 섹션이 있으면) form 으로 재조립.
  // form-invite 표식 image 섹션이 있으면 그 image url 을 formInviteImg 로 복원.
  const formSec = group.find((s) => s.type === "form");
  if (formSec) {
    const inviteSec = group.find(
      (s) => s.type === "image" && s.legacy?.role === "form-invite",
    );
    const next: LegacyContentItem = { ...source };
    const fd = formSec.formData ?? {};

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
    return next;
  }

  // 갤러리(여러 이미지) 섹션: 한 contentList 항목의 imgList 로 매핑.
  // 항목별 legacy(원본 imgList 키들) 가 있으면 spread 해서 url 외 부가 필드 보존.
  const gallerySec = group.find((s) => s.type === "gallery");
  if (gallerySec) {
    const items = gallerySec.images ?? [];
    return {
      ...source,
      imgList: items.map((g) => ({
        ...(g.legacy ?? {}),
        url: stripAssetBase(g.image),
      })),
      align: "center",
      effect:
        gallerySec.animation && gallerySec.animation !== "none" ? "on" : "off",
    };
  }

  // 이미지만 있는 그룹: 원본 imgList 위치에 새 url 끼워넣음
  const imageSections = group.filter((s) => s.type === "image");
  if (imageSections.length > 0 && Array.isArray(source.imgList)) {
    const origImgList = source.imgList as Record<string, unknown>[];
    const nextImgList = imageSections.map((sec) => {
      const i = sec.legacy?.imgListIndex;
      const orig = typeof i === "number" ? origImgList[i] ?? {} : {};
      return { ...orig, url: stripAssetBase(sec.image) };
    });
    return { ...source, imgList: nextImgList };
  }
  if (imageSections.length > 0) {
    return {
      imgList: imageSections.map((sec) => ({
        url: stripAssetBase(sec.image),
      })),
      align: "center",
      effect: first.animation && first.animation !== "none" ? "on" : "off",
    };
  }

  // 텍스트 그룹
  const textSec = group.find((s) => s.type === "text");
  if (textSec) {
    return { ...source, text: textSec.content };
  }

  // 폴백
  return { ...source };
}

function settingsToMainJson(s: Settings): string {
  // 사용자가 sections 비웠고 raw 원본이 있으면 그대로 (편집 안 한 케이스)
  if (s.sections.length === 0 && s.legacy?.rawJsonMain) {
    return s.legacy.rawJsonMain;
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

  return JSON.stringify([
    {
      ...rawWrapper,
      contentList,
    },
  ]);
}

export type LandPatch = Record<string, string | number | null>;

export function settingsToLand(s: Settings): LandPatch {
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
    ld_personal_info_view: s.enabled.privacy ? "on" : "off",
    ld_footer: reconstructFooterLine(s),
    ld_ft_name: s.footer.ceo,
    ld_ft_phone: s.footer.phone,

    // === 옛 JSON 컬럼 (라이브 사이트가 파싱해서 읽음) ===
    ld_json_header: settingsToHeaderJson(s),
    ld_json_menus: settingsToMenusJson(s),
    ld_json_main: settingsToMainJson(s),

    // === legacy carry-over (라이브 사이트가 계속 읽지만 새 에디터 UI는 안 건드림) ===
    // fixedImage 는 이제 info.fixedImage 가 source of truth. 없으면 legacy 폴백.
    ld_invite_image: stripAssetBase(
      s.info.fixedImage ?? s.legacy?.fixedImage,
    ),
    ld_invite_image_link: s.info.fixedImageLink,
    ld_invite_image_link_type: s.info.fixedImageLinkType,
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
    }),
    ld_json_location: JSON.stringify(s.location),
    ld_json_header_menus: JSON.stringify(s.header.menus),
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
