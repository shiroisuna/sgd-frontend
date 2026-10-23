import React from 'react';
import { Home, FileText, FolderOpen, ClipboardList, ExternalLink, BarChart3, Building2, ListChecks, LineChart } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, user, selectedDept, setSelectedDept }) {
  // Lista de departamentos disponibles (el admin puede ver todos, el usuario normal solo el suyo)
  const departamentos = [
    { id: 'SGD', nombre: 'SGD - Sistema de Gestión' },
    { id: 'PROD', nombre: 'Producción' },
    { id: 'MANT', nombre: 'Mantenimiento' },
    { id: 'ALM', nombre: 'Almacén' },
    { id: 'CAL', nombre: 'Control de Calidad' },
    { id: 'RRHH', nombre: 'Recursos Humanos' }
  ];

  const isAdmin = user?.rol === 'admin' || user?.nombreCompleto === 'admin' || user?.departamentoCodigo === 'ADMIN';

  const menuItems = [
    // { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'caracterizacion', label: 'Caracterización', icon: FileText },
    { id: 'documentos', label: 'Documentos', icon: FolderOpen },
    { id: 'formularios', label: 'Formularios', icon: ClipboardList },
    { id: 'listas-maestras', label: 'Listas Maestras', icon: ListChecks },
    { id: 'documentos-externos', label: 'Documentos Externos', icon: ExternalLink },
    { id: 'indicadores', label: 'Indicadores de Proceso', icon: BarChart3 },
    { id: 'graficas', label: 'Gráficas de Indicadores', icon: LineChart },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] shadow-sm">
      
      {/* Sección de Contexto de Módulo / Departamento */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-2 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
          <Building2 size={14} /> Módulo Activo
        </div>

        {isAdmin ? (
          /* Si es admin, mostramos un selector desplegable para cambiar de departamento */
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
          >
            {departamentos.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.nombre}
              </option>
            ))}
          </select>
        ) : (
          /* Si es usuario regular, se muestra fijo su departamento */
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-800">
            {user?.departamentoNombre || user?.departamentoCodigo || 'Departamento General'}
          </div>
        )}
      </div>

      {/* Navegación del Sidebar */}
      <div className="p-3 space-y-1 flex-1">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Menú de Gestión</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-red-700 text-white shadow-md shadow-red-700/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Footer del Sidebar con info de usuario */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs font-bold text-slate-800 truncate">{user?.nombreCompleto || 'Usuario'}</p>
        <p className="text-[10px] text-slate-500 capitalize">Rol: {user?.rol || 'Operativo'}</p>
      </div>

    </aside>
  );
}