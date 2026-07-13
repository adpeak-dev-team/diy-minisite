"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 편집기 첫 사용자를 위한 단계별 스포트라이트 투어.
// 각 단계는 실제 화면의 요소(data-guide 앵커)를 하이라이트하고, 필요하면
// 먼저 해당 탭/미리보기로 전환한 뒤 그 요소로 스크롤·강조한다.
// - demo  : 강조된 미리보기 요소를 클릭하면 실제 편집이 열림(우측). 클릭 후 phase 1.
// - try   : 강조된 실제 버튼을 그대로 눌러볼 수 있음(패스스루, 예: PC/모바일, ＋내용추가).
// 처음 방문 시 자동으로 뜨고, 닫으면(플래그 저장) 다시 자동으로 뜨지 않으며,
// 좌측 상단 '가이드' 버튼으로 언제든 다시 열 수 있다.

export const GUIDE_SEEN_KEY = "minisite:guide-seen:v1";

// 투어 단계에서 먼저 이동할 위치(모바일 pane / 편집 탭 / 미리보기 크기).
export type GuideLoc = {
    pane?: "editor" | "preview";
    tab?: string;
    mode?: "pc" | "mobile";
    // 해당 아코디언(anchor)을 자동으로 열어 내용을 펼쳐 보여준다.
    open?: string;
    // 이 단계에서 켤 기능 토글(enabled.* 키). 미리보기·편집기에 기능이 실제로 보이도록.
    enable?: string[];
};

type Step = {
    icon: string;
    title: string;
    // 목차(바로가기) 목록에 표시할 짧은 이름.
    menu: string;
    desc: string;
    // 하이라이트할 요소의 data-guide 값. 없으면 화면 중앙에 카드만 표시.
    target?: string;
    // true 면 앵커 요소가 아니라 그 첫 자식 요소를 하이라이트(예: 미리보기 프레임).
    inner?: boolean;
    // 대상으로 스크롤할 때 정렬 위치. 기본 center, "start" 면 편집 영역 상단으로.
    align?: ScrollLogicalPosition;
    // 보조 하이라이트(딤 없이 링만) — 예: 미리보기(주)와 편집 아코디언(보조) 동시 강조.
    target2?: string;
    loc?: GuideLoc;
    // 데모(인터셉트): 미리보기의 clickSel 요소를 클릭하면 data-edit 값을 편집기로 전달.
    demo?: { clickSel: string };
    // 데모 클릭 후(phase 1) 카드에 보여줄 제목/설명.
    title2?: string;
    desc2?: string;
    // 체험(패스스루): target 요소를 실제로 눌러볼 수 있게 구멍을 뚫는다.
    tryTarget?: boolean;
    // 여러 단계 체험: 각 단계의 강조 대상/문구. watch 안을 클릭하면 다음 단계로 진행.
    exp?: {
        target: string;
        title?: string;
        desc: string;
        watch?: string;
        // target 앵커의 마지막 자식을 하이라이트(예: 방금 추가된 섹션).
        focusLast?: boolean;
    }[];
};

