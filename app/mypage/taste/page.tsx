'use client';

import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { TasteProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { SiteHeader } from '@/components/shopping/site-header';

/* ── 태그 데이터 ──────────────────────────────────────── */

const TAG_GROUPS = [
  {
    id: 'how-to-buy',
    label: '소비 성향 및 가치관',
    hint: 'AI가 추천 지수 계산 시 반영합니다',
    tags: [
      { id: '가성비최우선', label: '#가성비최우선' },
      { id: '품질중시_리뷰기반', label: '#품질중시 리뷰기반' },
      { id: '감성_디자인중시', label: '#감성·디자인중시' },
      { id: '대기업_정품신뢰', label: '#대기업 정품신뢰' },
      { id: '빠른배송_새벽배송', label: '#빠른배송·새벽배송' },
      { id: '친환경_비건', label: '#친환경·비건' },
      { id: '제일_저렴한_최저가', label: '#무조건 최저가' },
    ],
  },
  {
    id: 'how-to-live',
    label: '라이프스타일 및 주거 환경',
    hint: '상황 기반 큐레이션 시 배경 컨텍스트로 사용됩니다',
    tags: [
      { id: '1인가구_자취', label: '#1인가구·자취' },
      { id: '반려동물_집사', label: '#반려동물 집사' },
      { id: '맥시멀리스트', label: '#맥시멀리스트' },
      { id: '미니멀리스트', label: '#미니멀리스트' },
      { id: '재택근무러', label: '#재택근무러' },
      { id: '아이를_키우는_집', label: '#아이를 키우는 집' },
      { id: '집돌이_집순이', label: '#집돌이·집순이' },
    ],
  },
  {
    id: 'interests',
    label: '주요 관심사 및 활동',
    hint: '시즌·라이프스타일 기반 큐레이션 우선순위에 반영됩니다',
    tags: [
      { id: '캠핑_아웃도어', label: '#캠핑·아웃도어' },
      { id: '헬스_웰니스', label: '#헬스·웰니스' },
      { id: '인테리어_소품', label: '#인테리어·소품' },
      { id: '패션_트렌드setter', label: '#패션·트렌드세터' },
      { id: 'IT기기_테크덕후', label: '#IT기기·테크덕후' },
      { id: '요리_홈쿡', label: '#요리·홈쿡' },
      { id: '국내외_여행', label: '#국내외 여행' },
    ],
  },
  {
    id: 'personal',
    label: '패션 · 뷰티 및 선호 취향',
    hint: '개인 스타일 기반 상품 필터링에 활용됩니다',
    tags: [
      { id: '무채색_모노톤', label: '#무채색·모노톤' },
      { id: '미니멀룩', label: '#미니멀룩' },
      { id: '스트릿패션', label: '#스트릿패션' },
      { id: '오버핏_편안함', label: '#오버핏·편안함' },
      { id: '민감성피부', label: '#민감성 피부' },
      { id: '향에_민감함', label: '#향에 민감함' },
    ],
  },
] as const;

const PLATFORMS = [
  { id: '쿠팡', label: '쿠팡' },
  { id: '네이버쇼핑', label: '네이버 쇼핑' },
  { id: '무신사', label: '무신사' },
  { id: '29CM', label: '29CM' },
  { id: '지그재그', label: '지그재그' },
  { id: 'SSG', label: 'SSG닷컴' },
] as const;

/* ── 하위 컴포넌트 ──────────────────────────────────────── */

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-background p-5', className)}>{children}</div>;
}

