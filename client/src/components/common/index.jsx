// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-4', lg: 'w-12 h-12 border-4' }[size]
  return <div className={`${s} border-brand-600 border-t-transparent rounded-full animate-spin ${className}`} />
}

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Spinner size="lg" className="mx-auto mb-3" />
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  </div>
)

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
      {Icon && <Icon className="w-8 h-8 text-slate-400" />}
    </div>
    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">{title}</h3>
    <p className="text-sm text-slate-400 mb-6 max-w-xs">{description}</p>
    {action}
  </div>
)

// ─── Stats Card ───────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon: Icon, color = 'brand', trend }) => {
  const colors = {
    brand:   'bg-brand-50  dark:bg-brand-950/30  text-brand-600  dark:text-brand-400',
    green:   'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    red:     'bg-red-50    dark:bg-red-950/30    text-red-600    dark:text-red-400',
    amber:   'bg-amber-50  dark:bg-amber-950/30  text-amber-600  dark:text-amber-400',
    slate:   'bg-slate-50  dark:bg-slate-800      text-slate-600  dark:text-slate-400',
  }
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-2xl font-display font-bold text-slate-900 dark:text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
          {trend !== undefined && (
            <p className={`mt-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% this month
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} card shadow-2xl animate-slide-up max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
    </div>
  </Modal>
)

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    paid: 'badge-paid', draft: 'badge-draft', sent: 'badge-sent',
    overdue: 'badge-overdue', cancelled: 'badge-cancelled',
    active: 'badge-paid', inactive: 'badge-draft', free: 'badge-draft',
    pro: 'badge-sent', enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 badge',
  }
  return <span className={map[status] || 'badge-draft'}>{status}</span>
}

// ─── Search Input ─────────────────────────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative">
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="input pl-9 max-w-xs" />
  </div>
)

// ─── Pagination ───────────────────────────────────────────────────────────────
export const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null
  return (
    <div className="flex items-center gap-1 justify-center mt-6">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="btn-ghost btn-sm">‹</button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onPage(p)}
          className={`btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}>{p}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === pages} className="btn-ghost btn-sm">›</button>
    </div>
  )
}
