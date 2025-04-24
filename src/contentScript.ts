// 1) 페이지 타입 검사
function isWatchPage(): boolean {
    return location.pathname === '/watch' && location.search.includes('v=');
  }
  function isShortsPage(): boolean {
    return location.pathname.startsWith('/shorts/');
  }
  
  // 2) TTS 함수
  function speak(text: string) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    window.speechSynthesis.speak(u);
  }
  
  // 3) watch 페이지 정보 읽기
  function readVideoInfo() {
    const title   = document.querySelector<HTMLElement>('h1.title yt-formatted-string')?.textContent?.trim() || '제목 없음';
    const channel = document.querySelector<HTMLElement>('#owner-name a')?.textContent?.trim()       || '채널명 없음';
    const meta    = Array.from(document.querySelectorAll<HTMLElement>('#metadata-line .inline-metadata-item'));
    const views   = meta[0]?.textContent?.trim()    || '조회수 없음';
    const date    = meta[1]?.textContent?.trim()    || '업로드 시간 없음';
    speak(`제목 ${title}, 채널 ${channel}, ${views}, 업로드 ${date}`);
  }
  
  // 4) shorts 페이지 정보 읽기
  function readShortsInfo() {
    const title = document.querySelector<HTMLElement>('h1.ytd-shorts-header-renderer')?.textContent?.trim() || '제목 없음';
    const views = document.querySelector<HTMLElement>('.view-count')?.textContent?.trim()                  || '조회수 없음';
    speak(`유튜브 쇼츠. 제목 ${title}, ${views}`);
  }
  
  // 5) 피드에서 dismissible → details 구조로 호버 TTS (Ctrl+Hover)
  function setupFeedHover() {
    document.querySelectorAll<HTMLDivElement>('div#dismissible').forEach(item => {
      if (item.dataset.ttsBound) return;    // 이미 바인딩된 요소는 스킵
      item.dataset.ttsBound = 'true';
  
      item.addEventListener('mouseenter', (e: MouseEvent) => {
        if (!e.ctrlKey) return;  // Ctrl 키 누른 상태가 아니면 무시
  
        const details = item.querySelector<HTMLDivElement>('#details');
        if (!details) return;
  
        // 1) 영상 제목
        const titleEl = details.querySelector<HTMLElement>('yt-formatted-string#video-title');
        const title   = titleEl?.textContent?.trim() || '';
  
        // 2) 채널명: div#text-container 내부 <a> 태그
        const channelEl = details.querySelector<HTMLAnchorElement>('div#text-container a');
        const channel   = channelEl?.textContent?.trim() || '';
  
        // 3) 메타정보 (조회수, 업로드 시간)
        const metaEls = Array.from(details.querySelectorAll<HTMLElement>('span.inline-metadata-item'));
        const views   = metaEls[0]?.textContent?.trim() || '';
        const date    = metaEls[1]?.textContent?.trim() || '';
  
        // 4) 메시지 조합 후 TTS
        const parts: string[] = [];
        if (title)   parts.push(`제목 ${title}`);
        if (channel) parts.push(`채널 ${channel}`);
        if (views)   parts.push(`${views}`);
        if (date)    parts.push(`업로드 ${date}`);
  
        if (parts.length) speak(parts.join(', '));
      });
    });
  }
  
  // 6) 동적 로딩 대응 (피드 컨테이너 감시)
  function observeFeed() {
    const container = document.querySelector<HTMLElement>(
      'ytd-rich-grid-renderer, ytd-section-list-renderer, ytd-grid-renderer'
    );
    if (!container) return;
    setupFeedHover();
    new MutationObserver(() => setupFeedHover())
      .observe(container, { childList: true, subtree: true });
  }
  
  // 7) 초기화
  function init() {
    if (isWatchPage()) {
      readVideoInfo();
    } else if (isShortsPage()) {
      readShortsInfo();
    } else {
      observeFeed();
    }
  }
  
  // SPA 페이지 전환 감지 (YouTube 전용 이벤트)
  window.addEventListener('yt-navigate-finish', init);
  window.addEventListener('load', init);
  