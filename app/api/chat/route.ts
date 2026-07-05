import { GoogleGenAI } from '@google/genai';
import { buildTasteContext } from '@/lib/taste-context';
import type { TasteProfile } from '@/lib/types';

const BASE_SYSTEM_PROMPT = `당신은 PickS의 AI 쇼핑 조수입니다. 소비자 중심으로 상품 비교, 가격 분석, 리뷰 요약을 도와줍니다.
- 항상 한국어로 답변하세요
- 친절하고 간결하게 답변하세요
- 상품 추천 시 가성비, 리뷰, 실사용 경험 관점에서 분석하세요
- 판매자 입장이 아닌 소비자 입장에서만 조언하세요`;

export async function POST(req: Request) {
  const { messages, tasteProfile } = await req.json() as {
    messages: Array<{ role: string; content: string }>;
    tasteProfile?: TasteProfile;
  };

  const systemPrompt = BASE_SYSTEM_PROMPT + (tasteProfile ? buildTasteContext(tasteProfile) : '');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key') {
    return Response.json({ error: 'GEMINI_API_KEY가 설정되지 않았어요.' }, { status: 500 });
  }

  const userMessage = messages[messages.length - 1].content;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text;
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[chat/route]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
