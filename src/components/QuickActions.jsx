import { Link } from 'react-router-dom';
import { UserPlus, Footprints, MessageCircle } from 'lucide-react';

export default function QuickActions() {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-30 flex flex-col gap-2 sm:bottom-6 sm:right-6">
      <div className="pointer-events-auto flex flex-col gap-2 rounded-3xl border border-slate-200/90 bg-white p-2 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-2xl">
        <Link
          to="/customers"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
          title="Add customer"
        >
          <UserPlus className="h-5 w-5" />
        </Link>
        <Link
          to="/visits"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md transition hover:bg-emerald-500"
          title="Log visit"
        >
          <Footprints className="h-5 w-5" />
        </Link>
        <Link
          to="/comebackpage"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md transition hover:bg-emerald-600"
          title="Bring back (WhatsApp)"
        >
          <MessageCircle className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
