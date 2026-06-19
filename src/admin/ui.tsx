import React from 'react';

// -------------------------------------------------------------------------
// Shared admin UI primitives — a clean, professional "SaaS" content layer
// that sits on top of the colorful boutique background. Panels are crisp and
// mostly opaque; decorative clouds live in the background, not inside panels.
// -------------------------------------------------------------------------

type IconType = React.ComponentType<{ className?: string }>;

export const PANEL_CLASS =
  'rounded-2xl border border-boutique-brown/10 bg-white/92 shadow-[0_8px_28px_rgba(58,37,26,0.06)] backdrop-blur-sm';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon: Icon,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: IconType;
}) {
  return (
    <div className={`${PANEL_CLASS} px-5 py-5 sm:px-7 sm:py-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-boutique-brown-light">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {eyebrow}
            </div>
          )}
          <h1 className="font-serif text-3xl leading-tight text-boutique-brown sm:text-[2.4rem]">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  className = '',
  bodyClassName,
  children,
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`overflow-hidden ${PANEL_CLASS} ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b border-boutique-brown/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold tracking-tight text-boutique-brown">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-boutique-brown-light">{description}</p>}
          </div>
          {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName ?? 'p-5'}>{children}</div>
    </section>
  );
}

const STAT_TONES: Record<string, string> = {
  cream: 'bg-[#fff4df] text-boutique-brown',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
  rose: 'bg-rose-50 text-rose-700',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'cream',
  delta,
  hint,
}: {
  label: string;
  value: string | number;
  icon: IconType;
  tone?: keyof typeof STAT_TONES;
  delta?: { value: string; positive?: boolean };
  hint?: string;
}) {
  return (
    <div className={`${PANEL_CLASS} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-boutique-brown/55">{label}</p>
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${STAT_TONES[tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-3 font-serif text-3xl leading-none text-boutique-brown">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {delta && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
              delta.positive ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {delta.value}
          </span>
        )}
        {hint && <span className="text-xs text-boutique-brown-light">{hint}</span>}
      </div>
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  neutral: 'bg-[#f3f0ea] text-boutique-brown-light border-boutique-brown/10',
  green: 'bg-green-100 text-green-800 border-green-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-rose-100 text-rose-700 border-rose-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: keyof typeof BADGE_TONES }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconType;
};

const BUTTON_VARIANTS: Record<string, string> = {
  primary: 'bg-boutique-brown text-white hover:bg-boutique-wood shadow-sm',
  secondary: 'border border-boutique-brown/10 bg-white text-boutique-brown hover:bg-[#fff4df] shadow-sm',
  ghost: 'text-boutique-brown-light hover:bg-[#fff4df] hover:text-boutique-brown',
  danger: 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50',
};

export function Button({ variant = 'primary', icon: Icon, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  icon: Icon,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: IconType;
}) {
  return (
    <div className={`relative ${className}`}>
      {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-boutique-brown/40" />}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-full border border-boutique-brown/12 bg-white px-4 py-2.5 text-sm text-boutique-brown shadow-sm outline-none placeholder:text-boutique-brown/35 focus:ring-2 focus:ring-boutique-wood/25 ${Icon ? 'pl-10' : ''}`}
      />
    </div>
  );
}

// Professional table primitives
export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-sm ${className}`}>{children}</table>
    </div>
  );
}

export function TH({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`whitespace-nowrap border-b border-boutique-brown/10 bg-[#fffaf3]/60 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-boutique-brown/55 ${className}`}>
      {children}
    </th>
  );
}

export function TD({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`border-b border-boutique-brown/8 px-4 py-3 align-middle text-boutique-brown ${className}`}>{children}</td>;
}

export function EmptyState({ icon: Icon, title, description }: { icon?: IconType; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown/70">
          <Icon className="h-7 w-7" />
        </span>
      )}
      <p className="font-serif text-xl text-boutique-brown">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-boutique-brown-light">{description}</p>}
    </div>
  );
}
