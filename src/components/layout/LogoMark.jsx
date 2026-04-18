import { ChartColumn, Repeat2 } from 'lucide-react';

/** Repeat visits + analytics — shared with public/favicon.svg */
export default function LogoMark() {
  return (
    <div
      className="flex h-11 w-11 items-center justify-center gap-0.5 rounded-2xl bg-white/5 ring-1 ring-white/10"
      aria-hidden
    >
      <Repeat2 className="h-[21px] w-[21px] shrink-0 text-emerald-400" strokeWidth={2.25} />
      <ChartColumn className="h-[21px] w-[21px] shrink-0 text-emerald-500" strokeWidth={2.25} />
    </div>
  );
}
