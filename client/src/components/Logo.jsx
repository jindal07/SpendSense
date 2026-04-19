import { cn } from '@/lib/utils';

/**
 * SpendSense brandmark. Renders inline SVG so it can scale crisply
 * and inherit size via className.
 */
export function Logo({ className, title = 'SpendSense' }) {
  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label={title}
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="ss-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d12e49" />
          <stop offset="55%" stopColor="#a857a7" />
          <stop offset="100%" stopColor="#4c35fd" />
        </linearGradient>
        <linearGradient id="ss-logo-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#ss-logo-bg)" />
      <rect width="512" height="260" rx="112" fill="url(#ss-logo-shine)" />
      <polyline
        points="104,372 168,332 232,360 296,288 360,316 408,266"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="408" cy="266" r="12" fill="#ffffff" />
      <text
        x="50%"
        y="56%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontFamily="'Exo 2', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="320"
        fontWeight="700"
        letterSpacing="-10"
      >
        ₹
      </text>
    </svg>
  );
}

/**
 * Full brand wordmark (logo + "SpendSense" text with gradient accent).
 */
export function BrandWordmark({ className, logoClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Logo className={cn('h-9 w-9 rounded-2xl shadow-glow-indigo', logoClassName)} />
      <span className="font-semibold text-lg tracking-tight leading-none">
        Spend
        <span className="text-gradient font-bold">Sense</span>
      </span>
    </span>
  );
}
