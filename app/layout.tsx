import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import { OLD_HUB, GITHUB } from "@/lib/content";

export const metadata: Metadata = {
  title: { default: "과학 수업 허브", template: "%s · 과학 수업 허브" },
  description: "고등학교 과학 12과목 44단원의 인터랙티브 수업 자료를 한곳에서 찾고, 지도안을 보고, 바로 여는 교사용 사이트",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

/* 화면이 그려지기 전에 다크 모드를 정해 깜빡임을 막습니다. */
const themeScript = `try{var t=localStorage.getItem('shn-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-teal-700 focus:px-4 focus:py-3 focus:font-bold focus:text-white"
        >
          본문으로 건너뛰기
        </a>
        <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="flex min-h-12 items-center gap-2 rounded-xl pr-2 text-lg font-extrabold tracking-tight focus-visible:outline-4 focus-visible:outline-teal-500"
            >
              <span aria-hidden className="text-2xl">🔭</span>
              <span>과학 수업 허브</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <a
                href={OLD_HUB}
                className="inline-flex min-h-12 items-center rounded-xl border-2 border-slate-300 px-3 text-sm font-bold text-slate-700 hover:border-teal-600 hover:text-teal-800 focus-visible:outline-4 focus-visible:outline-teal-500 dark:border-slate-700 dark:text-slate-200 dark:hover:border-teal-400 dark:hover:text-teal-200 sm:px-4 sm:text-base"
              >
                예전 허브
              </a>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="no-print border-t border-slate-200 py-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:px-6">
            <p>
              단원 화면은 각 과목 저장소의 GitHub Pages 에서 열립니다. 이 사이트는 목차·지도안·QR 만 모아 보여 줍니다.
            </p>
            <p>
              코드는 MIT, 학습 내용은 CC BY-NC-SA 4.0 ·{" "}
              <a className="underline underline-offset-2 hover:text-teal-700 dark:hover:text-teal-300" href={GITHUB}>
                GitHub 저장소
              </a>{" "}
              ·{" "}
              <a className="underline underline-offset-2 hover:text-teal-700 dark:hover:text-teal-300" href={OLD_HUB}>
                예전 허브
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
