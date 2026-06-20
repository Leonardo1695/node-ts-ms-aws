import type { ReactNode } from 'react';
import { Aurora } from '../react-bits/aurora';
import { GradientText } from '../react-bits/gradient-text';
import { ShinyText } from '../react-bits/shiny-text';

interface PageHeadingProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  aurora?: boolean;
}

export function PageHeading({
  eyebrow,
  title,
  description,
  aurora = false,
}: PageHeadingProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-6 ${
        aurora ? 'min-h-[8.5rem]' : ''
      }`}
    >
      {aurora ? <Aurora /> : null}
      <div className="relative z-10">
        <p className="text-sm font-medium uppercase tracking-wide">
          <GradientText>{eyebrow}</GradientText>
        </p>
        <h2 className="mt-2 text-display-sm font-semibold">
          <ShinyText text={title} />
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
