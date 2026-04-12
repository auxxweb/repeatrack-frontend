import { Search } from 'lucide-react';

/**
 * Consistent search field for list views — pairs with client-side filtering.
 */
export default function ListSearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  inputClassName = '',
  id,
  autoFocus = false,
}) {
  return (
    <div className={`relative max-w-md ${className}`.trim()}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-theme-subtle"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        autoFocus={autoFocus}
        className={`input-field !pl-[2.75rem] sm:!pl-12 pr-4 ${inputClassName}`.trim()}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
        aria-label={placeholder}
      />
    </div>
  );
}
