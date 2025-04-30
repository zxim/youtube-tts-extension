// 한자 숫자 자리수 및 단위
const digits = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const units = [
  { v: 1e12, str: '조' },
  { v: 1e8,  str: '억' },
  { v: 1e4,  str: '만' },
  { v: 1e3,  str: '천' },
  { v: 1e2,  str: '백' },
  { v: 10,   str: '십' },
  { v: 1,    str: '' }
];

// 숫자를 받아 한자 숫자로 변환
export function numberToKoreanSino(num: number): string {
  if (num === 0) return '영';
  let res = '';
  for (const { v, str } of units) {
    const cnt = Math.floor(num / v);
    if (cnt > 0) {
      if (v >= 1e8) {  // 억, 조 단위
        if (cnt === 1) {
          res += '일' + str;
        } else {
          res += numberToKoreanSino(cnt) + str;
        }
      } else if (v >= 10) {  // 십, 백, 천 단위
        if (cnt > 1) {
          res += numberToKoreanSino(cnt);
        }
        res += str;
      } else {
        res += digits[cnt];
        res += str;
      }
      num %= v;
    }
  }
  return res;
}

// "1.2만" → 12000, "1.2천" → 1200
export function parseKoreanUnitNumber(text: string): number | null {
  const m = text.match(/([\d.]+)\s*([천만억조]?)/);  // 조 단위까지
  if (!m) return null;
  const val = parseFloat(m[1]);
  const mul = m[2] === '조' ? 1e12
            : m[2] === '억' ? 1e8
            : m[2] === '만' ? 1e4
            : m[2] === '천' ? 1e3
            : 1;
  return Math.round(val * mul);
}

// 고유어 수사 변환 (1~20까지만)
const nativeDigits = [
  '', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉',
  '열', '열한', '열두', '열세', '열네', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스무'
];

// 숫자를 고유어(하나 둘 셋)로 변환 (시간 단위용)
export function numberToNativeKorean(num: number): string {
  if (num >= 1 && num <= 20) {
    return nativeDigits[num];
  }
  // 21 이상이면 그냥 한자 숫자 방식
  return numberToKoreanSino(num);
}

// TTS 읽기
export function speak(text: string) {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ko-KR';
  window.speechSynthesis.speak(utt);
}
