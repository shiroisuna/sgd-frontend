import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const mesesList = [
  { id: 1, nombre: 'ENERO' },
  { id: 2, nombre: 'FEBRERO' },
  { id: 3, nombre: 'MARZO' },
  { id: 4, nombre: 'ABRIL' },
  { id: 5, nombre: 'MAYO' },
  { id: 6, nombre: 'JUNIO' },
  { id: 7, nombre: 'JULIO' },
  { id: 8, nombre: 'AGOSTO' },
  { id: 9, nombre: 'SEPTIEMBRE' },
  { id: 10, nombre: 'OCTUBRE' },
  { id: 11, nombre: 'NOVIEMBRE' },
  { id: 12, nombre: 'DICIEMBRE' },
];

export default function IndicatorsView({ selectedDept, currentUser }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const isAdmin = currentUser?.esAdmin === true;

  // Lista de departamentos para el selector del admin
  const [departments, setDepartments] = useState([]);

  // Opciones del selector: el admin ve todos; un usuario con varios departamentos ve solo los suyos
  const misDepartamentos = Array.isArray(currentUser?.departamentos) ? currentUser.departamentos : [];
  const opcionesDepto = isAdmin ? departments : misDepartamentos;
  const mostrarSelectorDepto = isAdmin ? departments.length > 0 : misDepartamentos.length > 1;

  // Departamento activo controlado por estado para permitir cambios dinámicos del Admin
  const [deptId, setDeptId] = useState(
    selectedDept || currentUser?.idDepartamento || currentUser?.IdDepartamento || 1
  );

  // Estados de control del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados de configuración y carga
  const [indicadores, setIndicadores] = useState([]);
  const [anioCarga, setAnioCarga] = useState(currentYear);
  const [mesCarga, setMesCarga] = useState(currentMonth);
  const [selectedIndicador, setSelectedIndicador] = useState('');
  const [numerador, setNumerador] = useState('');
  const [denominador, setDenominador] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Control para el input cuando seleccionan "Agregar nuevo..."
  const [mostrarInputNuevo, setMostrarInputNuevo] = useState(false);
  const [nuevoIndicadorNombre, setNuevoIndicadorNombre] = useState('');

  // Estados de búsqueda / historial inferior (Anual)
  const [anioFiltro, setAnioFiltro] = useState(currentYear);
  const [mesFiltro, setMesFiltro] = useState(currentMonth);
  const [registros, setRegistros] = useState([]);

  // Paginación de la tabla de registros
  const REGISTROS_POR_PAGINA = 5;
  const [pagina, setPagina] = useState(1);

  // Estado para el Tooltip interactivo de las observaciones en la tabla
  const [activeTooltipId, setActiveTooltipId] = useState(null);
  const tooltipRef = useRef(null);

  // Cargar lista de departamentos si es Administrador
  useEffect(() => {
    if (isAdmin) {
      const fetchDepartments = async () => {
        try {
          const res = await api.get('/departments');
          setDepartments(res.data || []);
        } catch (err) {
          console.error('Error al cargar departamentos:', err);
        }
      };
      fetchDepartments();
    }
  }, [isAdmin]);

  // Sincronizar el año del modal con el año que se está filtrando visualmente
  useEffect(() => {
    setAnioCarga(anioFiltro);
  }, [anioFiltro]);

  // Al cambiar los registros (filtro, nueva carga) se vuelve a la primera página
  useEffect(() => {
    setPagina(1);
    setActiveTooltipId(null);
  }, [registros]);

  const totalPaginas = Math.max(1, Math.ceil(registros.length / REGISTROS_POR_PAGINA));
  const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  const registrosPagina = registros.slice(inicio, inicio + REGISTROS_POR_PAGINA);

  const irAPagina = (nueva) => {
    setPagina(Math.min(Math.max(1, nueva), totalPaginas));
    setActiveTooltipId(null);
  };

  // Cerrar tooltip al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setActiveTooltipId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar indicadores filtrados por departamento Y AÑO
  const cargarIndicadores = async (anioConsulta = anioFiltro, mantenerSeleccion = null) => {
   if (!deptId || !anioConsulta) return;
    try {
      const res = await api.get(`/indicators/department/${deptId}`, {
        params: { anio: anioConsulta }
      });
      const dataArray = Array.isArray(res.data) ? res.data : [];
      setIndicadores(dataArray);

      if (mantenerSeleccion) {
        setSelectedIndicador(mantenerSeleccion);
      } else if (dataArray.length > 0) {
        setSelectedIndicador(dataArray[0].IdIndicador);
      } else {
        setSelectedIndicador('');
      }
    } catch (err) {
      console.error('Error al cargar indicadores:', err);
      setIndicadores([]);
      setSelectedIndicador('');
    }
  };

  // Se recargan los objetivos si cambia el departamento o el año de filtro
  useEffect(() => {
    cargarIndicadores(anioFiltro);
  }, [deptId, anioFiltro]);

  // Cada vez que cambies el año en el formulario del modal, se buscan los indicadores de ese año
  useEffect(() => {
    if (isModalOpen) {
      cargarIndicadores(anioCarga);
    }
  }, [anioCarga, isModalOpen]);

  // Consultar historial al cambiar de departamento, año o mes de filtro
  useEffect(() => {
    const handleSearchRecords = async () => {
      if (!deptId) return;
      try {
        const res = await api.get('/indicators/records', {
          params: {
            idDepartamento: deptId,
            anio: anioFiltro,
            mes: mesFiltro
          }
        });
        setRegistros(res.data || []);
      } catch (err) {
        console.error('Error al buscar registros:', err);
        setRegistros([]);
      }
    };
    handleSearchRecords();
  }, [deptId, anioFiltro, mesFiltro]);

  const handleSelectChange = (e) => {
    const value = e.target.value;
    if (value === '__NUEVO__') {
      setMostrarInputNuevo(true);
      setSelectedIndicador('__NUEVO__');
    } else {
      setMostrarInputNuevo(false);
      setSelectedIndicador(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numerador === '' || denominador === '') {
      alert('Debe ingresar tanto el numerador como el denominador.');
      return;
    }

    if (Number(denominador) === 0) {
      alert('El denominador no puede ser cero (evita división por cero).');
      return;
    }

    if (!selectedIndicador || selectedIndicador === '__NUEVO__') {
      alert('Debe seleccionar o registrar un indicador válido.');
      return;
    }

    try {
      await api.post('/indicators/load', {
        idIndicador: parseInt(selectedIndicador),
        anio: parseInt(anioCarga),
        mes: parseInt(mesCarga),
        numerador: parseFloat(numerador),
        denominador: parseFloat(denominador),
        observaciones,
        idUsuario: currentUser?.id || currentUser?.IdUsuario || 2
      });

      alert('Indicador guardado / actualizado exitosamente.');
      setNumerador('');
      setDenominador('');
      setObservaciones('');
      setIsModalOpen(false);

      setAnioFiltro(anioCarga);
      setMesFiltro(mesCarga);
      
      const res = await api.get('/indicators/records', {
        params: { idDepartamento: deptId, anio: anioCarga, mes: mesCarga }
      });
      setRegistros(res.data || []);

    } catch (err) {
      console.error('Error al guardar indicador:', err);
      alert('Ocurrió un error al procesar el indicador.');
    }
  };

  const handleGuardarNuevoIndicador = async () => {
    if (!nuevoIndicadorNombre.trim()) {
      alert("Por favor, escribe el nombre del indicador");
      return;
    }

    try {
      const response = await api.post('/indicators/config', {
        nombre: nuevoIndicadorNombre,
        idDepartamento: parseInt(deptId),
        anio: parseInt(anioCarga) // Enviamos el año para que el objetivo sea anual
      });

      alert("¡Indicador guardado con éxito!");
      const nuevoId = response.data?.data?.IdIndicador || response.data?.IdIndicador || response.data?.id || null;
      
      setNuevoIndicadorNombre("");
      setMostrarInputNuevo(false);
      await cargarIndicadores(nuevoId);

    } catch (error) {
      console.error("Error al guardar el indicador:", error);
      alert("Hubo un error al guardar el indicador");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestión de Indicadores de Procesos</h2>
          <p className="text-sm text-slate-500">Control y registro mensual de metas del departamento (ID: {deptId}).</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de Departamento exclusivo para Administradores */}
          {mostrarSelectorDepto && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl">
              <span className="text-xs font-bold text-slate-600 uppercase">Dpto:</span>
              <select 
                value={deptId} 
                onChange={(e) => setDeptId(Number(e.target.value))}
                className="bg-transparent text-slate-800 text-sm font-semibold focus:outline-none cursor-pointer"
              >
                {opcionesDepto.map(d => {
                  const id = d.id ?? d.IdDepartamento;
                  return (
                    <option key={id} value={id}>
                      {d.nombre || d.Nombre} ({d.codigo || d.Codigo})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              setMostrarInputNuevo(false);
              setNuevoIndicadorNombre('');
              setIsModalOpen(true);
            }}
            className="bg-red-900 hover:bg-red-800 text-white font-medium px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>➕</span> Cargar Indicadores
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-700 mb-3 text-base">Historial y Consultas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Año</label>
            <input 
              type="number" 
              value={anioFiltro} 
              onChange={(e) => setAnioFiltro(e.target.value)}
              className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mes a Visualizar</label>
            <select 
              value={mesFiltro} 
              onChange={(e) => setMesFiltro(e.target.value)}
              className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
            >
              <option value="TODOS">TODOS LOS MESES</option>
              {mesesList.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de registros */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 pb-20">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
                <th className="p-3 font-semibold">Indicador</th>
                <th className="p-3 font-semibold text-center">Mes / Año</th>
                <th className="p-3 font-semibold text-center">Numerador</th>
                <th className="p-3 font-semibold text-center">Denominador</th>
                <th className="p-3 font-semibold text-center">Resultado (%)</th>
                <th className="p-3 font-semibold">Observaciones</th>
                <th className="p-3 font-semibold text-center">Registrado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-600" ref={tooltipRef}>
              {registros.length > 0 ? (
                registrosPagina.map((r, i) => {
                  const idx = inicio + i; // índice global (para la key y el tooltip)
                  const mesNombre = mesesList.find(m => m.id === r.Mes)?.nombre || r.Mes;
                  
                  // Cálculo del porcentaje (Resultado)
                  const num = parseFloat(r.Numerador) || 0;
                  const den = parseFloat(r.Denominador) || 0;
                  const porcentaje = den !== 0 ? ((num / den) * 100).toFixed(2) : '0.00';
                  const isTooltipOpen = activeTooltipId === idx;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition relative">
                      {/* Objetivo completo */}
                      <td className="p-3 font-medium text-slate-800 min-w-[280px] max-w-md whitespace-normal leading-snug">
                        {r.NombreIndicador}
                      </td>
                      <td className="p-3 text-center">{mesNombre} - {r.Anio}</td>
                      <td className="p-3 text-center font-semibold text-slate-700">{r.Numerador}</td>
                      <td className="p-3 text-center font-semibold text-slate-700">{r.Denominador}</td>
                      <td className="p-3 text-center font-bold text-red-900">{porcentaje}%</td>
                      {/* Observaciones: tooltip solo si hay texto */}
                      <td className="p-3 text-slate-500">
                        {r.Observaciones && r.Observaciones.trim() ? (
                          <div className="inline-block relative">
                            <button
                              onClick={() => setActiveTooltipId(isTooltipOpen ? null : idx)}
                              className="text-red-900 hover:text-red-700 font-bold underline decoration-dotted underline-offset-4 cursor-pointer flex items-center gap-1 bg-red-50 hover:bg-red-100/60 px-2.5 py-1 rounded-md transition"
                            >
                              <span>💬 Ver</span>
                              <span className="text-xs">▾</span>
                            </button>

                            {/* Tooltip alineado a la derecha para no salirse de la tabla */}
                            {isTooltipOpen && (
                              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-2xl z-50 animate-fadeIn border border-slate-700">
                                <div className="font-semibold text-red-300 mb-1 border-b border-slate-700 pb-1 flex justify-between items-center">
                                  <span>Observaciones</span>
                                  <button 
                                    onClick={() => setActiveTooltipId(null)}
                                    className="text-slate-400 hover:text-white px-1 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <p className="leading-relaxed text-slate-200 whitespace-pre-line">{r.Observaciones}</p>
                                <div className="absolute right-6 bottom-full w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-slate-900"></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin observaciones</span>
                        )}
                      </td>
                      <td className="p-3 text-center text-xs text-slate-500">{r.RegistradoPorNombre || 'Admin'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-slate-400">
                    No hay registros cargados para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de paginación */}
        {registros.length > REGISTROS_POR_PAGINA && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-xs text-slate-500">
            <span>
              Mostrando {inicio + 1}–{Math.min(inicio + REGISTROS_POR_PAGINA, registros.length)} de {registros.length} registros
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => irAPagina(pagina - 1)}
                disabled={pagina === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ‹ Anterior
              </button>

              {Array.from({ length: totalPaginas }, (_, n) => n + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => irAPagina(n)}
                  className={`w-8 h-8 rounded-lg font-bold transition ${
                    n === pagina
                      ? 'bg-red-900 text-white shadow-sm'
                      : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                onClick={() => irAPagina(pagina + 1)}
                disabled={pagina === totalPaginas}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Siguiente ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA CARGAR INDICADORES */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">Cargar / Registrar Indicador</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Año</label>
                  <input 
                    type="number" 
                    value={anioCarga} 
                    onChange={(e) => setAnioCarga(e.target.value)}
                    className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mes</label>
                  <select 
                    value={mesCarga} 
                    onChange={(e) => setMesCarga(e.target.value)}
                    className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                  >
                    {mesesList.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Indicador / Objetivo
                </label>
                <select 
                  value={selectedIndicador} 
                  onChange={handleSelectChange}
                  className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 mb-2"
                >
                  {indicadores.length === 0 ? (
                    <option value="" disabled>No hay indicadores configurados para el año {anioCarga}</option>
                  ) : (
                    <option value="" disabled>Seleccione un indicador existente...</option>
                  )}

                  {indicadores.map(ind => (
                    <option key={ind.IdIndicador} value={ind.IdIndicador}>
                      {ind.NombreIndicador}
                    </option>
                  ))}

                  <option value="__NUEVO__" className="font-bold text-red-900">
                    ➕ [ Registrar nuevo indicador para el año {anioCarga}... ]
                  </option>
                </select>

                {mostrarInputNuevo && (
                  <div className="border border-slate-300 bg-slate-50 p-3 rounded-lg space-y-2 animate-fadeIn">
                    <span className="text-xs text-slate-600 font-bold block">
                      Escribe el nombre del nuevo indicador / objetivo anual ({anioCarga}):
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={255}
                        value={nuevoIndicadorNombre}
                        onChange={(e) => setNuevoIndicadorNombre(e.target.value)}
                        placeholder="Nombre del nuevo objetivo..."
                        className="border border-slate-300 bg-white p-2 rounded-lg w-full text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                      />
                      <button
                        type="button"
                        onClick={handleGuardarNuevoIndicador}
                        className="bg-red-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-red-800 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Numerador (Real)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={numerador} 
                    onChange={(e) => setNumerador(e.target.value)}
                    placeholder="Ej. Valor real"
                    className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Denominador (Teórico)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={denominador} 
                    onChange={(e) => setDenominador(e.target.value)}
                    placeholder="Ej. Valor teórico"
                    className="border border-slate-300 bg-white p-2.5 rounded-lg w-full text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Observaciones</label>
                <textarea 
                  value={observaciones} 
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="border border-slate-300 bg-white p-2.5 rounded-lg w-full h-24 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                  placeholder="Escriba sus observaciones o notas adicionales..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-xl bg-red-900 hover:bg-red-800 text-white font-medium text-sm transition shadow-sm cursor-pointer"
                >
                  Guardar Carga
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}