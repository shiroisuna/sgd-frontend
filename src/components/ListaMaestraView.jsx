import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, ListChecks } from 'lucide-react';
import api from '../services/api';

const DOCS_POR_PAGINA = 15;

// Orden de los tipos de documento dentro de cada departamento (como en la lista maestra anterior)
const ORDEN_TIPO = ['CP', 'MA', 'PO', 'PR', 'IT', 'PG', 'PL', 'TB', 'FT', 'FO', 'LM', 'EX'];

const formatearFecha = (valor) => {
  if (!valor) return '—';
  const f = new Date(valor);
  if (isNaN(f)) return '—';
  return f.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Muestra como máximo 5 números de página alrededor de la actual
const paginasVisibles = (actual, total) => {
  const ventana = 5;
  let inicio = Math.max(1, actual - Math.floor(ventana / 2));
  let fin = Math.min(total, inicio + ventana - 1);
  inicio = Math.max(1, fin - ventana + 1);
  return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
};

// soloExternos = true → "Lista de Documentos Externos" (categoría EX de todos los departamentos)
export default function ListaMaestraView({ soloExternos = false }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroDepto, setFiltroDepto] = useState('');
  const [filtroDoc, setFiltroDoc] = useState('');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const res = await api.get('/documents', { params: { dept: 'TODOS' } });
        const lista = Array.isArray(res.data) ? res.data : [];
        setDocumentos(soloExternos ? lista.filter(d => (d.CodigoCategoria || '').toUpperCase() === 'EX') : lista);
      } catch (err) {
        console.error('Error al cargar la lista maestra:', err);
        setDocumentos([]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [soloExternos]);

  // Ordenado por departamento, tipo de documento y código
  const ordenados = useMemo(() => {
    const tipo = (codigo) => {
      const i = ORDEN_TIPO.indexOf((codigo || '').substring(0, 2).toUpperCase());
      return i === -1 ? 99 : i;
    };
    return [...documentos].sort((a, b) =>
      (a.CodigoDepartamento || '').localeCompare(b.CodigoDepartamento || '') ||
      tipo(a.CodigoDocumento) - tipo(b.CodigoDocumento) ||
      (a.CodigoDocumento || '').localeCompare(b.CodigoDocumento || '', 'es', { numeric: true })
    );
  }, [documentos]);

  // Filtros en vivo: departamento (código o nombre) y documento (código o nombre)
  const filtrados = useMemo(() => {
    const d = filtroDepto.trim().toLowerCase();
    const q = filtroDoc.trim().toLowerCase();
    return ordenados.filter(doc => {
      const depto = `${doc.CodigoDepartamento || ''} ${doc.NombreDepartamento || ''}`.toLowerCase();
      const texto = `${doc.CodigoDocumento || ''} ${doc.Titulo || ''}`.toLowerCase();
      return (!d || depto.includes(d)) && (!q || texto.includes(q));
    });
  }, [ordenados, filtroDepto, filtroDoc]);

  // Al escribir en un filtro se vuelve a la página 1
  useEffect(() => {
    setPagina(1);
  }, [filtroDepto, filtroDoc]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / DOCS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * DOCS_POR_PAGINA;
  const docsPagina = filtrados.slice(inicio, inicio + DOCS_POR_PAGINA);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left">
      <div className="flex items-center gap-2 mb-1">
        <ListChecks size={20} className="text-red-700" />
        <h2 className="text-xl font-extrabold text-slate-800 uppercase">
          {soloExternos ? 'Lista de Documentos Externos' : 'Lista Maestra de Documentos'}
        </h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        {soloExternos
          ? 'Documentos externos registrados en todos los departamentos.'
          : 'Todos los documentos controlados de todos los departamentos.'}
      </p>

      {/* Filtros (buscan mientras se escribe) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Departamento / Proceso</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              value={filtroDepto}
              onChange={(e) => setFiltroDepto(e.target.value)}
              placeholder="Ej: AL, Almacén, Sistemas..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Documento</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              value={filtroDoc}
              onChange={(e) => setFiltroDoc(e.target.value)}
              placeholder="Código o nombre del documento..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
            />
          </div>
        </div>
      </div>

      {/* Tabla (solo consulta, no abre documentos) */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-white text-xs uppercase">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Nombre</th>
              <th className="p-3 text-center">Revisión</th>
              <th className="p-3 text-center">Fecha de carga</th>
              <th className="p-3 text-center">Proceso</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs">
            {loading ? (
              <tr><td colSpan={5} className="text-center p-4 text-slate-400">Cargando...</td></tr>
            ) : docsPagina.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-4 text-slate-400">No hay documentos que coincidan con la búsqueda.</td></tr>
            ) : (
              docsPagina.map(doc => (
                <tr key={doc.IdDocumento} className="hover:bg-slate-50">
                  <td className="p-3 font-bold whitespace-nowrap">{doc.CodigoDocumento || 'S/C'}</td>
                  <td className="p-3">{doc.Titulo}</td>
                  <td className="p-3 text-center">{doc.Version ?? '0'}</td>
                  <td className="p-3 text-center whitespace-nowrap">{formatearFecha(doc.FechaSubida)}</td>
                  <td className="p-3 text-center font-semibold" title={doc.NombreDepartamento || ''}>
                    {doc.CodigoDepartamento || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {!loading && filtrados.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-xs text-slate-500">
          <span>
            Mostrando {inicio + 1}–{Math.min(inicio + DOCS_POR_PAGINA, filtrados.length)} de {filtrados.length} documentos
          </span>

          {totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ‹ Anterior
              </button>

              {paginasVisibles(paginaActual, totalPaginas).map(n => (
                <button
                  key={n}
                  onClick={() => setPagina(n)}
                  className={`w-8 h-8 rounded-lg font-bold transition ${
                    n === paginaActual
                      ? 'bg-red-700 text-white shadow-sm'
                      : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                onClick={() => setPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Siguiente ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}