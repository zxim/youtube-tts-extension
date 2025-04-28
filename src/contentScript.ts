import { speak, numberToKoreanSino, parseKoreanUnitNumber } from './ttsHelper';

// 문장 중 숫자만 찾아서 한자 숫자로 변환하는 함수
function replaceNumbersWithSinoKorean(text: string): string {
  return text.replace(/\d+/g, (match) => numberToKoreanSino(parseInt(match, 10)));
}

// 피드 카드에 Shift+Hover 시 TTS로 읽어주는 바인딩
function bindHoverDynamicText(): void {
  const selectors = 'div#dismissible, ytm-shorts-lockup-view-model-v2';
  document.querySelectorAll<HTMLElement>(selectors).forEach(card => {
    if (card.dataset.ttsBound) return;
    card.dataset.ttsBound = 'true';

    card.addEventListener('mouseenter', (e: MouseEvent) => {
      if (!e.shiftKey) return;

      // 1) 전체 텍스트 줄 단위로 분리 후 노이즈 제거
      const rawLines = (card.innerText || '')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const lines = rawLines.filter(line =>
        !line.includes('재생') &&
        !/^\d{1,2}:\d{2}$/.test(line) &&
        !/^자동재생/.test(line)
      );
      if (lines.length < 2) return;

      // 2) 제목·채널
      let title   = lines[0];
      let channel = lines[1];

      // 숫자가 있다면 한자식 숫자로 변환
      title = replaceNumbersWithSinoKorean(title);
      channel = replaceNumbersWithSinoKorean(channel);

      // 3) 조회수 파싱
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

      // 4) 업로드 날짜 파싱
      const dateRaw = lines.find(line => /전$/.test(line) || line.startsWith('업로드')) || '';
      let dateText = '';
      if (dateRaw) {
        const dm = dateRaw.match(/(\d+)(개월|일|시간|분)/);
        if (dm) {
          const num = parseInt(dm[1], 10);
          const unit = dm[2];
          dateText = `올린 시간 ${numberToKoreanSino(num)}${unit} 전`;
        } else {
          // 혹시 다른 형식이면 전체 문장 숫자 변환
          dateText = `올린 시간 ${replaceNumbersWithSinoKorean(dateRaw)}`;
        }
      }

      // 5) 조합 & TTS
      const parts = [`제목 ${title}`, `채널명 ${channel}`];
      if (viewText) parts.push(`조회수 ${viewText}`);
      if (dateText) parts.push(dateText);

      speak(parts.join(', '));
    });
  });
}

function init(): void {
  bindHoverDynamicText();
}

// SPA 내비게이션 및 동적 로드 대응
window.addEventListener('yt-navigate-finish', init);
window.addEventListener('load', init);
new MutationObserver(init).observe(document.body, { childList: true, subtree: true });
