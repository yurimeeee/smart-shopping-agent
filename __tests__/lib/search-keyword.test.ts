import { toSearchKeyword } from '@/lib/search-keyword';

describe('toSearchKeyword', () => {
  it('removes comma+recipient AND trailing verb phrase in one pass', () => {
    // Step1 removes ", 지인", then step2 removes "추천 해줘"
    expect(toSearchKeyword('30대 여성 생일 선물 추천 해줘, 지인')).toBe('30대 여성 생일 선물');
  });

  it('removes trailing 어떤 게 좋', () => {
    expect(toSearchKeyword('무선 이어폰 어떤 게 좋')).toBe('무선 이어폰');
  });

  it('removes trailing 뭐가 좋 (without 아)', () => {
    expect(toSearchKeyword('노트북 뭐가 좋')).toBe('노트북');
  });

  it('does NOT strip 뭐가 좋아 (trailing 아 not in pattern)', () => {
    // Regex only matches "뭐가\s*좋" without trailing 아
    expect(toSearchKeyword('무선 이어폰 뭐가 좋아')).toBe('무선 이어폰 뭐가 좋아');
  });

  it('removes trailing 골라줘', () => {
    expect(toSearchKeyword('노트북 골라줘')).toBe('노트북');
  });

  it('removes trailing 사야 해', () => {
    expect(toSearchKeyword('아이패드 사야 해')).toBe('아이패드');
  });

  it('removes trailing 추천해주세요', () => {
    expect(toSearchKeyword('iPhone 16 추천해주세요')).toBe('iPhone 16');
  });

  it('removes trailing 알려줘', () => {
    expect(toSearchKeyword('청바지 알려줘')).toBe('청바지');
  });

  it('returns plain query unchanged when no conversational words', () => {
    expect(toSearchKeyword('삼성 갤럭시 S24')).toBe('삼성 갤럭시 S24');
  });

  it('returns the original string when result would be empty', () => {
    expect(toSearchKeyword('')).toBe('');
  });

  it('removes 추천해줘 at end', () => {
    expect(toSearchKeyword('에어팟 추천해줘')).toBe('에어팟');
  });

  it('removes 추천 좀 at end', () => {
    expect(toSearchKeyword('다이슨 청소기 추천 좀')).toBe('다이슨 청소기');
  });

  it('removes trailing 골라 주세요 with spaces', () => {
    expect(toSearchKeyword('커피머신 골라 주세요')).toBe('커피머신');
  });

  it('removes recipient 친구 after comma', () => {
    expect(toSearchKeyword('생일 선물, 친구')).toBe('생일 선물');
  });

  it('removes standalone 선물용 from the middle', () => {
    const result = toSearchKeyword('노트북 선물용 추천');
    expect(result).not.toContain('선물용');
  });
});
