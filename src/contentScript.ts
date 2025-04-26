// 0) 네비게이션 시작 감지해서 TTS 취소
window.addEventListener('yt-navigate-start', () => {
  window.speechSynthesis.cancel();
});

// 1) 페이지 타입 검사
function isWatchPage() {
  return location.pathname === '/watch' && location.search.includes('v=');
}
function isShortsPage() {
  return location.pathname.startsWith('/shorts/');
}

// 2) TTS 함수 (새로운 읽기 시작 전 이전 읽기 중단)
function speak(text: string) {
  window.speechSynthesis.cancel();           // 기존 음성 취소
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  window.speechSynthesis.speak(u);
}

// 3) watch 페이지: #info-strings 위에서 Shift+Hover
function setupWatchHover() {
  const info = document.querySelector<HTMLElement>('#info-strings');
  if (!info || info.dataset.ttsBound) return;
  info.dataset.ttsBound = 'true';

  info.addEventListener('mouseenter', (e: MouseEvent) => {
    if (!e.shiftKey) return;
    const title   = document.querySelector<HTMLElement>('h1.title yt-formatted-string')
                    ?.textContent?.trim() || '제목 없음';
    const channel = document.querySelector<HTMLElement>('#owner-name a')
                    ?.textContent?.trim()   || '채널명 없음';
    const meta    = Array.from(
      document.querySelectorAll<HTMLElement>('#metadata-line .inline-metadata-item')
    );
    const views   = meta[0]?.textContent?.trim() || '조회수 없음';
    const date    = meta[1]?.textContent?.trim() || '업로드 시간 없음';
    speak(`제목 ${title}, 채널 ${channel}, ${views}, 업로드 ${date}`);
  });
}

// 4) shorts 페이지: header 위에서 Shift+Hover
function setupShortsHover() {
  const header = document.querySelector<HTMLElement>('ytd-shorts-header-renderer');
  if (!header || header.dataset.ttsBound) return;
  header.dataset.ttsBound = 'true';

  header.addEventListener('mouseenter', (e: MouseEvent) => {
    if (!e.shiftKey) return;
    const title = header.querySelector<HTMLElement>(
      'h1.ytd-shorts-header-renderer'
    )?.textContent?.trim() || '제목 없음';
    const views = document.querySelector<HTMLElement>('.view-count')
                    ?.textContent?.trim()             || '조회수 없음';
    speak(`유튜브 쇼츠. 제목 ${title}, ${views}`);
  });
}

// 5) 피드 일반 영상: dismissible→details 위에서 Shift+Hover
function setupFeedHover() {
  document.querySelectorAll<HTMLDivElement>('div#dismissible').forEach(item => {
    if (item.dataset.ttsBound) return;
    item.dataset.ttsBound = 'true';

    item.addEventListener('mouseenter', (e: MouseEvent) => {
      if (!e.shiftKey) return;

      const details = item.querySelector<HTMLDivElement>('#details');
      if (!details) return;

      const titleEl   = details.querySelector<HTMLElement>('yt-formatted-string#video-title');
      const title     = titleEl?.textContent?.trim() || '';
      const channelEl = details.querySelector<HTMLAnchorElement>('div#text-container a');
      const channel   = channelEl?.textContent?.trim()   || '';
      const metaEls   = Array.from(
        details.querySelectorAll<HTMLElement>('span.inline-metadata-item')
      );
      const views     = metaEls[0]?.textContent?.trim()  || '';
      const date      = metaEls[1]?.textContent?.trim()  || '';

      const parts: string[] = [];
      if (title)   parts.push(`제목 ${title}`);
      if (channel) parts.push(`채널 ${channel}`);
      if (views)   parts.push(`${views}`);
      if (date)    parts.push(`업로드 ${date}`);

      if (parts.length) speak(parts.join(', '));
    });
  });
}

// 6) 피드 쇼츠 영상: ytm-shorts-lockup-view-model-v2 위에서 Shift+Hover
function setupFeedShortsHover() {
  document.querySelectorAll<HTMLElement>('ytm-shorts-lockup-view-model-v2').forEach(item => {
    if (item.dataset.ttsBound) return;
    item.dataset.ttsBound = 'true';

    item.addEventListener('mouseenter', (e: MouseEvent) => {
      if (!e.shiftKey) return;

      // 제목: h3 안 span 텍스트
      const title = item.querySelector<HTMLElement>(
        'h3.shortsLockupViewModelHostMetadataTitle span.yt-core-attributed-string'
      )?.textContent?.trim() || '제목 없음';

      // 조회수: subhead 안 span 텍스트
      const views = item.querySelector<HTMLElement>(
        'div.shortsLockupViewModelHostMetadataSubhead span.yt-core-attributed-string'
      )?.textContent?.trim() || '조회수 없음';

      speak(`쇼츠 영상. 제목 ${title}, ${views}`);
    });
  });
}

// 7) 피드 동적 감시 (일반 영상 + 쇼츠 영상)
function observeFeed() {
  const container = document.querySelector<HTMLElement>(
    'ytd-rich-grid-renderer, ytd-section-list-renderer, ytd-grid-renderer'
  );
  if (!container) return;
  setupFeedHover();
  setupFeedShortsHover();
  new MutationObserver(() => {
    setupFeedHover();
    setupFeedShortsHover();
  }).observe(container, { childList: true, subtree: true });
}

// 8) 초기화: 상황별 setup 호출
function init() {
  if (isWatchPage()) {
    setupWatchHover();
  } else if (isShortsPage()) {
    setupShortsHover();
  } else {
    observeFeed();
  }
}

// SPA 내비게이션과 첫 로드에 바인딩
window.addEventListener('yt-navigate-finish', () => {
  window.speechSynthesis.cancel();  // 안전을 위해 한 번 더
  init();
});
window.addEventListener('load', init);
