import React from 'react';

// Ícono del SGD: documento con marca de verificación sobre el color corporativo
export function LogoIcon({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="SGD"
    >
      <rect width="40" height="40" rx="9" fill="#2C6337" />
      {/* Hoja con esquina doblada */}
      <path d="M12 8h11l6 6v18a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" fill="#FFFFFF" />
      <path d="M23 8v4a2 2 0 0 0 2 2h4z" fill="#BCDBC2" />
      {/* Líneas de texto */}
      <rect x="13.5" y="17" width="10" height="2" rx="1" fill="#97C49F" />
      <rect x="13.5" y="21.5" width="12" height="2" rx="1" fill="#97C49F" />
      <rect x="13.5" y="26" width="6" height="2" rx="1" fill="#97C49F" />
      {/* Sello de documento controlado */}
      <circle cx="28" cy="29" r="6.5" fill="#BCDBC2" stroke="#2C6337" strokeWidth="2" />
      <path d="M25.2 29.1l1.9 1.9 3.8-3.9" fill="none" stroke="#2C6337" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Logo completo para el navbar: ícono + "SGD" + subtítulo
// Logo compacto para el navbar: ícono + "SGD" (subtítulo solo en pantallas grandes)
export default function Logo({ size = 32 }) {
  return (
    <div className="flex items-center gap-2 shrink-0 select-none">
      <LogoIcon size={size} />
      <div className="leading-none">
        <div className="font-extrabold text-lg tracking-wide text-red-800">SGD</div>
        <div className="hidden 2xl:block text-[10px] font-medium text-slate-500 mt-0.5 whitespace-nowrap">
          Gestión de Documentos
        </div>
      </div>
    </div>
  );
}
