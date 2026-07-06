import { ArrowUpRight, BarChart3, Link2, Settings2 } from 'lucide-react';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { UtilityFeature } from '@/lib/types';
import { utilityFeatures } from '@/lib/mock-data';

const iconMap: Record<UtilityFeature['icon'], LucideIcon> = {
  link: Link2,
  chart: BarChart3,
  lifestyle: Settings2,
};

const featureHref: Record<string, string> = {
  u1: '/wishlist',
  u2: '/report',
  u3: '/mypage/taste',
};

export function SecondaryGrid() {
  return (
    <section aria-labelledby="utilities-heading">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 id="utilities-heading" className="text-sm font-semibold text-foreground">
            고급 유틸리티
          </h2>
          <p className="text-xs text-muted-foreground">쇼핑을 넘어 라이프 스타일을 관리하는 부가 서비스</p>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))' }}>
        {utilityFeatures.map((feature) => {
          const Icon = iconMap[feature.icon];
          const href = featureHref[feature.id];
          const cardClass =
            'group flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-background p-4 text-left transition-colors hover:border-foreground/30 hover:bg-zinc-50 dark:hover:bg-zinc-800';

          const inner = (
            <>
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-foreground">
                  <Icon className="size-4" />
                </span>
                <ArrowUpRight className="size-4 text-zinc-300 dark:text-zinc-600 transition-colors group-hover:text-foreground" />
              </div>
              <h3 className="mt-3 text-[13px] font-semibold leading-snug text-foreground">{feature.title}</h3>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{feature.description}</p>
              <div className="mt-3 flex items-baseline gap-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <span className="text-lg font-bold tabular-nums text-foreground">{feature.metric}</span>
                <span className="text-xs text-muted-foreground">{feature.metricLabel}</span>
              </div>
            </>
          );

          if (href) {
            return (
              <Link key={feature.id} href={href} className={cardClass}>
                {inner}
              </Link>
            );
          }

          return (
            <button key={feature.id} type="button" className={cardClass}>
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
