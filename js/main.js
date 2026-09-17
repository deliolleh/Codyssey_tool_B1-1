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

// ==========================================================
// g. 폼 검증 (Contact)
// 검증 시점 전략: ① blur — 필드를 떠날 때 검사 ("늦게 처벌")
//               ② input — 에러 상태인 필드만 재검사 ("고치면 즉시 해제")
//               ③ submit — 전체 검사 후 통과 시 성공 메시지
// 흐름: 이벤트 → 유효성 상태 판정 → 에러 그릇(visible)과 테두리(invalid) 렌더링
// ==========================================================
const contactForm = document.querySelector('.contact-form');
const formSuccess = document.querySelector('.form-success');
const formInputs = contactForm.querySelectorAll('input, textarea');

// 필드별 필수값 안내 문구
const REQUIRED_MESSAGES = {
  name: '이름을 입력해주세요.',
  email: '이메일을 입력해주세요.',
  message: '메시지를 입력해주세요.',
};

/**
 * 필드의 현재 값을 검사해 에러 메시지를 돌려준다 (통과면 빈 문자열)
 * - 필수값 검사: 직접 수행 (공백만 입력한 경우도 빈 값으로 취급)
 * - 이메일 형식 검사: 브라우저 내장 판정(checkValidity)에 위임
 */
const getErrorMessage = (input) => {
  if (input.value.trim() === '') {
    return REQUIRED_MESSAGES[input.name];
  }
  if (input.type === 'email' && !input.checkValidity()) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  return '';
};

/**
 * 검사 결과를 화면에 반영한다
 * - 에러 그릇(.form-error): 자리는 항상 있고 visible 클래스로만 표시 전환
 * - 입력창(.invalid): 빨간 테두리 표시
 */
const renderFieldError = (input, message) => {
  const errorEl = contactForm.querySelector(`[data-error-for="${input.name}"]`);
  errorEl.textContent = message;
  errorEl.classList.toggle('visible', message !== '');
  input.classList.toggle('invalid', message !== '');
};

/** 필드 하나를 검사하고 렌더링까지 수행. 통과 여부를 반환 */
const validateField = (input) => {
  const message = getErrorMessage(input);
  renderFieldError(input, message);
  return message === '';
};

formInputs.forEach((input) => {
  // blur: 필드를 떠나는 순간 검사 — 입력 중에는 침묵
  input.addEventListener('blur', () => validateField(input));

  // input: 이미 에러가 표시된 필드만 타이핑 중 재검사 — 고쳐지는 즉시 에러 해제
  input.addEventListener('input', () => {
    if (input.classList.contains('invalid')) {
      validateField(input);
    }
    formSuccess.hidden = true; // 새 입력이 시작되면 이전 성공 메시지는 감춤
  });
});

contactForm.addEventListener('submit', (event) => {
  event.preventDefault(); // 기본 동작(폼 전송 + 페이지 이동) 방지

  // 전체 필드 검사 — 스프레드(...)로 NodeList를 배열로 바꿔 map 사용
  const results = [...formInputs].map((input) => validateField(input));
  const isAllValid = results.every((passed) => passed);

  if (!isAllValid) {
    contactForm.querySelector('.invalid')?.focus(); // 첫 에러 필드로 포커스 이동
    return;
  }

  formSuccess.hidden = false;
  contactForm.reset();
});

// ==========================================================
// h. GitHub API 연동 (Projects 섹션)
// 흐름: loadProjects()가 상태 변수를 바꾸고 → renderProjects()가 상태를 화면으로 그림
// 화면 전체(상태 영역 + 카드 목록)가 "상태의 함수" — 다크모드와 같은 구조
// ==========================================================
const GITHUB_USERNAME = 'deliolleh';
const projectsStatus = document.querySelector('.projects-status');
const projectsGrid = document.querySelector('.projects-grid');

// 상태: 'loading' | 'success' | 'error' | 'empty'
let projectsState = 'loading';
let projectsData = []; // 성공 시 저장소 배열
let projectsErrorText = ''; // 에러 시 안내 문구

/** 실패 원인별 안내 문구를 고른다 (response가 null이면 네트워크 자체 실패) */
const getApiErrorText = (response) => {
  if (!response) return '네트워크 연결을 확인해주세요.';
  if (response.status === 403) return 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
  if (response.status === 404) return '사용자를 찾을 수 없습니다.';
  return '프로젝트를 불러올 수 없습니다.';
};

/**
 * 현재 상태(projectsState)를 화면에 반영한다
 * - 상태 영역: 로딩/에러/빈 상태를 동적 생성 (성공이면 비움)
 * - 카드 목록: 성공 시 구조분해 + map + 템플릿 리터럴로 생성 (ul > li > article)
 */
const renderProjects = () => {
  if (projectsState === 'loading') {
    projectsStatus.innerHTML = `
      <div class="spinner" role="status" aria-label="로딩 중"></div>
      <p class="status-message">로딩 중...</p>
    `;
    projectsGrid.innerHTML = '';
    return;
  }

  if (projectsState === 'error') {
    projectsStatus.innerHTML = `
      <p class="status-message">${projectsErrorText}</p>
      <button type="button" class="btn btn-outline retry-button">다시 시도</button>
    `;
    projectsGrid.innerHTML = '';
    return;
  }

  if (projectsState === 'empty') {
    projectsStatus.innerHTML = '<p class="status-message">표시할 프로젝트가 없습니다.</p>';
    projectsGrid.innerHTML = '';
    return;
  }

  // success: 구조분해 할당으로 필요한 필드만 꺼내고, map으로 카드 HTML 변환
  projectsStatus.innerHTML = '';
  projectsGrid.innerHTML = projectsData
    .map(
      ({ name, description, html_url, stargazers_count, language }) => `
      <li>
        <article class="project-card">
          <h3 class="project-name">
            <a href="${html_url}" target="_blank" rel="noopener">${name}</a>
          </h3>
          <p class="project-desc">${description ?? '설명이 없습니다.'}</p>
          <div class="project-meta">
            <span>⭐ ${stargazers_count}</span>
            <span>${language ?? '-'}</span>
          </div>
        </article>
      </li>
    `
    )
    .join('');
};

/** GitHub API를 호출하고 결과에 따라 상태를 전환한다 */
const loadProjects = async () => {
  projectsState = 'loading';
  renderProjects();

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated`
    );

    if (!response.ok) {
      // 403(레이트 리밋)·404 등 비정상 응답 → 에러 상태
      projectsState = 'error';
      projectsErrorText = getApiErrorText(response);
      renderProjects();
      return;
    }

    projectsData = await response.json();
    projectsState = projectsData.length === 0 ? 'empty' : 'success';
    renderProjects();
  } catch (error) {
    // fetch 자체가 실패(오프라인 등) → 네트워크 에러 상태
    console.error(error);
    projectsState = 'error';
    projectsErrorText = getApiErrorText(null);
    renderProjects();
  }
};

// 재시도 버튼은 에러 때마다 동적 생성되는 요소 → 부모에 이벤트 위임 (기능 3에서 예정한 그 패턴)
projectsStatus.addEventListener('click', (event) => {
  if (!event.target.matches('.retry-button')) return;
  loadProjects();
});

loadProjects();
