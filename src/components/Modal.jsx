import { X } from 'lucide-react';

export default function Modal({
  open,
  title,
  onClose,
  children,
  wide,
  panelClassName = '',
  titleClassName = 'font-admin',
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/70"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200/90 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900 sm:rounded-3xl ${panelClassName} ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className={`${titleClassName} text-lg font-semibold text-slate-900 dark:text-white`}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
