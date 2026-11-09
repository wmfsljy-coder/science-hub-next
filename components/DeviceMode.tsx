"use client";

import { useEffect } from "react";

/* 과목 전체 QR(?all=1)로 들어온 학생 기기: 이 탭(sessionStorage) 동안 교사용 단추를 숨깁니다.
 * 옛 엔진(theme.js)과 같은 약속 — sessionStorage "sth-all" = "/science-hub-next-ywarpe/u/<저장소>/" 이면
 * 단원 화면도 그 과목 밖으로 나가는 링크를 숨기고 '← 단원 목록'을 이 과목 페이지로 돌립니다. 교사 기기(sth-teacher)는 그대로. */
export function StudentGate({ subj }: { subj: string }) {
  useEffect(() => {
    const root = document.documentElement;
    try {
      if (/[?&]all=1/.test(location.search)) sessionStorage.setItem("sth-all", subj);
      const teacher = localStorage.getItem("sth-teacher") === "1";
      root.classList.toggle("sth-student", !teacher && sessionStorage.getItem("sth-all") === subj);
    } catch {}
    return () => root.classList.remove("sth-student");
  }, [subj]);
  return null;
}

/* 교사용 화면(첫 화면·QR 모음)을 연 기기는 교사 기기로 표시 — 옛 허브와 같은 약속(단원에서 '← 허브' 링크, 잠긴 곳 열림) */
export function TeacherMark() {
  useEffect(() => {
    try {
      localStorage.setItem("sth-teacher", "1");
    } catch {}
  }, []);
  return null;
}
