import { numberToKoreanSino } from './ttsHelper';

// 텍스트 기반 믹스 감지
export function isMixCard(card: HTMLElement): boolean {
  const text = card.innerText || '';
  return text.includes('믹스 재생목록') || text.startsWith('믹스 -');
}

// 텍스트 기반 믹스 정보 추출
export function parseMixCard(card: HTMLElement): string[] {
  const lines = (card.innerText || '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const title = lines.find(l => l.startsWith('믹스 -')) || '';
  const artist = lines.find(l => /등$/.test(l)) || '';

  const titleText = title.replace(/\d+/g, m =>
    numberToKoreanSino(parseInt(m, 10))
  );

  const parts: string[] = ['믹스 영상'];
  if (titleText) parts.push(`제목 ${titleText}`);
  if (artist) parts.push(`믹스 목록 ${artist}`);
  return parts;
}
