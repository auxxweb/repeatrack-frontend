import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('repeatrack_pwa_install_dismiss') === '1'
  );

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (!deferred || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md sm:left-auto sm:right-4">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-surface-900/95 dark:shadow-2xl">
        <Download className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-slate-900 dark:text-white">Install RepeaTrack</p>
          <p className="text-xs text-slate-600 dark:text-slate-500">Add to your home screen for faster access.</p>
        </div>
        <button type="button" className="btn-primary shrink-0 py-2 text-xs" onClick={install}>
          Install
        </button>
        <button
          type="button"
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem('repeatrack_pwa_install_dismiss', '1');
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
