
export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // 본문 칼럼 폭: 100% 이되 최대 840px (max-w-210 = 52.5rem).
        // 편집기의 PC 미리보기 프레임(_preview/preview.tsx 의 max-w-210)과 같은 값이라
        // 미리보기에서 본 폭이 실제 사이트와 일치한다.
        // 이 값을 바꾸면 LiveSite 의 칼럼 오버레이 레이어 폭도 같이 맞춰야 한다.
        <div className="w-full max-w-210 mx-auto">
            {children}
        </div>
    );
}