const STEPS: Step[] = [
    {
        icon: "👋",
        title: "환영합니다!",
        menu: "가이드 시작",
        desc: "이 화면에서 나만의 랜딩 페이지를 직접 만들 수 있어요.<br>하나씩 눌러보며 익혀볼 테니 [다음]을 눌러주세요!",
    },
    {
        icon: "🖥️",
        title: "PC·모바일 화면 전환",
        menu: "PC·모바일 전환",
        desc: "이 버튼으로 방문자가 보는 두 화면을 확인해요.<br>지금 ‘PC’와 ‘모바일’을 직접 눌러보세요.",
        target: "preview-mode",
        inner: true,
        tryTarget: true,
        loc: { pane: "preview" },
    },
    {
        icon: "🖱️",
        title: "클릭해서 바로 편집",
        menu: "미리보기 클릭 편집",
        desc: "강조된 ‘상단’ 영역을 한 번 클릭해보세요.",
        title2: "오른쪽이 열렸어요!",
        desc2: "미리보기에서 원하는 곳을 클릭하면<br>그 부분의 편집 화면이 오른쪽에 바로 열려요.<br>여기서 편집하면 왼쪽에 즉시 반영됩니다.",
        loc: { pane: "preview" },
        demo: { clickSel: '[data-edit="header"]' },
    },
    {
        icon: "🗂️",
        title: "탭으로 편집 위치 선택",
        menu: "편집 탭 안내",
        desc: "위쪽 탭이 편집할 부분을 나눠줘요.<br>다음 단계에서 각 탭을 하나씩 살펴볼게요.",
        target: "tabs",
        loc: { pane: "editor" },
    },
    {
        icon: "🏷️",
        title: "[기본정보] 사이트 기본 정보",
        menu: "기본정보 · 공통 정보",
        desc: "사이트 곳곳에서 공통으로 쓰는 정보를 모아 두는 곳이에요.<br>한 번 채워두면 필요한 위치에 자동으로 들어갑니다.",
        target: "info-basic",
        align: "start",
        loc: { pane: "editor", tab: "info", open: "info-basic" },
    },
    {
        icon: "📍",
        title: "[기본정보] 위치·지도",
        menu: "기본정보 · 위치/지도",
        desc: "주소를 입력하면 페이지 <b>맨 아래에 지도</b>가 자동으로 표시돼요.",
        target: "location",
        align: "start",
        loc: { pane: "editor", tab: "info", open: "location", enable: ["location"] },
    },
    {
        icon: "📄",
        title: "[메인페이지] 내용 편집",
        menu: "메인페이지 · 내용 편집",
        desc: "메인페이지에 들어갈 내용을 채우는 곳이에요.",
        loc: { pane: "editor", tab: "main", open: "sections" },
        exp: [
            {
                target: "add-content",
                watch: "add-content",
                // title 생략 → 스텝 제목 "[메인페이지] 사진·글 추가" 사용
                desc: "메인페이지에 들어갈 내용을 채우는 곳이에요.<br>아래 버튼을 직접 눌러보세요.",
            },
            {
                target: "content-picker",
                watch: "content-picker",
                title: "원하는 종류를 선택",
                desc: "‘이미지’나 ‘텍스트’ 같은 종류를 하나 골라보세요.<br>고르면 페이지에 바로 추가됩니다.",
            },
            {
                target: "sections-list",
                focusLast: true,
                title: "순서·삭제도 자유롭게",
                desc: "추가한 항목은 이 목록에 쌓여요.<br>각 항목의 ⋮⋮ 를 끌면 순서 변경, 우측 삭제 버튼으로 지울 수 있어요.",
            },
        ],
    },
    {
        icon: "🧭",
        title: "[메뉴관리] 페이지 · 메뉴",
        menu: "메뉴관리 · 페이지 추가",
        desc: "여러 페이지가 필요할 때, 페이지를 만들고 구조를 잡는 곳이에요.<br>페이지를 추가하고 순서를 바꿀 수 있어요.<br>각 페이지의 [디자인] 버튼을 누르면<br>그 페이지 내용 편집으로 바로 이동합니다.",
        target: "menu",
        align: "start",
        loc: { pane: "editor", tab: "menu", open: "menu" },
    },
    {
        icon: "📄",
        title: "[서브페이지] 내용 편집",
        menu: "서브페이지 · 내용 편집",
        desc: "‘메뉴관리’에서 만든 페이지의 내용을 채우는 곳이에요.",
        loc: { pane: "editor", tab: "subpages" },
        exp: [
            {
                target: "page-selector",
                watch: "page-selector",
                // title 생략 → 스텝 제목 "[서브페이지] 내용 편집" 사용
                desc: "‘메뉴관리’에서 만든 페이지의 내용을 채우는 곳이에요.<br>먼저 위 목록에서 편집할 <b>페이지를 눌러</b> 선택하세요.",
            },
            {
                target: "editor-body",
                title: "메인페이지처럼 편집",
                desc: "나머지는 메인페이지와 똑같아요.<br>내용을 넣어 이 페이지를 채우면 됩니다.",
            },
        ],
    },
    {
        icon: "⬆️",
        title: "[상단] 상단 스타일",
        menu: "상단(헤더) 스타일",
        desc: "방문자 화면 <b>맨 위에 늘 보이는 머리말(헤더) 영역</b>이에요.<br>보통 로고·전화번호가 들어갑니다.",
        target: "header",
        align: "start",
        loc: { pane: "editor", tab: "header", open: "header", enable: ["header"] },
    },
    {
        icon: "⬇️",
        title: "[하단] 하단 스타일",
        menu: "하단(푸터) 스타일",
        desc: "페이지 맨 아래 영역의 <b>배경·글자 색상</b>을 정해요.<br>상호·대표자·사업자등록번호·대표번호는 ‘기본정보’에 입력하면 하단에 자동으로 표시됩니다.",
        target: "footer",
        align: "start",
        loc: { pane: "editor", tab: "footer", open: "footer" },
    },
    {
        icon: "📱",
        title: "[하단] 모바일 하단 고정",
        menu: "모바일 하단 고정바",
        desc: "모바일 화면에서만 아래 고정 되는 버튼이에요.<br>전화 걸기·상담 신청 버튼을 띄워<br>방문자가 언제든 바로 연락할 수 있게 합니다.",
        target: "pv-bottom",
        target2: "bottom",
        loc: {
            pane: "preview",
            tab: "footer",
            open: "bottom",
            enable: ["bottomFixed"],
            mode: "mobile",
        },
    },
    {
        icon: "💬",
        title: "[기능] 빠른 연결",
        menu: "기능 · 빠른 연결",
        desc: "화면에 <b>떠 있는 카카오톡·문자 버튼</b>이에요.<br>방문자가 어디서든 바로 문의를 보낼 수 있어요.",
        target: "pv-quick",
        target2: "quickconnect",
        loc: {
            pane: "preview",
            tab: "fixed",
            open: "quickconnect",
            enable: ["quickConnect"],
            mode: "pc",
        },
    },
    {
        icon: "🔵",
        title: "[기능] 우측 고정 이미지",
        menu: "기능 · 우측 고정 이미지",
        desc: "화면 <b>우측에 동그랗게 떠 있는 이미지 배너</b>예요.<br>이벤트 바로가기 등으로 쓰기 좋아요.<br>이미지를 넣으면 미리보기에 나타납니다.",
        target: "pv-fiximage",
        target2: "fiximage",
        loc: { pane: "preview", tab: "fixed", open: "fiximage", enable: ["fixedImage"] },
    },
    {
        icon: "🪟",
        title: "[기능] 팝업 이미지",
        menu: "기능 · 팝업 이미지",
        desc: "<b>첫 방문 시 화면 가운데 뜨는 팝업</b>이에요.<br>이벤트·공지 이미지를 넣으면 방문하자마자 크게 보여줄 수 있어요.",
        target: "pv-popup",
        target2: "popup",
        loc: { pane: "preview", tab: "fixed", open: "popup", enable: ["popup"] },
    },
    {
        icon: "⏰",
        title: "[기능] 카운트다운",
        menu: "기능 · 카운트다운",
        desc: "<b>마감 타이머와 신청자 수</b>를 보여줘요.<br>‘마감 임박’ 같은 긴박함으로 신청을 유도할 때 좋아요.<br>(왼쪽 미리보기에서 확인해 보세요.)",
        target: "pv-countdown",
        target2: "countdown",
        loc: { pane: "preview", tab: "fixed", open: "countdown", enable: ["countdown"] },
    },
    {
        icon: "🛠️",
        title: "[기능] 고급 설정",
        menu: "기능 · 고급 설정",
        desc: "검색 결과에 뜨는 <b>사이트 설명</b>과,<br>방문자 분석용 <b>추적 스크립트</b>(구글 애널리틱스·메타 픽셀 등)를<br>넣는 곳이에요.<br>필요할 때만 사용하세요.",
        target: "advanced",
        align: "start",
        loc: { pane: "editor", tab: "fixed", open: "advanced", enable: ["advanced"] },
    },
    {
        icon: "📜",
        title: "[약관·메시지] 약관·완료 메시지",
        menu: "약관 · 완료 메시지",
        desc: "개인정보처리방침 등 <b>약관</b>과, 신청이 접수됐을 때<br>방문자에게 보여줄 <b>완료 메시지</b>를 여기서 작성해요.",
        target: "editor-body",
        loc: { pane: "editor", tab: "legal" },
    },
    {
        icon: "💾",
        title: "다 만들면 저장",
        menu: "저장하기",
        desc: "마지막으로 이 버튼(또는 ⌘S / Ctrl+S)을 눌러 저장하면<br>실제 사이트에 반영돼요.",
        target: "save",
        loc: { pane: "editor" },
    },
    {
        icon: "📖",
        title: "언제든 다시 볼 수 있어요",
        menu: "가이드 다시 열기",
        desc: "이 안내가 또 필요하면 왼쪽 위 버튼을 누르면 다시 나와요.<br>이제 직접 만들어볼까요?",
        target: "guide-btn",
    },
];

