import type { TasteProfile } from './types';

export function buildTasteContext(profile: TasteProfile): string {
  const parts: string[] = [];

  if (profile.tags.length > 0) {
    parts.push(`소비 성향/라이프스타일/관심사: ${profile.tags.map((t) => `#${t}`).join(', ')}`);
  }

  if (profile.platforms.length > 0) {
    parts.push(`선호 쇼핑 플랫폼 (이 플랫폼 위주로 탐색): ${profile.platforms.join(', ')}`);
  }

  const b = profile.priceBalance;
  const balanceText =
    b <= 20 ? '극가성비 우선 (가격이 최우선)'
    : b <= 40 ? '가성비 우선'
    : b <= 60 ? '가성비·프리미엄 균형'
    : b <= 80 ? '프리미엄 우선'
    : '최고급 품질 우선 (가격 무관)';
  parts.push(`소비 우선순위: ${balanceText}`);

  if (profile.customNote.trim()) {
    parts.push(`개인 메모 (반드시 준수): "${profile.customNote.trim()}"`);
  }

  if (parts.length === 0) return '';

  return `\n\n[사용자 취향 프로필 - 아래 조건을 추천에 반드시 반영하세요]\n${parts.map((p) => `- ${p}`).join('\n')}`;
}
