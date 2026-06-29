import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 서브도메인 (예: cheonanblooming.localhost) 으로 들어온 요청만 통과.
// 베어 호스트(localhost, 127.0.0.1, www.example.com 등 의미있는 서브도메인이
// 없는 호스트) 는 "잘못된 접근입니다" 페이지로 막음.
//
// 추출 규칙은 src/app/setting/page.tsx 의 hostDomain 로직과 동일:
// - 점(.) 없으면 베어 (localhost 단독)
// - 첫 세그먼트가 숫자(IP) 면 베어
// - 첫 세그먼트가 'www' 면 베어 (마케팅/캐노니컬 사이트로 취급)
export function proxy(request: NextRequest) {
    const host = (request.headers.get("host") ?? "").toLowerCase();
    const hostname = host.split(":")[0];

    if (hasMeaningfulSubdomain(hostname)) {
        return NextResponse.next();
    }

    return new NextResponse(INVALID_ACCESS_HTML, {
        status: 403,
        headers: { "content-type": "text/html; charset=utf-8" },
    });
}

function hasMeaningfulSubdomain(hostname: string): boolean {
    if (!hostname.includes(".")) return false;
    const first = hostname.split(".")[0];
    if (!first || first === "www") return false;
    if (/^\d+$/.test(first)) return false; // IP 처럼 보이면 베어로 취급
    return true;
}

const INVALID_ACCESS_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>잘못된 접근입니다</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
html,body{height:100%;margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}
body{display:flex;align-items:center;justify-content:center;background:#f8fafc;color:#0f172a}
.box{text-align:center;padding:2rem;max-width:32rem}
h1{font-size:1.5rem;margin:0 0 .5rem;font-weight:600}
p{color:#64748b;margin:0;font-size:.875rem;line-height:1.6}
</style>
</head>
<body>
<div class="box">
<h1>잘못된 접근입니다</h1>
<p>이 페이지는 서브도메인(예: <code>your-site.localhost</code>)으로만 접근할 수 있습니다.</p>
</div>
</body>
</html>`;

export const config = {
    // _next 정적 자원과 favicon 은 항상 통과 (스타일/이미지가 깨지면 에러 페이지 자체도 깨짐)
    matcher: ["/((?!_next/|favicon\\.ico).*)"],
};