export function GuideButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            data-guide="guide-btn"
            onClick={onClick}
            className="fixed top-3 left-3 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center text-sm font-bold hover:bg-blue-700 transition"
            aria-label="사용 가이드 열기"
            title="사용 가이드"
        >
            가이드
        </button>
    );
}

const SPOT_PAD = 8; // 하이라이트 박스 여백(px)

export function GuideTour({
    open,
    onClose,
    onLocate,
    onDemoEdit,
}: {
    open: boolean;
    onClose: () => void;
    // 단계 진입 시 먼저 탭/미리보기를 전환하기 위한 콜백.
    onLocate?: (loc: GuideLoc | undefined) => void;
    // 데모: 미리보기 요소의 data-edit 값을 편집기에 전달(= 미리보기 클릭과 동일).
    onDemoEdit?: (part: string) => void;
}) {
    const [step, setStep] = useState(0);
    const [phase, setPhase] = useState(0); // 데모 단계: 0=클릭 대기, 1=우측 열림
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [rect2, setRect2] = useState<DOMRect | null>(null); // 보조 하이라이트
    const [resolved, setResolved] = useState(false); // 대상 탐색 완료 여부
    const [cursor, setCursor] = useState(false); // 큰 커서(클릭 유도) 표시
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const [menuOpen, setMenuOpen] = useState(false); // 목차(바로가기) 열림
    const cardRef = useRef<HTMLDivElement>(null);

    const cur = STEPS[step];
    const first = step === 0;
    const last = step === STEPS.length - 1;
    // 현재 phase 에 맞는 제목/설명. (데모 phase1 / 체험 exp[phase])
    const expPhase = cur.exp
        ? cur.exp[Math.min(phase, cur.exp.length - 1)]
        : null;
    const showAfter = !!cur.demo && phase === 1;
    const title = expPhase
        ? (expPhase.title ?? cur.title)
        : showAfter && cur.title2
          ? cur.title2
          : cur.title;
    const desc = expPhase
        ? expPhase.desc
        : showAfter && cur.desc2
          ? cur.desc2
          : cur.desc;

    // 단계/페이즈를 바꾸기 전에 하이라이트 상태를 즉시 비워, 새 내용이 옛 위치에
    // 잠깐 보였다가 이동하는 현상을 막는다(먼저 숨기고 → 새 위치에서 다시 표시).
    const resetSpot = () => {
        setRect(null);
        setRect2(null);
        setResolved(false);
        setPos(null);
        setCursor(false);
    };

    const go = useCallback((next: number) => {
        resetSpot();
        setMenuOpen(false);
        setStep(Math.max(0, Math.min(next, STEPS.length - 1)));
        setPhase(0);
    }, []);

    // 데모 단계에서 사용자가 강조 영역을 직접 클릭하면 실제 편집을 열고 phase 1 로.
    const demoClick = () => {
        const st = STEPS[step];
        if (!st.demo) return;
        const el = document.querySelector(st.demo.clickSel);
        const part = el?.getAttribute("data-edit");
        resetSpot();
        if (part) onDemoEdit?.(part);
        setPhase(1);
    };

    // 앵커에서 실제로 하이라이트할 요소.
    // inner: 첫 자식 / last: 마지막 자식(예: 방금 추가된 섹션).
    const pickEl = (
        target: string,
        opts?: { inner?: boolean; last?: boolean },
    ): HTMLElement | null => {
        const anchor = document.querySelector(
            `[data-guide="${target}"]`,
        ) as HTMLElement | null;
        if (!anchor) return null;
        if (opts?.last)
            return (anchor.lastElementChild as HTMLElement | null) ?? anchor;
        if (opts?.inner)
            return (anchor.firstElementChild as HTMLElement | null) ?? anchor;
        return anchor;
    };

    // 닫힐 때 위치/페이즈 상태를 비워 다음에 열 때 stale 한 하이라이트가 잠깐 보이지 않게 한다.
    // 단, 단계(step)는 유지해 '이어보기'가 되게 하되, 마지막 단계까지 본(완주) 경우엔
    // 처음(0)부터 다시 시작한다.
    useEffect(() => {
        if (open) return;
        /* eslint-disable react-hooks/set-state-in-effect */
        setStep((s) => (s >= STEPS.length - 1 ? 0 : s));
        setPhase(0);
        setRect(null);
        setRect2(null);
        setResolved(false);
        setPos(null);
        setCursor(false);
        setMenuOpen(false);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [open]);

    // 키보드 조작.
    useEffect(() => {
        if (!open) return;
        // 닫기는 오직 '건너뛰기 / ×' 버튼으로만. ESC·바깥클릭으로는 닫지 않는다.
        const onKey = (e: KeyboardEvent) => {
            // 체험/데모 단계에서 실제 입력창에 포커스한 채 좌우 화살표(커서 이동)를
            // 눌러도 단계가 넘어가지 않도록, 편집 요소 안에서는 무시한다.
            const t = e.target as HTMLElement | null;
            if (
                t &&
                (t.tagName === "INPUT" ||
                    t.tagName === "TEXTAREA" ||
                    t.tagName === "SELECT" ||
                    t.isContentEditable)
            )
                return;
            if (e.key === "ArrowRight") go(step + 1);
            else if (e.key === "ArrowLeft") go(step - 1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, go, step]);

    // 단계/페이즈 진입: 위치 전환 → 대상 탐색 → 스크롤 → 측정.
    useEffect(() => {
        if (!open) return;
        const st = STEPS[step];

        // 대상 요소를 찾을 때까지 재시도 후 측정.
        const runSeek = (
            getEl: () => HTMLElement | null,
            onMeasured?: (el: HTMLElement) => void,
            block: ScrollLogicalPosition = "center",
        ) => {
            let tries = 0;
            let timer = 0;
            const seek = () => {
                const el = getEl();
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block, inline: "center" });
                    timer = window.setTimeout(() => {
                        setRect(el.getBoundingClientRect());
                        setResolved(true);
                        onMeasured?.(el);
                    }, 280);
                } else if (tries++ < 25) {
                    timer = window.setTimeout(seek, 40);
                } else {
                    setResolved(true);
                }
            };
            timer = window.setTimeout(seek, 60);
            return () => window.clearTimeout(timer);
        };

        // 데모 단계
        if (st.demo) {
            if (phase === 0) {
                onLocate?.(st.loc); // 미리보기 pane 로
                // 커서 힌트만 표시하고, 사용자가 직접 강조 영역을 클릭할 때까지 대기.
                return runSeek(
                    () => document.querySelector(st.demo!.clickSel) as HTMLElement | null,
                    () => setCursor(true),
                );
            }
            // phase 1: 사용자가 클릭 → 우측 편집 영역이 열린 모습을 하이라이트
            return runSeek(() => pickEl("editor-body"));
        }

        // 여러 단계 체험(exp)
        if (st.exp) {
            if (phase === 0) onLocate?.(st.loc);
            const p = st.exp[Math.min(phase, st.exp.length - 1)];
            return runSeek(
                () => pickEl(p.target, { last: p.focusLast }),
                p.watch ? () => setCursor(true) : undefined,
            );
        }

        // 일반/체험(단일) 단계
        onLocate?.(st.loc);
        if (!st.target) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setResolved(true);
            return;
        }
        return runSeek(
            () => pickEl(st.target!, { inner: st.inner }),
            st.tryTarget ? () => setCursor(true) : undefined,
            st.align,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, step, phase]);

    // 하이라이트 대상이 스크롤·리사이즈뿐 아니라 레이아웃 변화(예: PC↔모바일 전환으로
    // 미리보기 높이가 바뀌어 대상이 이동)에도 계속 따라붙도록 rAF 로 지속 추적한다.
    // 초기 탐색(resolved)이 끝난 뒤에만 돌아 전환 중 stale 측정을 피한다.
    useEffect(() => {
        if (!open || !resolved) return;
        const st = STEPS[step];
        const getEl = (): HTMLElement | null => {
            if (st.demo)
                return phase === 0
                    ? (document.querySelector(st.demo.clickSel) as HTMLElement | null)
                    : pickEl("editor-body");
            if (st.exp) {
                const p = st.exp[Math.min(phase, st.exp.length - 1)];
                return pickEl(p.target, { last: p.focusLast });
            }
            return st.target ? pickEl(st.target, { inner: st.inner }) : null;
        };
        const keyOf = (r: DOMRect) =>
            `${Math.round(r.top)},${Math.round(r.left)},${Math.round(r.width)},${Math.round(r.height)}`;
        let raf = 0;
        let prev = "";
        let prev2 = "";
        const tick = () => {
            const el = getEl();
            if (el) {
                const r = el.getBoundingClientRect();
                const key = keyOf(r);
                // 실제로 움직였을 때만 갱신해 불필요한 리렌더를 막는다.
                if (key !== prev) {
                    prev = key;
                    setRect(r);
                }
            }
            // 보조 하이라이트(편집 아코디언 등) — 보이면 링 위치를 따라간다.
            // 숨겨진 pane(모바일)에서는 0 크기라 무시 → 단일 강조로 폴백.
            if (st.target2) {
                const el2 = pickEl(st.target2);
                const r2 = el2?.getBoundingClientRect();
                const valid = r2 && r2.width > 0 && r2.height > 0 ? r2 : null;
                const k2 = valid ? keyOf(valid) : "";
                if (k2 !== prev2) {
                    prev2 = k2;
                    setRect2(valid);
                }
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [open, step, phase, resolved]);

    // 체험 단계: 사용자가 watch 영역을 실제로 클릭하면 다음 체험 단계로 진행.
    useEffect(() => {
        if (!open) return;
        const st = STEPS[step];
        if (!st.exp) return;
        const p = st.exp[Math.min(phase, st.exp.length - 1)];
        if (!p.watch) return;
        const sel = `[data-guide="${p.watch}"]`;
        const onClick = (e: MouseEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && t.closest(sel)) {
                resetSpot();
                setPhase((v) => Math.min(v + 1, st.exp!.length - 1));
            }
        };
        // 캡처 단계로 들어 실제 요소의 동작과 관계없이 진행을 감지.
        document.addEventListener("click", onClick, true);
        return () => document.removeEventListener("click", onClick, true);
    }, [open, step, phase]);

    // 대상 근처 카드 위치 계산(공간 없으면 위로).
    // 보조 대상(rect2, 편집 아코디언)이 있으면 그 옆에 카드를 두어, [기능] 단계에서
    // 카드는 편집 영역(우측)에 고정되고 미리보기 기능은 왼쪽에 그대로 강조된다.
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        const anchor = rect2 ?? rect;
        if (!open || !anchor) {
            setPos(null);
            return;
        }
        const card = cardRef.current;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const m = 12;
        const cw = card?.offsetWidth ?? 360;
        const ch = card?.offsetHeight ?? 250;
        const below = anchor.bottom + SPOT_PAD + m;
        const above = anchor.top - SPOT_PAD - m - ch;
        const fitsBelow = below + ch <= vh - m;
        const fitsAbove = above >= m;
        // dual(편집 아코디언 강조) 단계는 아코디언이 모달 '아래'에 보이도록 위쪽 우선.
        let top: number;
        if (rect2) {
            top = fitsAbove ? above : fitsBelow ? below : Math.max(m, (vh - ch) / 2);
        } else {
            top = fitsBelow ? below : fitsAbove ? above : Math.max(m, (vh - ch) / 2);
        }
        let left = anchor.left + anchor.width / 2 - cw / 2;
        left = Math.min(Math.max(m, left), vw - cw - m);
        setPos({ top, left });
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [rect, rect2, open, step, phase]);

    if (!open) return null;

    // 중앙 배치: 대상 없음 or (탐색 끝났는데 못 찾음). 즉시 가운데 표시.
    const centered = !rect && resolved;
    const cardStyle: React.CSSProperties = centered
        ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 1 }
        : pos
          ? { top: pos.top, left: pos.left, opacity: 1 }
          : { top: -9999, left: -9999, opacity: 0 };

    // 하이라이트 구멍(체험 단계에서 실제 클릭이 통과할 영역).
    const hx = rect ? rect.left - SPOT_PAD : 0;
    const hy = rect ? rect.top - SPOT_PAD : 0;
    const hw = rect ? rect.width + SPOT_PAD * 2 : 0;
    const hh = rect ? rect.height + SPOT_PAD * 2 : 0;

    const blockStop = (e: React.MouseEvent) => e.stopPropagation();

    // 체험 '구멍'(실제 클릭 통과)은 클릭해서 진행해야 하는 단계에서만 뚫는다.
    // 설명용(watch 없는 exp 마지막 단계 등)은 구멍 없이 강조만 — 조작은 막는다.
    const needsHole = !!cur.tryTarget || !!expPhase?.watch;

    return (
        // 컨테이너는 클릭을 통과시키고(pointer-events-none), 개별 차단막/카드만 이벤트를 받는다.
        <div
            className="fixed inset-0 z-50 pointer-events-none"
            aria-modal="true"
            role="dialog"
            aria-label="사용 가이드"
        >
            {/* 딤/클릭 차단 */}
            {!rect ? (
                <div className="absolute inset-0 bg-slate-900/55 pointer-events-auto" onClick={blockStop} />
            ) : needsHole ? (
                // 체험 단계: 구멍 주변만 막고 가운데는 실제 요소가 그대로 눌리게.
                <>
                    <div className="absolute inset-x-0 top-0 pointer-events-auto" style={{ height: hy }} onClick={blockStop} />
                    <div className="absolute inset-x-0 bottom-0 pointer-events-auto" style={{ top: hy + hh }} onClick={blockStop} />
                    <div className="absolute pointer-events-auto" style={{ top: hy, left: 0, width: hx, height: hh }} onClick={blockStop} />
                    <div className="absolute pointer-events-auto" style={{ top: hy, left: hx + hw, right: 0, height: hh }} onClick={blockStop} />
                </>
            ) : (
                <div className="absolute inset-0 pointer-events-auto" onClick={blockStop} />
            )}

            {/* 스포트라이트 */}
            {rect && rect2 ? (
                // 두 곳 동시 강조(미리보기 + 편집 아코디언): SVG 마스크로 두 구멍을 뚫고 각각 링.
                <>
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        aria-hidden
                    >
                        <defs>
                            <mask id="guideDualMask">
                                <rect width="100%" height="100%" fill="white" />
                                {[rect, rect2].map((r, i) => (
                                    <rect
                                        key={i}
                                        x={r.left - SPOT_PAD}
                                        y={r.top - SPOT_PAD}
                                        width={r.width + SPOT_PAD * 2}
                                        height={r.height + SPOT_PAD * 2}
                                        rx="12"
                                        fill="black"
                                    />
                                ))}
                            </mask>
                        </defs>
                        <rect
                            width="100%"
                            height="100%"
                            fill="rgba(15,23,42,0.55)"
                            mask="url(#guideDualMask)"
                        />
                    </svg>
                    {[rect, rect2].map((r, i) => (
                        <div
                            key={i}
                            className="absolute rounded-xl ring-2 ring-blue-400 pointer-events-none"
                            style={{
                                top: r.top - SPOT_PAD,
                                left: r.left - SPOT_PAD,
                                width: r.width + SPOT_PAD * 2,
                                height: r.height + SPOT_PAD * 2,
                            }}
                        />
                    ))}
                </>
            ) : rect ? (
                // 단일 강조: 큰 box-shadow 로 바깥을 어둡게, 가운데는 뚫어 대상 노출.
                <div
                    className="absolute rounded-xl ring-2 ring-blue-400 pointer-events-none"
                    style={{
                        top: rect.top - SPOT_PAD,
                        left: rect.left - SPOT_PAD,
                        width: rect.width + SPOT_PAD * 2,
                        height: rect.height + SPOT_PAD * 2,
                        boxShadow: "0 0 0 9999px rgba(15,23,42,0.55)",
                    }}
                />
            ) : null}

            {/* 데모(인터셉트) 단계: 강조 영역을 눌러 편집을 여는 투명 버튼 */}
            {cur.demo && phase === 0 && rect ? (
                <button
                    type="button"
                    className="absolute z-20 cursor-pointer rounded-xl pointer-events-auto"
                    style={{ top: hy, left: hx, width: hw, height: hh }}
                    onClick={(e) => {
                        e.stopPropagation();
                        demoClick();
                    }}
                    aria-label="여기를 클릭해 편집 열기"
                />
            ) : null}

            {/* 클릭 유도용 큰 커서 + 클릭 파동 */}
            {cursor && rect ? (
                <div
                    className="absolute z-10 pointer-events-none"
                    style={{
                        top: rect.top + rect.height / 2,
                        left: rect.left + rect.width / 2,
                    }}
                >
                    <span className="guide-ripple" />
                    <svg
                        className="guide-cursor"
                        width="38"
                        height="38"
                        viewBox="0 0 24 24"
                        aria-hidden
                    >
                        <path
                            d="M5 2.2 L5 19.2 L9.3 15.1 L12.1 20.8 L14.5 19.6 L11.7 14 L17.7 14 Z"
                            fill="#ffffff"
                            stroke="#1e293b"
                            strokeWidth="1.3"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            ) : null}

            {/* 안내 카드 */}
            <div
                ref={cardRef}
                className="absolute w-[min(450px,calc(100vw-24px))] bg-white rounded-2xl shadow-2xl p-6 transition-opacity duration-150 pointer-events-auto"
                style={cardStyle}
                onClick={blockStop}
            >
                <button
                    type="button"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center text-xl leading-none"
                    onClick={onClose}
                    aria-label="닫기"
                >
                    ×
                </button>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-blue-50 flex items-center justify-center text-2xl">
                        <span aria-hidden>{cur.icon}</span>
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((v) => !v)}
                                aria-expanded={menuOpen}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                                title="목차 — 원하는 단계로 바로 이동"
                            >
                                {step + 1} / {STEPS.length} 단계
                                <span className="text-[10px] leading-none">▾</span>
                            </button>
                            <span className="text-[11px] text-slate-400">
                                → 클릭 시 원하는 항목으로 바로 이동
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 leading-snug mt-0.5 whitespace-nowrap">
                            {title}
                        </h2>
                    </div>
                </div>
                {/* desc 는 우리가 작성하는 상수라 <br> · <b> 등 간단한 태그를 허용한다. */}
                <p
                    className="text-[15px] text-slate-700 leading-normal break-keep mt-8 text-center"
                    dangerouslySetInnerHTML={{ __html: desc }}
                />

                {/* 건너뛰기 · 이전/다음 */}
                <div className="flex items-center justify-between gap-2 mt-8">
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm text-slate-400 shrink-0 px-2"
                        onClick={onClose}
                    >
                        건너뛰기
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {!first ? (
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm px-2"
                                onClick={() => go(step - 1)}
                            >
                                이전
                            </button>
                        ) : null}
                        {last ? (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm px-3"
                                onClick={onClose}
                            >
                                시작하기
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm px-3"
                                onClick={() => go(step + 1)}
                            >
                                다음
                            </button>
                        )}
                    </div>
                </div>

                {/* 목차(바로가기) — 아무 단계로나 바로 이동 */}
                {menuOpen ? (
                    <div className="absolute left-4 right-4 top-16 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 z-10">
                        {STEPS.map((s, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => go(i)}
                                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm ${
                                    i === step
                                        ? "bg-blue-50 text-blue-700 font-semibold"
                                        : "text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <span className="w-5 text-center shrink-0" aria-hidden>
                                    {s.icon}
                                </span>
                                <span className="text-[11px] text-slate-400 shrink-0 w-5 text-right">
                                    {i + 1}
                                </span>
                                <span className="min-w-0 truncate">{s.menu}</span>
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
