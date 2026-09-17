// ==========================================================
// main.js — 인터랙션 스크립트
// 공통 구조: 이벤트 발생 → 상태 변경 → 클래스/속성 토글 → CSS가 렌더링
// ==========================================================

// ----------------------------------------------------------
// 기준값 (변경 시 README에 명시)
// ----------------------------------------------------------
const SCROLL_TOP_THRESHOLD = 300; // 스크롤 탑 버튼 표시 기준 (px)
const NAV_SCROLL_THRESHOLD = 60; // 헤더 배경 전환 기준 (px)
const OBSERVER_THRESHOLD = 0.2; // 등장 애니메이션 임계값 (요소의 20%가 보일 때)

// ==========================================================
// a. 햄버거 메뉴 토글 (모바일 풀스크린 오버레이)
// 흐름: click → 열림 상태(.active) 토글 → CSS가 오버레이 표시/숨김
// ==========================================================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
  // toggle()의 반환값 = 토글 후 클래스 존재 여부 → 현재 열림 상태
  const isOpen = navMenu.classList.toggle('active');
  hamburger.classList.toggle('active', isOpen); // 햄버거 → X 모양 전환
  hamburger.setAttribute('aria-expanded', String(isOpen)); // 스크린리더에 상태 안내
});

// ==========================================================
// b. 네비 링크 클릭 시 오버레이 메뉴 닫기 (개별 바인딩)
// 섹션으로의 부드러운 이동 자체는 CSS(scroll-behavior)가 담당하므로,
// JS는 열려 있는 오버레이를 닫는 것만 책임진다
// ==========================================================
const navLinks = document.querySelectorAll('.nav-link');

/** 오버레이 메뉴를 닫힘 상태로 되돌린다 */
const closeMenu = () => {
  navMenu.classList.remove('active');
  hamburger.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');
};

navLinks.forEach((link) => {
  link.addEventListener('click', closeMenu);
});

// ==========================================================
// c. 스크롤 탑 버튼 + d. 헤더 배경 전환
// 흐름: scroll → 스크롤 위치(scrollY)와 기준값 비교 → 클래스 토글 → CSS 렌더링
// 하나의 scroll 리스너에서 두 상태를 함께 갱신한다
// ==========================================================
const scrollTopButton = document.querySelector('.scroll-top');
const siteHeader = document.querySelector('.site-header');

window.addEventListener('scroll', () => {
  // toggle(클래스, 조건): 조건이 true면 붙이고 false면 뗌 — if/else 없이 양방향 처리
  scrollTopButton.classList.toggle('visible', window.scrollY > SCROLL_TOP_THRESHOLD);
  siteHeader.classList.toggle('scrolled', window.scrollY > NAV_SCROLL_THRESHOLD);
});

scrollTopButton.addEventListener('click', () => {
  // behavior 옵션이 없어도 CSS scroll-behavior: smooth가 적용된다
  window.scrollTo({ top: 0 });
});

// ==========================================================
// e. 다크 모드
// 흐름: click → 상태 변수(currentTheme) 변경 → renderTheme()이 DOM 반영
// 상태의 원본은 JS 변수이고, DOM(data-theme)은 그 반영 결과다 (React의 state → 렌더링 구조)
// ==========================================================
const themeToggle = document.querySelector('.theme-toggle');

// 초기 테마 우선순위: ① localStorage 저장값 → ② 시스템 설정(prefers-color-scheme)
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let currentTheme = savedTheme ?? (systemPrefersDark ? 'dark' : 'light');

/**
 * 현재 테마 상태(currentTheme)를 DOM에 반영한다
 * - html의 data-theme 속성 → CSS 변수 재정의([data-theme="dark"]) 발동
 * - 토글 버튼의 아이콘/라벨도 상태에 맞춰 갱신
 */
const renderTheme = () => {
  document.documentElement.dataset.theme = currentTheme;
  themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  themeToggle.setAttribute(
    'aria-label',
    currentTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'
  );
};

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark'; // ① 상태 변경
  localStorage.setItem('theme', currentTheme); // ② 새로고침 대비 저장
  renderTheme(); // ③ 화면 반영
});

// 첫 로드 시 초기 테마를 화면에 반영
renderTheme();

// ==========================================================
// f. 등장 애니메이션 (Intersection Observer, 반복 모드)
// 흐름: 요소가 화면에 20% 교차하는 "사건" 발생 → visible 토글 → CSS 페이드인
// scroll 이벤트와 달리 교차 감시는 브라우저가 대신하고,
// 내 코드는 경계를 넘는 순간에만 호출된다
// ==========================================================
const fadeSections = document.querySelectorAll('.fade-in');

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // 반복 모드: 들어오면 켜고(true) 나가면 꺼서(false) 재진입 시 다시 재생
      entry.target.classList.toggle('visible', entry.isIntersecting);
    });
  },
  { threshold: OBSERVER_THRESHOLD }
);

fadeSections.forEach((section) => fadeObserver.observe(section));
