import React, { useState, useEffect, useRef } from 'react';
import api, { API_BASE } from '../../services/api';
import { Upload, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

// Secciones del menú lateral (deben coincidir con los ids de Sidebar.jsx / sectionType de SectionView)
export const SECCIONES_LATERALES = [
  { id: 'caracterizacion', nombre: 'Caracterización' },
  { id: 'formularios', nombre: 'Formularios' },
  { id: 'listas-maestras', nombre: 'Listas Maestras' },
  { id: 'documentos', nombre: 'Documentos' },
  { id: 'externos', nombre: 'Documentos Externos' }
];

const normalizarSeccion = (valor) => {
  if (valor === 'documentos-externos') return 'externos';
  return SECCIONES_LATERALES.some(s => s.id === valor) ? valor : 'documentos';
};

export default function DocumentUpload({ user, defaultDept, deptCode, defaultSection, departments = [] }) {
  const [step, setStep] = useState(1);
  const fileInputRef = useRef(null);
  
  const getInitialDept = () => {
    if (defaultDept && !isNaN(defaultDept)) return Number(defaultDept);
    const userDept = user?.departamentoId || user?.idDepartamento || user?.DepartamentoId;
    if (userDept && !isNaN(userDept)) return Number(userDept);
    return 1;
  };

  const getInitialDeptCode = () => {
    if (deptCode) return deptCode;
    if (defaultDept && departments.length > 0) {
      const found = departments.find(d => Number(d.id) === Number(defaultDept));
      if (found) return found.codigo;
    }
    return user?.deptCode || 'SGD';
  };

  const [formData, setFormData] = useState({
    titulo: '',
    codigoDocumento: '', // Libre, sin restricciones de coincidencia
    rev: '0', // <-- Nuevo campo inicial para la revisión
    tipoAlcance: 'departamento', 
    idDepartamento: getInitialDept(),
    deptCode: getInitialDeptCode(),
    seccionLateral: normalizarSeccion(defaultSection),
    tipoDestino: 'categoria', 
    menuSeccion: 'docPpal',
    nombreMenuOpci: '',
    archivoPdf: null
  });
  
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    const validDept = defaultDept && !isNaN(defaultDept) ? Number(defaultDept) : formData.idDepartamento;
    
    let validCode = deptCode;
    if (!validCode && departments.length > 0) {
      const found = departments.find(d => Number(d.id) === validDept);
      if (found) validCode = found.codigo;
    }

    setFormData(prev => ({ 
      ...prev, 
      idDepartamento: validDept,
      deptCode: validCode || prev.deptCode,
      seccionLateral: normalizarSeccion(defaultSection)
    }));
  }, [defaultDept, deptCode, defaultSection, departments]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, archivoPdf: file }));
      setMensaje(null);
    } else {
      alert('Por favor, seleccione un archivo en formato PDF.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.archivoPdf) {
      setMensaje({ tipo: 'error', texto: 'No se ha adjuntado ningún archivo PDF.' });
      return;
    }

    setLoading(true);
    setMensaje(null);

    const data = new FormData();
    data.append('titulo', formData.titulo);
    data.append('codigoDocumento', formData.codigoDocumento || '');
    data.append('rev', formData.rev || '0'); // <-- Se envía el campo de revisión al backend
    data.append('idDepartamento', formData.idDepartamento);
    data.append('deptCode', formData.deptCode);
    data.append('tipoDestino', formData.tipoDestino);
    data.append('esMenuSuperior', formData.tipoDestino === 'menuSuperior' ? 'true' : 'false');
    data.append('seccionLateral', formData.tipoDestino === 'categoria' ? formData.seccionLateral : '');
    data.append('menuSeccion', formData.tipoDestino === 'menuSuperior' ? formData.menuSeccion : '');
    data.append('nombreMenuOpci', formData.tipoDestino === 'menuSuperior' ? (formData.nombreMenuOpci || formData.titulo) : '');
    data.append('idUsuario', user?.id || user?.IdUsuario || 1);
    data.append('archivoPdf', formData.archivoPdf);

    try {
      await api.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      window.dispatchEvent(new Event('documentoSubido'));
      setMensaje({ tipo: 'success', texto: '¡Documento subido y registrado exitosamente!' });
      
      setTimeout(() => setMensaje(null), 5000);

      setStep(1);
      setFormData(prev => ({
        ...prev,
        titulo: '',
        codigoDocumento: '',
        rev: '0',
        nombreMenuOpci: '',
        archivoPdf: null
      }));

      if (fileInputRef.current) fileInputRef.current.value = ""; 

    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'Error al procesar la subida del archivo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-8">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Carga de Documentos</h2>
          <p className="text-sm text-slate-500">Industrias Amapola C.A. - Depto: {formData.deptCode}</p>
        </div>
        <span className="bg-red-50 text-red-700 text-xs px-3 py-1 rounded-full font-bold border border-red-200">
          Paso {step} de 3
        </span>
      </div>

      {mensaje && (
        <div className={`p-4 mb-6 rounded-xl text-sm flex items-center gap-2 ${mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-slate-700">1. Datos del Documento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Código del Documento 
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: FO-HI-001"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.codigoDocumento}
                  onChange={(e) => setFormData({ ...formData, codigoDocumento: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Revisión (Rev) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: 0, 1, A"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.rev}
                  onChange={(e) => setFormData({ ...formData, rev: e.target.value })}
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título Descriptivo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Documento General"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="button"
                onClick={() => {
                  if(!formData.titulo) {
                    alert('Debe indicar al menos el título descriptivo.');
                    return;
                  }
                  if(!formData.rev) {
                    alert('Debe indicar el número o código de revisión (Rev).');
                    return;
                  }
                  setStep(2);
                }}
                className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition"
              >
                Siguiente <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-slate-700">2. Destino del Documento</h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                value={formData.tipoDestino}
                onChange={(e) => setFormData({ ...formData, tipoDestino: e.target.value })}
              >
                <option value="categoria">Categoría Interna (Menú Lateral)</option>
                <option value="menuSuperior">Menú Superior Horizontal</option>
              </select>
            </div>

            {formData.tipoDestino === 'categoria' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seleccione la Sección</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.seccionLateral}
                  onChange={(e) => setFormData({ ...formData, seccionLateral: e.target.value })}
                >
                  {SECCIONES_LATERALES.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.tipoDestino === 'menuSuperior' && (
              <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sección</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                    value={formData.menuSeccion}
                    onChange={(e) => setFormData({ ...formData, menuSeccion: e.target.value })}
                  >
                    <option value="docPpal">Doc. Principales</option>
                    <option value="procedimientos">Procedimientos</option>
                    <option value="instrucciones">Instrucciones</option>
                    <option value="formularios">Formularios</option>
                    <option value="tablas">Tablas</option>
                    <option value="documentos-publicos">Doc. Públicos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre en el Menú</label>
                  <input 
                    type="text" 
                    placeholder="Título visible"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                    value={formData.nombreMenuOpci}
                    onChange={(e) => setFormData({ ...formData, nombreMenuOpci: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition"
              >
                <ArrowLeft size={16} /> Anterior
              </button>
              <button 
                type="button"
                onClick={() => setStep(3)}
                className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition"
              >
                Siguiente <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-slate-700">3. Adjuntar Archivo PDF</h3>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 relative">
              <input
                ref={fileInputRef} 
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <div className="bg-red-100 text-red-700 p-3 rounded-full mb-3">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-bold text-slate-700">
                  {formData.archivoPdf ? formData.archivoPdf.name : 'Seleccione o arrastre el archivo PDF'}
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition"
              >
                <ArrowLeft size={16} /> Anterior
              </button>
              <button 
                type="submit"
                disabled={loading || !formData.archivoPdf}
                className="bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white px-8 py-2.5 rounded-lg font-medium shadow-md transition flex items-center gap-2"
              >
                {loading ? 'Guardando...' : 'Cargar al Servidor'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}