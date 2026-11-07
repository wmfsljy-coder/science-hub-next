"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* 학생 입장 QR. '크게 띄우기'를 누르면 화면 가득 보여 줘서 교실 TV 에 띄우기 좋습니다. */
export default function QrProjector({ svg, url, title }: { svg: string; url: string; title: string }) {
  const [big, setBig] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!big) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBig(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [big]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[240px] rounded-2xl bg-white p-3" role="img" aria-label={`${title} 학생용 주소 QR 코드`}>
        <div className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
      <p className="mt-2 break-all text-center text-xs text-slate-500 dark:text-slate-400">{url}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setBig(true)}
          className="min-h-12 rounded-xl bg-slate-900 px-3 text-base font-bold text-white hover:bg-slate-700 focus-visible:outline-4 focus-visible:outline-teal-500 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          크게 띄우기
        </button>
        <button
          type="button"
          onClick={copy}
          className="min-h-12 rounded-xl border-2 border-slate-300 px-3 text-base font-bold hover:border-teal-600 focus-visible:outline-4 focus-visible:outline-teal-500 dark:border-slate-600"
        >
          {copied ? "복사했어요" : "주소 복사"}
        </button>
      </div>

      {big &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="학생 입장 QR 크게 보기"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white p-6 text-slate-900"
          onClick={() => setBig(false)}
        >
          <p className="text-center text-2xl font-extrabold sm:text-4xl">{title}</p>
          <div
            className="aspect-square w-[min(80vw,70vh)] [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="break-all text-center text-lg font-semibold sm:text-2xl">{url}</p>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setBig(false)}
            className="min-h-14 rounded-2xl bg-slate-900 px-8 text-xl font-bold text-white focus-visible:outline-4 focus-visible:outline-teal-500"
          >
            닫기
          </button>
        </div>,
          document.body,
        )}
    </>
  );
}
