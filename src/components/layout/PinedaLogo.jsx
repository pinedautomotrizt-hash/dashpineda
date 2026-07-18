import React from 'react';

// Logo corporativo compartido para mantener la misma identidad en cada módulo. Gerson
export default function PinedaLogo({ compact = false }) {
  return (
    <div className={`flex items-center ${compact ? 'justify-center' : 'gap-3'}`}>
      <svg className={compact ? 'h-10 w-10' : 'h-12 w-12'} viewBox="0 0 92 104" role="img" aria-label="Pineda Automotriz">
        <path d="M46 2C28.8 4.6 14.7 8.1 4.8 12.5 3.2 30.7 4.1 48.9 8.2 63.7 12.9 80.8 25.5 93.7 46 102c20.5-8.3 33.1-21.2 37.8-38.3 4.1-14.8 5-33 3.4-51.2C77.3 8.1 63.2 4.6 46 2Z" fill="#e9153b" />
        <path d="M27 24h29.5c17.9 0 27.1 7.2 27.1 19.8 0 13-9.8 22.3-28.7 22.3H39.5L35.7 85H18.4L27 24Z" fill="white" />
        <path d="M38.8 44.5H58c8 0 13.5 2.4 16.8 6.6-9.6-2.9-22.4-.1-38.5 8.4L38.8 44.5Z" fill="#e9153b" />
        <path d="M23 58.5c17.6-14.4 36.2-22 55.6-22.7-20.8 3.5-39.7 12.6-56.7 27.3L23 58.5Z" fill="#e9153b" />
      </svg>
      {!compact && (
        <div>
          <div className="text-lg font-black uppercase tracking-[.34em] text-[#e9153b]">Pineda</div>
          <div className="text-xs font-bold uppercase tracking-[.52em] text-[#e9153b]">Automotriz</div>
        </div>
      )}
    </div>
  );
}
