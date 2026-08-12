import React from 'react';
import { Moon, Sun } from 'lucide-react';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import { APP_PATHS } from '../../config/appConfig';
import { useTheme } from '../../context/ThemeContext';

export default function AjustesPage() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <ModulePageLayout activePath={APP_PATHS.ajustes}>
      {(sidebarCollapsed) => (
        <div
          className={`mx-auto max-w-[1200px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
        >
          <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
              Preferencias
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              Ajustes
            </h1>
            
          </header>

          <section className={`rounded-lg border p-5 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
              Apariencia
            </h2>
            

            <div className={`mt-4 flex items-center justify-between rounded-lg border p-4 ${darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-full ${darkMode ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-200 text-slate-600'}`}>
                  {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Modo oscuro</p>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {darkMode ? 'Activado' : 'Desactivado'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                onClick={toggleDarkMode}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${darkMode ? 'bg-red-700' : 'bg-slate-300'}`}
              >
                <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

          </section>
        </div>
      )}
    </ModulePageLayout>
  );
}