function SectionTitle({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-4">
      <p className="text-[13px] font-semibold text-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TagToggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

/* ── 메인 페이지 ──────────────────────────────────────── */

export default function TasteProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { tasteProfile, setTasteProfile } = useStore();

  const [draft, setDraft] = useState<TasteProfile>(tasteProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    setDraft(tasteProfile);
  }, [tasteProfile]);

  if (loading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  const toggleTag = (id: string) => {
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(id) ? d.tags.filter((t) => t !== id) : [...d.tags, id],
    }));
  };

  const togglePlatform = (id: string) => {
    setDraft((d) => ({
      ...d,
      platforms: d.platforms.includes(id) ? d.platforms.filter((p) => p !== id) : [...d.platforms, id],
    }));
  };

  const handleSave = () => {
    setTasteProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isDirty = JSON.stringify(draft) !== JSON.stringify(tasteProfile);

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader
        rightSlot={
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty && !saved}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
              saved
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                : isDirty
                  ? 'bg-foreground text-background hover:opacity-80'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default',
            )}
          >
            {saved && <Check className="size-3" />}
            {saved ? '저장됨' : '저장하기'}
          </button>
        }
      />

      {/* 페이지 타이틀 */}
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-4">
        <h1 className="text-base font-bold text-foreground">나의 쇼핑 취향 프로필</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          당신의 라이프스타일과 쇼핑 성향을 등록해 두세요. AI 쇼핑 큐레이터가 이 데이터를 바탕으로 가장 알맞은 제품을 분석하고 픽(Pick)해드립니다.
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pb-16">
        {/* 1. 취향 키워드 태그 */}
        {TAG_GROUPS.map((group) => (
          <SectionCard key={group.id}>
            <SectionTitle label={group.label} hint={group.hint} />
            <div className="flex flex-wrap gap-2">
              {group.tags.map((tag) => (
                <TagToggle key={tag.id} label={tag.label} active={draft.tags.includes(tag.id)} onToggle={() => toggleTag(tag.id)} />
              ))}
            </div>
          </SectionCard>
        ))}

        {/* 2. AI 프롬프트 자유 입력 */}
        <SectionCard>
          <SectionTitle label="나만의 쇼핑 기준 직접 입력" hint="AI 조수가 추천 시 최우선으로 고려하는 개인 메모입니다" />
          <textarea
            value={draft.customNote}
            onChange={(e) => setDraft((d) => ({ ...d, customNote: e.target.value }))}
            placeholder="선택지에 없는 나만의 쇼핑 기준이 있다면 자유롭게 적어주세요.&#10;(예: 피부가 예민해서 인공 가죽 가방은 제외해 줘 / 캠핑용품은 무조건 블랙 컬렉션만 모으고 있어)"
            rows={4}
            className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs leading-relaxed text-foreground placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0 transition-colors"
          />
        </SectionCard>

        {/* 3. 선호 쇼핑 플랫폼 */}
        <SectionCard>
          <SectionTitle label="주로 이용하는 쇼핑 플랫폼" hint="선택한 플랫폼 위주로 링크와 가격을 탐색합니다" />
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <TagToggle key={p.id} label={p.label} active={draft.platforms.includes(p.id)} onToggle={() => togglePlatform(p.id)} />
            ))}
          </div>
        </SectionCard>

        {/* 4. 가성비 vs 프리미엄 슬라이더 */}
        <SectionCard>
          <SectionTitle label="소비 우선순위" hint="AI가 상품 추천 지수 계산 시 가격·품질 가중치에 반영됩니다" />
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className={cn('transition-colors', draft.priceBalance <= 40 ? 'text-foreground' : 'text-zinc-400')}>가성비 우선</span>
              <span className="text-[11px] text-muted-foreground">
                {draft.priceBalance === 50 ? '균형' : draft.priceBalance < 50 ? `가성비 ${100 - draft.priceBalance * 2}%` : `프리미엄 ${(draft.priceBalance - 50) * 2}%`}
              </span>
              <span className={cn('transition-colors', draft.priceBalance >= 60 ? 'text-foreground' : 'text-zinc-400')}>프리미엄 우선</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={0}
                max={100}
                value={draft.priceBalance}
                onChange={(e) => setDraft((d) => ({ ...d, priceBalance: Number(e.target.value) }))}
                className="slider-thumb w-full cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-zinc-700"
                style={{
                  height: '4px',
                  background: `linear-gradient(to right, #18181b ${draft.priceBalance}%, #e4e4e7 ${draft.priceBalance}%)`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, priceBalance: v }))}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] transition-colors',
                    draft.priceBalance === v ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-foreground',
                  )}
                >
                  {v === 0 ? '극가성비' : v === 25 ? '가성비' : v === 50 ? '균형' : v === 75 ? '프리미엄' : '최고급'}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* 하단 저장 버튼 (모바일) */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty && !saved}
          className={cn(
            'w-full rounded-2xl py-3.5 text-sm font-semibold transition-all',
            saved
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
              : isDirty
                ? 'bg-foreground text-background hover:opacity-80'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default',
          )}
        >
          {saved ? '✓ 저장 완료' : '취향 프로필 저장하기'}
        </button>
      </div>

      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #18181b;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
        }
        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #18181b;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
