import { speak, numberToKoreanSino, parseKoreanUnitNumber } from './ttsHelper';

// 문장 중 숫자만 찾아서 한자 숫자로 변환하는 함수
function replaceNumbersWithSinoKorean(text: string): string {
  return text.replace(/\d+/g, (match) => numberToKoreanSino(parseInt(match, 10)));
}

// "순수 시간 포맷" 줄인지 판별 (예: 1:24, 1:24:39)
function isPureTimeFormat(text: string): boolean {
  return /^(\d{1,2}:\d{2}(:\d{2})?)$/.test(text.trim());
}

// 카드 하나 읽기
function readCard(card: HTMLElement): void {
  const rawLines = (card.innerText || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const lines = rawLines.filter(line =>
    !line.includes('재생') &&
    !/^자동재생/.test(line) &&
    !isPureTimeFormat(line)
  );
  if (lines.length < 2) return;

  let title = lines[0];
  let channel = lines[1];

  title = replaceNumbersWithSinoKorean(title);
  channel = replaceNumbersWithSinoKorean(channel);

  const viewRaw = lines.find(line => /조회수/.test(line) || /[0-9.]+[천만억]?회/.test(line)) || '';
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
      dateText = `올린 시간 ${numberToKoreanSino(num)}${unit} 전`;
    } else {
      dateText = `올린 시간 ${replaceNumbersWithSinoKorean(dateRaw)}`;
    }
  }

  const parts = [`제목 ${title}`, `채널명 ${channel}`];
  if (viewText) parts.push(`조회수 ${viewText}`);
  if (dateText) parts.push(dateText);

  speak(parts.join(', '));
}

// 피드 카드에 바인딩
function bindHoverDynamicText(): void {
  const selectors = 'div#dismissible, ytm-shorts-lockup-view-model-v2';
  document.querySelectorAll<HTMLElement>(selectors).forEach(card => {
    if (card.dataset.ttsBound) return;
    card.dataset.ttsBound = 'true';

    card.addEventListener('mouseenter', (e: MouseEvent) => {
      if (!e.shiftKey) return;  // Shift 키가 눌려있을 때만
      window.speechSynthesis.cancel();
      readCard(card);
    });
  });
}

// 초기화
function init(): void {
  bindHoverDynamicText();
}

// SPA 대응 및 음성 중단
window.addEventListener('yt-navigate-start', () => {
  window.speechSynthesis.cancel();
});
window.addEventListener('yt-navigate-finish', () => {
  window.speechSynthesis.cancel();
  init();
});
window.addEventListener('load', init);

// 동적 감지
new MutationObserver(init).observe(document.body, { childList: true, subtree: true });
