/*
 * 빌드할 때만 쓰는 내용 읽기 도구.
 * scripts/fetch-content.mjs 가 만든 content/generated.json 을 읽어 페이지에 넘깁니다.
 * (내용 폴더 위치는 CONTENT_DIR 환경 변수로 정하며, 스크립트가 처리합니다.)
 */
import fs from "node:fs";
import path from "node:path";

export const OLD_HUB = "https://wmfsljy-coder.github.io/science-teacher-hub/";
export const GITHUB = "https://github.com/wmfsljy-coder/science-hub-next";

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
  url: string;
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
