import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, Cell, LabelList
} from 'recharts';
import { BarChart3, CheckCircle2, XCircle, MinusCircle, Table2, Target, TrendingUp } from 'lucide-react';
import api from '../services/api';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Paleta categórica validada (orden fijo) para los años; status reservado para cumplimiento
const COLOR_ANIOS = ['#2a78d6', '#eb6834', '#1baf7a']; // año actual, -1, -2
const COLOR_PROCESO = '#2C6337';                       // serie única: verde corporativo
const STATUS = { cumple: '#0ca30c', noCumple: '#d03b3b', sinMeta: '#94a3b8' };
const TINTA = { primaria: '#0f172a', secundaria: '#475569', tenue: '#94a3b8', grid: '#e2e8f0' };

const pct = (num, den) => {
  const n = parseFloat(num), d = parseFloat(den);
  return d ? (n / d) * 100 : null;
};
const promedio = (valores) => {
  const v = valores.filter(x => x !== null && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const fmt = (v) => (v === null || v === undefined ? '—' : `${v.toFixed(1)}%`);

// Tarjeta con título, botón para ver la tabla y el gráfico
function ChartCard({ titulo, subtitulo, icono: Icono, columnas, filas, children, vacio }) {
  const [verTabla, setVerTabla] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Icono size={17} className="text-red-700" /> {titulo}
          </h3>
          {subtitulo && <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>}
        </div>
        {!vacio && (
          <button
            onClick={() => setVerTabla(v => !v)}
            className="text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg px-2.5 py-1 hover:bg-slate-50 flex items-center gap-1 shrink-0"
          >
            <Table2 size={13} /> {verTabla ? 'Ver gráfica' : 'Ver tabla'}
          </button>
        )}
      </div>

      {vacio ? (
        <p className="text-sm text-slate-400 text-center py-16">No hay cargas registradas para este filtro.</p>
      ) : verTabla ? (
        <div className="overflow-x-auto border rounded-xl max-h-[360px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase sticky top-0">
              <tr>{columnas.map(c => <th key={c} className="p-2">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {filas.map((f, i) => (
                <tr key={i}>{f.map((v, j) => <td key={j} className="p-2 text-slate-700">{v}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-[360px]">{children}</div>
      )}
    </div>
  );
}

// Tooltip con tinta de texto (el color solo va en la muestra)
function TooltipPct({ active, payload, label, titulo }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-bold text-slate-800 mb-1">{titulo ? titulo(payload[0].payload) : label}</p>
      {payload.filter(p => p.value !== null && p.value !== undefined).map(p => (
        <p key={p.dataKey} className="flex items-center gap-2 text-slate-700">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: p.color || p.payload?.color }} />
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

function TooltipCumplimiento({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const Icono = d.estado === 'cumple' ? CheckCircle2 : d.estado === 'noCumple' ? XCircle : MinusCircle;
  const texto = d.estado === 'cumple' ? 'Cumple' : d.estado === 'noCumple' ? 'No cumple' : 'Sin meta definida';
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2 text-xs max-w-xs">
      <p className="font-bold text-slate-800 mb-1">{d.nombre}</p>
      <p className="text-slate-700">Resultado promedio: <strong>{fmt(d.resultado)}</strong></p>
      <p className="text-slate-700">Meta: <strong>{d.meta !== null ? `${d.meta}%` : '—'}</strong></p>
      <p className="flex items-center gap-1 mt-1 font-semibold text-slate-800">
        <Icono size={14} style={{ color: STATUS[d.estado] }} /> {texto}
      </p>
    </div>
  );
}

export default function DashboardView({ currentUser }) {
  const anioActual = new Date().getFullYear();
  const isAdmin = currentUser?.esAdmin === true;
  const misDepartamentos = Array.isArray(currentUser?.departamentos) && currentUser.departamentos.length > 0
    ? currentUser.departamentos
    : [{ id: currentUser?.departamentoId, codigo: currentUser?.codigoDepartamento, nombre: currentUser?.departamentoNombre }];

  const [departamentos, setDepartamentos] = useState(isAdmin ? [] : misDepartamentos);
  const [anio, setAnio] = useState(anioActual);
  const [depto, setDepto] = useState(isAdmin ? 'TODOS' : String(misDepartamentos[0]?.id ?? ''));
  const [indicador, setIndicador] = useState('TODOS');
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('anios');

  // Departamentos disponibles para el admin
  useEffect(() => {
    if (!isAdmin) return;
    api.get('/departments')
      .then(res => setDepartamentos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDepartamentos([]));
  }, [isAdmin]);

  // Cargas de los últimos 3 años (el seleccionado y los 2 anteriores) de todo lo que el usuario puede ver
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const params = { desde: anio - 2, hasta: anio };
        let filas = [];
        if (isAdmin) {
          const res = await api.get('/indicators/dashboard', { params });
          filas = res.data || [];
        } else {
          const respuestas = await Promise.all(
            misDepartamentos.filter(d => d.id).map(d =>
              api.get('/indicators/dashboard', { params: { ...params, idDepartamento: d.id } })
            )
          );
          filas = respuestas.flatMap(r => r.data || []);
        }
        setDatos(filas.map(f => ({ ...f, resultado: pct(f.Numerador, f.Denominador) })));
      } catch (err) {
        console.error('Error al cargar datos de gráficas:', err);
        setDatos([]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, isAdmin]);

  useEffect(() => { setIndicador('TODOS'); }, [depto, anio]);

  // Datos según el departamento elegido
  const datosDepto = useMemo(
    () => (depto === 'TODOS' ? datos : datos.filter(d => String(d.IdDepartamento) === String(depto))),
    [datos, depto]
  );

  // Indicadores disponibles (del año seleccionado)
  const indicadoresAnio = useMemo(() => {
    const mapa = new Map();
    datosDepto.filter(d => d.Anio === anio).forEach(d => {
      if (!mapa.has(d.IdIndicador)) mapa.set(d.IdIndicador, { id: d.IdIndicador, nombre: d.NombreIndicador, meta: d.Meta });
    });
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [datosDepto, anio]);

  const datosFiltrados = useMemo(
    () => (indicador === 'TODOS' ? datosDepto : datosDepto.filter(d => String(d.IdIndicador) === String(indicador))),
    [datosDepto, indicador]
  );

  // 1) Resultado por mes: año seleccionado vs 2 anteriores
  const anios = [anio, anio - 1, anio - 2];
  const serieMensual = useMemo(() => MESES.map((m, i) => {
    const fila = { mes: m };
    anios.forEach(a => {
      fila[a] = promedio(datosFiltrados.filter(d => d.Anio === a && d.Mes === i + 1).map(d => d.resultado));
    });
    return fila;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [datosFiltrados, anio]);
  const aniosConDatos = anios.filter(a => serieMensual.some(f => f[a] !== null));
  const metaSeleccionada = indicador !== 'TODOS'
    ? indicadoresAnio.find(i => String(i.id) === String(indicador))?.meta ?? null
    : null;

  // 2) Resultado promedio por proceso (año seleccionado)
  const porProceso = useMemo(() => {
    const mapa = new Map();
    datos.filter(d => d.Anio === anio).forEach(d => {
      const k = d.IdDepartamento;
      if (!mapa.has(k)) mapa.set(k, { codigo: d.CodigoDepartamento || '—', nombre: d.NombreDepartamento || '', valores: [] });
      mapa.get(k).valores.push(d.resultado);
    });
    return [...mapa.values()]
      .map(p => ({ ...p, resultado: promedio(p.valores) }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [datos, anio]);

  // 3) Cumplimiento: promedio anual de cada indicador vs su meta
  const cumplimiento = useMemo(() => {
    const mapa = new Map();
    datosDepto.filter(d => d.Anio === anio).forEach(d => {
      if (!mapa.has(d.IdIndicador)) {
        mapa.set(d.IdIndicador, {
          nombre: d.NombreIndicador, depto: d.CodigoDepartamento,
          meta: d.Meta !== null && d.Meta !== undefined ? Number(d.Meta) : null, valores: []
        });
      }
      mapa.get(d.IdIndicador).valores.push(d.resultado);
    });
    return [...mapa.values()].map(i => {
      const resultado = promedio(i.valores);
      const estado = i.meta === null ? 'sinMeta' : resultado >= i.meta ? 'cumple' : 'noCumple';
      const corto = i.nombre.length > 46 ? `${i.nombre.slice(0, 44)}…` : i.nombre;
      return { ...i, resultado, estado, corto: depto === 'TODOS' ? `${i.depto} · ${corto}` : corto };
    }).sort((a, b) => (b.resultado ?? 0) - (a.resultado ?? 0));
  }, [datosDepto, anio, depto]);

  const totalCumple = cumplimiento.filter(c => c.estado === 'cumple').length;
  const totalNoCumple = cumplimiento.filter(c => c.estado === 'noCumple').length;
  const totalSinMeta = cumplimiento.filter(c => c.estado === 'sinMeta').length;
  const conMeta = totalCumple + totalNoCumple;
  const promedioAnio = promedio(datosFiltrados.filter(d => d.Anio === anio).map(d => d.resultado));

  const opcionesAnio = Array.from({ length: 6 }, (_, i) => anioActual - i);
  const opcionesDepto = isAdmin ? departamentos : misDepartamentos;

  return (
    <div className="space-y-5 text-left">
      {/* Encabezado y filtros en una fila */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xl font-extrabold text-slate-800 uppercase flex items-center gap-2">
          <BarChart3 size={20} className="text-red-700" /> Gráficas de Indicadores
        </h2>
        <p className="text-sm text-slate-500 mb-4">Resultados calculados a partir de la carga mensual de indicadores (numerador / denominador).</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Año</label>
            <select value={anio} onChange={e => setAnio(Number(e.target.value))}
              className="w-full border border-slate-300 bg-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20">
              {opcionesAnio.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Departamento / Proceso</label>
            <select value={depto} onChange={e => setDepto(e.target.value)} disabled={!isAdmin && opcionesDepto.length <= 1}
              className="w-full border border-slate-300 bg-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 disabled:bg-slate-50">
              {isAdmin && <option value="TODOS">Todos los departamentos</option>}
              {opcionesDepto.map(d => {
                const id = d.id ?? d.IdDepartamento;
                return <option key={id} value={id}>{d.codigo || d.Codigo} - {d.nombre || d.Nombre}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Indicador / Objetivo</label>
            <select value={indicador} onChange={e => setIndicador(e.target.value)}
              className="w-full border border-slate-300 bg-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20">
              <option value="TODOS">Todos (promedio)</option>
              {indicadoresAnio.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">Cargando gráficas...</div>
      ) : (
        <>
          {/* Indicadores clave */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs font-bold text-slate-500 uppercase">Resultado promedio {anio}</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{fmt(promedioAnio)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <CheckCircle2 size={14} style={{ color: STATUS.cumple }} /> Cumplen la meta
              </p>
              <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{totalCumple}<span className="text-base font-semibold text-slate-400"> / {conMeta}</span></p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <XCircle size={14} style={{ color: STATUS.noCumple }} /> No cumplen
              </p>
              <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{totalNoCumple}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs font-bold text-slate-500 uppercase">% de cumplimiento</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{conMeta ? `${Math.round((totalCumple / conMeta) * 100)}%` : '—'}</p>
              {totalSinMeta > 0 && <p className="text-[11px] text-slate-400 mt-1">{totalSinMeta} indicador(es) sin meta definida</p>}
            </div>
          </div>

          {/* Pestañas: una gráfica a la vez */}
          <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-2xl p-1.5">
            {[
              { id: 'anios', label: 'Año actual vs anteriores', icono: TrendingUp },
              { id: 'proceso', label: 'Resultados por proceso', icono: BarChart3 },
              { id: 'cumplimiento', label: 'Cumplimiento de objetivos', icono: Target }
            ].map(t => {
              const Icono = t.icono;
              const activa = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                    activa ? 'bg-red-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icono size={16} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* 1) Año actual vs anteriores */}
          {tab === 'anios' && (
          <ChartCard
            titulo={`Resultados por mes: ${anio} vs años anteriores`}
            subtitulo={indicador === 'TODOS' ? 'Promedio de los indicadores del filtro' : indicadoresAnio.find(i => String(i.id) === String(indicador))?.nombre}
            icono={TrendingUp}
            vacio={aniosConDatos.length === 0}
            columnas={['Mes', ...anios.map(String)]}
            filas={serieMensual.map(f => [f.mes, ...anios.map(a => fmt(f[a]))])}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serieMensual} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={TINTA.grid} vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: TINTA.secundaria, fontSize: 12 }} axisLine={{ stroke: TINTA.grid }} tickLine={false} />
                <YAxis unit="%" tick={{ fill: TINTA.secundaria, fontSize: 12 }} axisLine={false} tickLine={false} width={48} tickCount={7} allowDecimals={false}
                  domain={[(min) => Math.max(0, Math.floor((Math.min(min, metaSeleccionada ?? min) - 5) / 10) * 10),
                           (max) => Math.ceil((Math.max(max, metaSeleccionada ?? max) + 2) / 10) * 10]} />
                <Tooltip content={<TooltipPct />} cursor={{ stroke: TINTA.tenue, strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: TINTA.secundaria }} />
                {metaSeleccionada !== null && (
                  <ReferenceLine y={Number(metaSeleccionada)} stroke={TINTA.secundaria} strokeDasharray="5 4"
                    label={{ value: `Meta ${metaSeleccionada}%`, position: 'insideTopRight', fill: TINTA.secundaria, fontSize: 11 }} />
                )}
                {anios.map((a, i) => (
                  <Line key={a} type="monotone" dataKey={a} name={String(a)} stroke={COLOR_ANIOS[i]}
                    strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          )}

            {/* 2) Por proceso */}
            {tab === 'proceso' && (
            <ChartCard
              titulo={`Resultado promedio por proceso (${anio})`}
              subtitulo="Promedio de todos los indicadores cargados de cada departamento"
              icono={BarChart3}
              vacio={porProceso.length === 0}
              columnas={['Proceso', 'Departamento', 'Resultado']}
              filas={porProceso.map(p => [p.codigo, p.nombre, fmt(p.resultado)])}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porProceso} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={TINTA.grid} vertical={false} />
                  <XAxis dataKey="codigo" tick={{ fill: TINTA.secundaria, fontSize: 12 }} axisLine={{ stroke: TINTA.grid }} tickLine={false} />
                  <YAxis unit="%" tick={{ fill: TINTA.secundaria, fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<TooltipPct titulo={(p) => `${p.codigo} - ${p.nombre}`} />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="resultado" name="Resultado" fill={COLOR_PROCESO} radius={[4, 4, 0, 0]} maxBarSize={36}>
                    <LabelList dataKey="resultado" position="top" formatter={(v) => (v === null ? '' : `${Math.round(v)}%`)}
                      style={{ fill: TINTA.secundaria, fontSize: 11 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            )}

            {/* 3) Cumplimiento de objetivos */}
            {tab === 'cumplimiento' && (
            <ChartCard
              titulo={`Cumplimiento de objetivos (${anio})`}
              subtitulo="Resultado promedio anual de cada indicador comparado con su meta"
              icono={Target}
              vacio={cumplimiento.length === 0}
              columnas={['Indicador', 'Resultado', 'Meta', 'Estado']}
              filas={cumplimiento.map(c => [
                c.nombre, fmt(c.resultado), c.meta !== null ? `${c.meta}%` : '—',
                c.estado === 'cumple' ? '✔ Cumple' : c.estado === 'noCumple' ? '✖ No cumple' : 'Sin meta'
              ])}
            >
              <div className="h-full flex flex-col">
                <div className="flex flex-wrap gap-3 text-xs text-slate-600 mb-2">
                  <span className="flex items-center gap-1"><CheckCircle2 size={13} style={{ color: STATUS.cumple }} /> Cumple</span>
                  <span className="flex items-center gap-1"><XCircle size={13} style={{ color: STATUS.noCumple }} /> No cumple</span>
                  <span className="flex items-center gap-1"><MinusCircle size={13} style={{ color: STATUS.sinMeta }} /> Sin meta</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div style={{ height: Math.max(260, cumplimiento.length * 34) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cumplimiento} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={TINTA.grid} horizontal={false} />
                        <XAxis type="number" unit="%" tick={{ fill: TINTA.secundaria, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="corto" width={360} interval={0} tick={{ fill: TINTA.primaria, fontSize: 11, width: 400 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TooltipCumplimiento />} cursor={{ fill: '#f1f5f9' }} />
                        <Bar dataKey="resultado" radius={[0, 4, 4, 0]} maxBarSize={18}>
                          {cumplimiento.map((c, i) => <Cell key={i} fill={STATUS[c.estado]} />)}
                          <LabelList dataKey="resultado" position="right" formatter={(v) => (v === null ? '' : `${Math.round(v)}%`)}
                            style={{ fill: TINTA.secundaria, fontSize: 11 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </ChartCard>
            )}
        </>
      )}
    </div>
  );
}