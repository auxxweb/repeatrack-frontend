import { Link } from 'react-router-dom';

export default function Signup() {
  return (
    <div className="bg-theme-page flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="glass-panel max-w-md p-10">
        <h1 className="font-admin text-xl font-semibold text-slate-900 dark:text-white">No public signup</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          RepeaTrack uses multi-tenant access. Super admins create businesses and owner accounts from the
          admin console.
        </p>
        <Link to="/login" className="btn-primary mt-6 inline-flex">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
