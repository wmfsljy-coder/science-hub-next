/* science-hub-next 연결 파일 — 옛 단원 페이지를 새 사이트(/science-hub-next/u/<저장소>/<단원>/)에서 돌릴 때
   theme.js 바로 앞에서 한 번 불립니다(scripts/sync-units.mjs 가 끼워 넣음). 엔진 동작은 바꾸지 않고
   ① 새 사이트 기준 주소를 전역으로 알려 주고 ② 교사 기기에서만 '지도안·QR' 링크를 왼쪽 메뉴에 하나 붙입니다. */
(function () {
  var s = document.currentScript;
  var base = (s && s.getAttribute("data-base")) || "/science-hub-next";
  var repo = (s && s.getAttribute("data-repo")) || "";
  var unit = (s && s.getAttribute("data-unit")) || "";
  window.STH_BASE = base;
  window.STH_REPO = repo;
  window.STH_UNIT_SLUG = unit;

  function addPlanLink() {
    if (!window.STH_TEACHER || !repo || !unit) return;
    var brand = document.querySelector(".rail .brand");
    if (!brand || brand.querySelector("a.sth-plan")) return;
    var a = document.createElement("a");
    a.className = "home sth-plan";
    a.href = base + "/u/" + repo + "/" + unit + "/plan/";
    a.textContent = "지도안·QR";
    a.style.marginLeft = "10px";
    var home = brand.querySelector("a.home:not(.hub)");
    if (home && home.parentNode === brand) brand.insertBefore(a, home.nextSibling);
    else brand.insertBefore(a, brand.firstChild);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addPlanLink);
  else addPlanLink();
})();
