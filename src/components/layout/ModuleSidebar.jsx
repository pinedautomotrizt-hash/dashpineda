import React, { useState } from 'react';
import { Banknote, Building2, CalendarDays, Download, FileUp, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react';
import PinedaLogo from './PinedaLogo';
import { APP_MODULES, APP_PATHS } from '../../config/appConfig';
import { useAuth } from '../../context/AuthContext';


const icons = { banknote: Banknote, calendar: CalendarDays, dashboard: LayoutDashboard, users: Users, building: Building2, upload: FileUp, download: Download };

// Contenido compartido por el sidebar de escritorio y el drawer movil: mismos
// links, mismo bloque de usuario/logout, solo cambia el contenedor que lo envuelve.
function NavContent({ modules, activePath, collapsed, usuario, logout, onNavigate }) {
  return (
    <>
      <nav className="flex-1 space-y-1">
        {modules.map(({ path, label, icon }) => {
          const Icon = icons[icon];
          return (
          <a
            key={path}
            href={path}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
            className={`flex items-center rounded-md px-3 py-2 text-sm font-semibold ${collapsed ? 'justify-center' : 'gap-3'} ${activePath === path ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
          >
            <Icon size={18} />{!collapsed && label}
          </a>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 pt-3">
        {!collapsed && usuario && (
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-semibold text-slate-800" title={usuario.nombre}>{usuario.nombre}</p>
            <p className="text-xs text-slate-500">{usuario.rol === 'ADMIN' ? 'Administrador' : 'Asesor'}</p>
          </div>
        )}
        <button
          onClick={async () => { await logout(); window.location.href = APP_PATHS.login; }}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          <LogOut size={18} />{!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </>
  );
}

// Menu lateral. Es el unico responsable de su comportamiento responsive:
// - Desktop (lg+): <aside> fijo con expandir/contraer, como siempre.
// - Movil/tablet (<lg): desaparece el <aside> y en su lugar se muestra una barra
//   superior fija (logo + boton hamburguesa) que abre un drawer con el mismo
//   contenido. Asi, cualquier pagina que ya monta <ModuleSidebar> gana navegacion
//   movil sin tener que cambiar su propia estructura.
export default function ModuleSidebar({ activePath = window.location.pathname, collapsed = false, onCollapsedChange = () => {} }) {
  const { usuario, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const modules = APP_MODULES.filter((module) => !module.roles || module.roles.includes(usuario?.rol));

  return (
    <>
      {/* Barra superior movil/tablet */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <PinedaLogo compact />
        <button
          className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
          onClick={() => setMobileOpen(true)}
          title="Abrir menú"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Fondo + drawer movil/tablet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-white px-3 py-5 shadow-xl">
            <div className="mb-8 flex items-center justify-between">
              <PinedaLogo />
              <button
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                onClick={() => setMobileOpen(false)}
                title="Cerrar menú"
                aria-label="Cerrar menú"
              >
                <X size={19} />
              </button>
            </div>
            <NavContent
              modules={modules}
              activePath={activePath}
              collapsed={false}
              usuario={usuario}
              logout={logout}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Sidebar de escritorio */}
      <aside className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-slate-200 bg-white px-3 py-5 transition-all lg:flex ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className={`mb-8 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <PinedaLogo compact={collapsed} />
          {!collapsed && <button className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => onCollapsedChange(true)} title="Contraer menú"><Menu size={19} /></button>}
        </div>
        {collapsed && <button className="mb-4 grid h-10 w-full place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => onCollapsedChange(false)} title="Expandir menú"><Menu size={19} /></button>}
        <NavContent
          modules={modules}
          activePath={activePath}
          collapsed={collapsed}
          usuario={usuario}
          logout={logout}
        />
      </aside>
    </>
  );
}
