import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, X } from 'lucide-react';
import api from '../services/api';

/*
 * Recordatorio de carga de indicadores (los primeros días de cada mes).
 * El backend decide si está activo y qué falta; aquí solo se muestra.
 */
export function useRecordatorio(user) {
  const [datos, setDatos] = useState(null);
  const idUsuario = user?.id || user?.IdUsuario;

  useEffect(() => {
    if (!idUsuario) return;
    let activo = true;

    const cargar = async () => {
      try {
        const res = await api.get('/notifications', { params: { idUsuario } });
        if (activo) setDatos(res.data);
      } catch {
        if (activo) setDatos(null);
      }
    };

    cargar();
    const intervalo = setInterval(cargar, 10 * 60 * 1000);
    window.addEventListener('indicadorCargado', cargar); // se actualiza al cargar un indicador
    return () => {
      activo = false;
      clearInterval(intervalo);
      window.removeEventListener('indicadorCargado', cargar);
    };
  }, [idUsuario]);

  const pendientes = datos?.activo ? (datos.pendientes || []) : [];
  const total = pendientes.reduce((n, p) => n + (p.sinIndicadores ? 1 : p.indicadores.length), 0);
  return { datos, pendientes, total };
}

const textoPeriodo = (datos) => (datos?.periodo ? `${datos.periodo.nombreMes} ${datos.periodo.anio}` : '');

// Campana del navbar con la lista de pendientes
export function CampanaRecordatorio({ user, onIrACargar }) {
  const { datos, pendientes, total } = useRecordatorio(user);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const cerrar = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto(a => !a)}
        className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
        title="Notificaciones"
      >
        <Bell size={18} />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-lg rounded-xl z-50 text-left">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800">Notificaciones</p>
          </div>
          {total === 0 ? (
            <p className="px-4 py-4 text-xs text-slate-500">No tienes notificaciones pendientes.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <p className="px-4 pt-3 text-xs text-slate-600">
                Carga pendiente de indicadores de <strong>{textoPeriodo(datos)}</strong>:
              </p>
              {pendientes.map(p => (
                <div key={p.idDepartamento} className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs font-bold text-slate-800">{p.codigo} - {p.nombre}</p>
                  {p.sinIndicadores ? (
                    <p className="text-[11px] text-slate-500">Sin objetivos configurados para {datos.periodo.anio}.</p>
                  ) : (
                    <ul className="list-disc pl-4 text-[11px] text-slate-600">
                      {p.indicadores.map((i, k) => <li key={k}>{i}</li>)}
                    </ul>
                  )}
                </div>
              ))}
              <div className="p-3">
                <button
                  onClick={() => { setAbierto(false); onIrACargar?.(); }}
                  className="w-full bg-red-700 hover:bg-red-800 text-white text-xs font-semibold py-2 rounded-lg"
                >
                  Ir a cargar indicadores
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Aviso en la parte superior del contenido (se puede cerrar durante la sesión)
export function AvisoRecordatorio({ user, onIrACargar }) {
  const { datos, pendientes, total } = useRecordatorio(user);
  const clave = datos?.periodo ? `sgd_aviso_${datos.periodo.anio}_${datos.periodo.mes}` : null;
  const [cerrado, setCerrado] = useState(false);

  useEffect(() => {
    if (!clave) return;
    try { setCerrado(sessionStorage.getItem(clave) === '1'); } catch { /* sin almacenamiento */ }
  }, [clave]);

  if (total === 0 || cerrado) return null;

  const cerrar = () => {
    setCerrado(true);
    try { sessionStorage.setItem(clave, '1'); } catch { /* sin almacenamiento */ }
  };

  const resumen = pendientes
    .map(p => (p.sinIndicadores ? `${p.codigo} (sin objetivos configurados)` : `${p.codigo} (${p.indicadores.length})`))
    .join(', ');

  return (
    <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-left">
      <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-slate-700">
        <p className="font-bold text-slate-800">Recordatorio: carga de indicadores de {textoPeriodo(datos)}</p>
        <p>
          Del 1 al {datos.diasRecordatorio} de este mes se deben cargar los resultados del mes anterior.
          {datos.esAdmin ? ' Departamentos con pendientes: ' : ' Pendientes: '}<strong>{resumen}</strong>.
        </p>
        <button onClick={onIrACargar} className="mt-1 text-sm font-semibold text-red-700 hover:underline">
          Cargar ahora →
        </button>
      </div>
      <button onClick={cerrar} className="text-slate-400 hover:text-slate-700" title="Ocultar">
        <X size={18} />
      </button>
    </div>
  );
}
