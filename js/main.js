// ==========================================================
// 기준값 (변경 시 README에 명시)
// ==========================================================
const SCROLL_TOP_THRESHOLD = 300; // 스크롤 탑 버튼 표시 기준 (px)
const NAV_SCROLL_THRESHOLD = 60; // 네비 배경 변경 기준 (px)
const OBSERVER_THRESHOLD = 0.2; // 등장 애니메이션 임계값

// ==========================================================
// a. 햄버거 메뉴 토글 (모바일 풀스크린 오버레이)
// 이벤트(click) → 열림 상태 변경 → 클래스 토글로 렌더링
// ==========================================================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('active');
  hamburger.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

// ==========================================================
// b. 네비 링크 클릭 시 오버레이 메뉴 닫기 (개별 바인딩)
// 부드러운 이동 자체는 CSS(scroll-behavior)가 담당
// ==========================================================
const navLinks = document.querySelectorAll('.nav-link');

const closeMenu = () => {
  navMenu.classList.remove('active');
  hamburger.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');
};

navLinks.forEach((link) => {
  link.addEventListener('click', closeMenu);
});

// ==========================================================
// c. 스크롤 탑 버튼 + d. 네비 배경 변경
// 이벤트(scroll) → 스크롤 위치 상태 → 클래스 토글로 렌더링
// ==========================================================
const scrollTopButton = document.querySelector('.scroll-top');
const siteHeader = document.querySelector('.site-header');

window.addEventListener('scroll', () => {
  scrollTopButton.classList.toggle('visible', window.scrollY > SCROLL_TOP_THRESHOLD);
  siteHeader.classList.toggle('scrolled', window.scrollY > NAV_SCROLL_THRESHOLD);
});

scrollTopButton.addEventListener('click', () => {
  // behavior 옵션 없이도 CSS scroll-behavior가 적용되어 부드럽게 이동
  window.scrollTo({ top: 0 });
});

// ==========================================================
// f. 등장 애니메이션 (Intersection Observer, 반복 모드)
// 화면에 20% 들어오면 visible, 나가면 해제 → 재진입 시 재작동
// ==========================================================
const fadeSections = document.querySelectorAll('.fade-in');

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('visible', entry.isIntersecting);
    });
  },
  { threshold: OBSERVER_THRESHOLD }
);

fadeSections.forEach((section) => fadeObserver.observe(section));
