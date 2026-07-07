/**
 * Converts a conversational Korean query into a clean keyword
 * suitable for Naver Shopping search.
 */
export function toSearchKeyword(query: string): string {
  let q = query;
  // Remove recipient phrase after comma: "추천해줘, 지인" → "추천해줘"
  q = q.replace(/[,，]\s*(지인|친구|남자\s*친구|여자\s*친구|남친|여친|부모님|엄마|아빠|남편|아내|부장님|상사|동료|선배|후배|아이|아기|본인|자신|나).*/g, '');
  // Remove trailing conversational verb phrases
  q = q.replace(/\s*(추천\s*해\s*줘|추천\s*해\s*주세요|추천\s*좀|알려\s*줘|알려\s*주세요|골라\s*줘|골라\s*주세요|사야\s*해|살까요?|구매\s*해\s*줘|뭐가\s*좋|어떤\s*[게거걸것](\s*좋)?|어떤\s*거\s*좋아?)\s*$/i, '');
  // Remove standalone recipient words not caught by comma rule
  q = q.replace(/\s+(지인|친구|선물용|선물\s*용)(\s|$)/g, ' ');
  // Trim trailing commas/spaces and collapse internal whitespace
  q = q.replace(/[,，\s]+$/, '').replace(/\s+/g, ' ').trim();
  return q || query;
}
