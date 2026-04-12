export default function StatCard({ title, value, hint, icon: Icon }) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-500">
            {title}
          </p>
          <p className="mt-2 font-admin text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-600 dark:text-emerald-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
