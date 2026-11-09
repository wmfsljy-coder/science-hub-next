/*
 * 빌드할 때만 쓰는 내용 읽기 도구.
 * scripts/fetch-content.mjs 가 만든 content/generated.json 을 읽어 페이지에 넘깁니다.
 * (내용 폴더 위치는 CONTENT_DIR 환경 변수로 정하며, 스크립트가 처리합니다.)
 */
import fs from "node:fs";
import path from "node:path";

export const OLD_HUB = "https://wmfsljy-coder.github.io/science-teacher-hub-qtrqwc/";
export const GITHUB = "https://github.com/wmfsljy-coder/science-hub-next-ywarpe";
/** basePath (일반 <a> 링크·정적 파일 주소에 붙임) */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** 학생에게 주는 절대 주소 바탕(QR) */
export const SITE = "https://wmfsljy-coder.github.io/science-hub-next-ywarpe";

export type FlowStep = { label: string; kind: "intro" | "story" | "step" };
export type Standard = { code: string; text: string };
export type Period = { n: number; title: string; topic: string; terms: string[] };
export type Counts = {
  stories: number | null;
  quiz: number | null;
  labs: number | null;
  real: number | null;
  precheck: number | null;
};

export type Unit = {
  id: string;
  repo: string;
  slug: string;
  chapter: string;
  title: string;
  part: string;
  summary: string;
  topics: string[];
  /** 학생 주소(QR용, 절대 주소): https://…/science-hub-next-ywarpe/u/<저장소>/<단원>/ */
  url: string;
  /** 이 사이트 안 단원 화면(basePath 포함, 일반 <a> 링크용 — 단원 화면은 Next 페이지가 아니라 옮겨 담은 정적 HTML) */
  play: string;
  /** 예전 과목 저장소 주소 */
  oldUrl: string;
  /** 진도 열쇠: localStorage "sth-<key>" (episodes.js 의 sthUnit 값) */
  key: string;
  /** 소단원 [번호, 이름] — QR 모음용 */
  sections: [string, string][];
  thumb: string | null;
  thumbAlt: string;
  counts: Counts;
  standards: Standard[];
  periods: Period[];
  flow: FlowStep[];
  lesson: string;
};

export type Course = {
  repo: string;
  name: string;
  family: string;
  category: string;
  grade: string;
  emoji: string;
  color: string;
  landing: string | null;
  description: string;
  url: string;
  units: Unit[];
};

type Generated = { generatedAt: string; courses: Course[] };

let cache: Generated | null = null;

function load(): Generated {
  if (cache) return cache;
  const file = path.join(process.cwd(), "content", "generated.json");
  if (!fs.existsSync(file)) {
    throw new Error("content/generated.json 이 없습니다. 먼저 `node scripts/fetch-content.mjs` 를 실행하세요.");
  }
  cache = JSON.parse(fs.readFileSync(file, "utf8")) as Generated;
  return cache;
}

export function getCourses(): Course[] {
  return load().courses;
}

export function getCourse(repo: string): Course | undefined {
  return getCourses().find((c) => c.repo === repo);
}

export function getUnit(repo: string, slug: string): { course: Course; unit: Unit } | undefined {
  const course = getCourse(repo);
  const unit = course?.units.find((u) => u.slug === slug);
  return course && unit ? { course, unit } : undefined;
}

export function getAllUnits(): Unit[] {
  return getCourses().flatMap((c) => c.units);
}

export function generatedAt(): string {
  return load().generatedAt;
}

/* 이미지 주소: 우리 사이트 안 파일이면 basePath 를 붙입니다. */
export function assetUrl(src: string | null): string | null {
  if (!src) return null;
  return src.startsWith("/") ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${src}` : src;
}

/* 자료실(옛 허브 resources/ 표를 빌드 때 읽은 것) */
export type ResourceRow = {
  s: string;
  g: string;
  repo: string;
  unit: string;
  play: string;
  unitLabel: string;
  tab: string;
  kind: string;
  word: string;
  links: { href: string; text: string }[];
  open: string;
  note: string;
};

export function getResources(): { intro: string; rows: ResourceRow[] } {
  const file = path.join(process.cwd(), "content", "resources.json");
  if (!fs.existsSync(file)) return { intro: "", rows: [] };
  return JSON.parse(fs.readFileSync(file, "utf8"));
}