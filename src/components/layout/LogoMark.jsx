/** Shared with AdminLayout + business Layout — three-bar emerald mark */
export default function LogoMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center gap-0.5 rounded-2xl bg-white/5 ring-1 ring-white/10">
      <span className="h-6 w-1 rounded-full bg-emerald-500" />
      <span className="h-8 w-1 rounded-full bg-emerald-400" />
      <span className="h-5 w-1 rounded-full bg-emerald-600" />
    </div>
  );
}
