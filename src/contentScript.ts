import {
  speak,
  numberToKoreanSino,
  numberToNativeKorean,
  parseKoreanUnitNumber,
} from './ttsHelper';
import { isMixCard, parseMixCard } from './mix';

function replaceNumbersWithSinoKorean(text: string): string {
  return text.replace(/\d+/g, match => numberToKoreanSino(parseInt(match, 10)));
}

function isPureTimeFormat(text: string): boolean {
  return /^(\d{1,2}:\d{2}(:\d{2})?)$/.test(text.trim());
}

function hasLiveBadge(card: HTMLElement): boolean {
  return !!card.querySelector('ytd-badge-supported-renderer p')?.textContent?.includes('실시간');
}

function readCard(card: HTMLElement): void {
  if (isMixCard(card)) {
    const parts = parseMixCard(card);
    speak(parts.join(', '));
    return;
  }

  const rawLines = (card.innerText || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const lines = rawLines.filter(line =>
    !line.includes('재생') &&
    !/^자동재생/.test(line) &&
    !isPureTimeFormat(line)
  );
  if (lines.length === 0) return;

  const isShorts = card.tagName.toLowerCase() === 'ytm-shorts-lockup-view-model-v2';
  const isLive = hasLiveBadge(card);
  const viewerLine = rawLines.find(line => /명 시청 중/.test(line)) || '';
  const viewerText = viewerLine ? replaceNumbersWithSinoKorean(viewerLine) : '';

  const titleLine =
    lines.find(
      line =>
        !/라이브|실시간/.test(line) &&
        !/조회수/.test(line) &&
        !/명 시청 중/.test(line) &&
        !/업로드/.test(line)
    ) || '';

  const title = replaceNumbersWithSinoKorean(titleLine);
  const titleIndex = lines.indexOf(titleLine);

  const channelLine =
    lines.slice(titleIndex + 1).find(
      line =>
        !/조회수/.test(line) &&
        !/명 시청 중/.test(line) &&
        !/업로드/.test(line)
    ) || '';

  const channel = replaceNumbersWithSinoKorean(channelLine);

  const viewRaw =
    lines.find(line => /조회수/.test(line) || /[0-9.]+[천만억]?회/.test(line)) || '';
  let viewText = '';
  if (viewRaw) {
    const match = viewRaw.match(/([\d.]+)([천만억]?)(?=회)/);
    if (match) {
      const numStr = match[1] + (match[2] || '');
      const parsed = parseKoreanUnitNumber(numStr);
      if (parsed !== null) {
        viewText = `${numberToKoreanSino(parsed)}회`;
      }
    }
  }

  const dateRaw = lines.find(line => /전$/.test(line) || line.startsWith('업로드')) || '';
  let dateText = '';
  if (dateRaw) {
    const dm = dateRaw.match(/(\d+)(개월|일|시간|분)/);
    if (dm) {
      const num = parseInt(dm[1], 10);
      const unit = dm[2];
      if (unit === '시간') {
        dateText = `올린 시간 ${numberToNativeKorean(num)}${unit} 전`;
      } else {
        dateText = `올린 시간 ${numberToKoreanSino(num)}${unit} 전`;
      }
    } else {
      dateText = `올린 시간 ${replaceNumbersWithSinoKorean(dateRaw)}`;
    }
  }

  const parts: string[] = [];
  if (isShorts) parts.push('쇼츠 영상');
  if (isLive) parts.push('라이브 영상');
  if (title) parts.push(`제목 ${title}`);
  if (channel) parts.push(`채널명 ${channel}`);
  if (isLive && viewerText) parts.push(viewerText);
  if (!isLive && viewText) parts.push(`조회수 ${viewText}`);
  if (!isLive && dateText) parts.push(dateText);

  speak(parts.join(', '));
}

function bindHoverDynamicText(): void {
  const selectors = 'div#dismissible, ytm-shorts-lockup-view-model-v2, .yt-lockup-view-model-wiz'; // 믹스용 셀렉터 추가
  document.querySelectorAll<HTMLElement>(selectors).forEach(card => {
    if (card.dataset.ttsBound) return;
    card.dataset.ttsBound = 'true';

    card.addEventListener('mouseenter', (e: MouseEvent) => {
      if (!e.shiftKey) return;
      window.speechSynthesis.cancel();

      requestAnimationFrame(() => {
        setTimeout(() => {
          readCard(card);
        }, 50);
      });
    });
  });
}

function init(): void {
  bindHoverDynamicText();
}

window.addEventListener('yt-navigate-start', () => {
  window.speechSynthesis.cancel();
});
window.addEventListener('yt-navigate-finish', () => {
  window.speechSynthesis.cancel();
  init();
});
window.addEventListener('load', init);

new MutationObserver(init).observe(document.body, {
  childList: true,
  subtree: true,
});
