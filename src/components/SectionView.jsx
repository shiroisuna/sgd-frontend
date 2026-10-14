import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, Trash2, Eye, ArrowLeft, Building2 } from 'lucide-react';
import api, { API_BASE } from '../services/api';
import DocumentUpload from '../modules/documents/DocumentUpload';
import Swal from 'sweetalert2';

export default function SectionView({ title, department: initialDept, sectionType, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState(() => {
    const userDept = initialDept || user?.departamentoId || user?.idDepartamento || user?.DepartamentoId;
    return userDept && !isNaN(userDept) ? Number(userDept) : 1;
  });
  
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Recargar la lista cuando DocumentUpload avisa que se subió un documento
  useEffect(() => {
    const onSubido = () => setRefreshKey(k => k + 1);
    window.addEventListener('documentoSubido', onSubido);
    return () => window.removeEventListener('documentoSubido', onSubido);
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments');
        const deptList = res.data || [];
        setDepartments(deptList);
        
        // Usuario normal: solo puede ver sus departamentos (principal + adicionales)
        if (!user?.esAdmin && deptList.length > 0) {
          const principalId = user?.departamentoId || user?.idDepartamento || user?.DepartamentoId;
          const permitidos = (user?.departamentos || []).map(d => Number(d.id));
          setSelectedDept(prev =>
            permitidos.includes(Number(prev)) ? Number(prev) : Number(principalId) || prev
          );
        }
      } catch (err) {
        const defaultList = [
          { id: 1, codigo: 'SGD', nombre: 'Sistemas / General' },
          { id: 2, codigo: 'HI', nombre: 'Higiene e Inocuidad' },
          { id: 3, codigo: 'MT', nombre: 'Mantenimiento' },
          { id: 4, codigo: 'RH', nombre: 'Recursos Humanos' },
          { id: 5, codigo: 'GC', nombre: 'Gestión de la Calidad' }
        ];
        setDepartments(defaultList);
      }
    };
    fetchDepartments();
  }, [user]);

  useEffect(() => {
    const fetchDocuments = async () => {
      // 'TODOS' = todos los departamentos (solo admin)
      if (!selectedDept || (selectedDept !== 'TODOS' && isNaN(selectedDept))) return;

      setLoading(true);
      try {
        const deptParam = selectedDept === 'SGC' ? 1 : selectedDept;
        const res = await api.get('/documents', {
          params: { dept: deptParam }
        });
        setDocuments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error al cargar documentos:', err);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [selectedDept, refreshKey]);

  const verTodos = selectedDept === 'TODOS';

  // Departamentos que puede elegir un usuario normal (si maneja más de uno)
  const misDepartamentos = Array.isArray(user?.departamentos) ? user.departamentos : [];
  const currentDeptObj = departments.find(d => Number(d.id) === Number(selectedDept));
  const currentDeptCode = currentDeptObj ? currentDeptObj.codigo : (user?.deptCode || 'SGD');

  // Al subir con "Todos" seleccionado, se usa el departamento del usuario
  const userDeptId = user?.departamentoId || user?.idDepartamento || user?.DepartamentoId;
  const userDeptObj = departments.find(d => Number(d.id) === Number(userDeptId));
  const uploadDept = verTodos ? userDeptId : selectedDept;
  const uploadDeptCode = verTodos ? (userDeptObj?.codigo || user?.codigoDepartamento || 'SGD') : currentDeptCode;

  // Filtrado libre sin bloqueos de formato de código
  const filteredDocuments = documents.filter(doc => {
    const codigoDoc = (doc.codigo || doc.CodigoDocumento || '').toString().toUpperCase().trim();
    const nombreDoc = (doc.nombre || doc.Titulo || '').toString().toLowerCase();
    
    // La sección se decide por la categoría del documento (CodigoCategoria viene del JOIN en el backend).
    // Si el documento no tiene categoría, se usa el prefijo del código.
    const SECCION_POR_CATEGORIA = {
      CP: 'caracterizacion',
      FO: 'formularios',
      PR: 'documentos', IT: 'documentos', PG: 'documentos', PL: 'documentos', TB: 'documentos',
      LM: 'listas-maestras',
      EX: 'externos'
    };
    const codigoCat = (doc.CodigoCategoria || codigoDoc.substring(0, 2)).toUpperCase();
    const seccionDoc = SECCION_POR_CATEGORIA[codigoCat] || null;
    const seccionActual = sectionType === 'documentos-externos' ? 'externos' : sectionType;

    const matchesSection = seccionDoc === seccionActual;

    const matchesSearch = 
      codigoDoc.includes(searchTerm.toUpperCase()) ||
      nombreDoc.includes(searchTerm.toLowerCase());
      
    return matchesSection && matchesSearch;
  });

  // Paginación: 10 documentos por página
  const DOCS_POR_PAGINA = 10;
  const [pagina, setPagina] = useState(1);

  // Volver a la página 1 al buscar o cambiar de departamento/sección
  useEffect(() => {
    setPagina(1);
  }, [searchTerm, selectedDept, sectionType]);

  const totalPaginas = Math.max(1, Math.ceil(filteredDocuments.length / DOCS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas); // por si se elimina el último de una página
  const inicio = (paginaActual - 1) * DOCS_POR_PAGINA;
  const documentosPagina = filteredDocuments.slice(inicio, inicio + DOCS_POR_PAGINA);

  const handleOpenDoc = (doc) => {
    const rutaBD = doc.RutaArchivo || doc.rutaArchivo || '';
    let rutaLimpia = rutaBD.replace(/\\/g, '/');
    if (rutaLimpia.startsWith('uploads/')) {
        rutaLimpia = rutaLimpia.replace('uploads/', '');
    }
    window.open(`${API_BASE}/uploads/${rutaLimpia}`, '_blank');
  };

  const handleDeleteDoc = async (id) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro que desea eliminar este documento?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
      focusCancel: true
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(doc => (doc.id || doc.IdDocumento) !== id));
      Swal.fire({
        title: 'Documento eliminado',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        title: 'No se pudo eliminar',
        text: err.response?.data?.error || 'Ocurrió un error al eliminar el documento.',
        icon: 'error',
        confirmButtonColor: '#2C6337'
      });
    }
  };

  if (isUploading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <button onClick={() => setIsUploading(false)} className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-6">
          <ArrowLeft size={16} /> Volver
        </button>
        <DocumentUpload 
          user={user} 
          defaultDept={uploadDept} 
          deptCode={uploadDeptCode} 
          defaultSection={sectionType} 
          departments={departments}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-slate-800 uppercase">{title}</h2>
          
          <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-xl">
            <Building2 size={15} className="text-red-700" />
            {user?.esAdmin ? (
              <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))} 
                className="bg-transparent text-xs font-bold text-red-700 focus:outline-none cursor-pointer"
              >
                <option value="TODOS">TODOS - Todos los departamentos</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.codigo} - {d.nombre}</option>)}
              </select>
            ) : misDepartamentos.length > 1 ? (
              <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(Number(e.target.value))} 
                className="bg-transparent text-xs font-bold text-red-700 focus:outline-none cursor-pointer"
              >
                {misDepartamentos.map(d => <option key={d.id} value={d.id}>{d.codigo} - {d.nombre}</option>)}
              </select>
            ) : (
              <span className="text-xs font-bold text-red-700">
                {currentDeptCode} - {currentDeptObj ? currentDeptObj.nombre : 'Mi Departamento'}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsUploading(true)} className="px-4 py-2 bg-red-700 text-white rounded-xl text-xs font-bold">
            <Upload size={15} className="inline mr-2" /> Subir
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-white text-xs uppercase">
            <tr>
              <th className="p-3">Código</th>
              {verTodos && <th className="p-3">Dpto</th>}
              <th className="p-3">Nombre</th>
              <th className="p-3 text-center">Rev</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs">
            {loading ? <tr><td colSpan={verTodos ? 5 : 4} className="text-center p-4">Cargando...</td></tr> : 
             filteredDocuments.length === 0 ? <tr><td colSpan={verTodos ? 5 : 4} className="text-center p-4">Sin documentos en esta sección.</td></tr> :
             documentosPagina.map(doc => {
               const id = doc.id || doc.IdDocumento;
               return (
                <tr key={id} className="hover:bg-red-50">
                  <td className="p-3 font-bold">{doc.codigo || doc.CodigoDocumento || 'S/C'}</td>
                  {verTodos && <td className="p-3 font-semibold text-slate-500">{doc.CodigoDepartamento || '—'}</td>}
                  <td className="p-3 flex items-center gap-2"><FileText size={15} className="text-red-600"/> {doc.nombre || doc.Titulo}</td>
                  <td className="p-3 text-center">{doc.rev || doc.Version || '0'}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleOpenDoc(doc)} className="mr-2 text-slate-600 hover:text-red-700"><Eye size={15}/></button>
                    <button onClick={() => handleDeleteDoc(id)} className="text-slate-600 hover:text-red-700"><Trash2 size={15}/></button>
                  </td>
                </tr>
               )
             })}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación */}
      {!loading && filteredDocuments.length > DOCS_POR_PAGINA && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-xs text-slate-500">
          <span>
            Mostrando {inicio + 1}–{Math.min(inicio + DOCS_POR_PAGINA, filteredDocuments.length)} de {filteredDocuments.length} documentos
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ‹ Anterior
            </button>

            {Array.from({ length: totalPaginas }, (_, n) => n + 1).map((n) => (
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
        </div>
      )}
    </div>
  );
}