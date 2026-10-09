import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, Trash2, Eye, ArrowLeft, Building2 } from 'lucide-react';
import api, { API_BASE } from '../services/api';
import DocumentUpload from '../modules/documents/DocumentUpload';

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

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments');
        const deptList = res.data || [];
        setDepartments(deptList);
        
        if (!user?.esAdmin && deptList.length > 0) {
          const userDeptId = user?.departamentoId || user?.idDepartamento || user?.DepartamentoId;
          const matched = deptList.find(d => Number(d.id) === Number(userDeptId) || d.codigo === user?.deptCode);
          if (matched) {
            setSelectedDept(matched.id);
          }
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
      if (!selectedDept || isNaN(selectedDept)) return;

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
  }, [selectedDept]);

  const currentDeptObj = departments.find(d => Number(d.id) === Number(selectedDept));
  const currentDeptCode = currentDeptObj ? currentDeptObj.codigo : (user?.deptCode || 'SGD');

  // Filtrado libre sin bloqueos de formato de código
  const filteredDocuments = documents.filter(doc => {
    const codigoDoc = (doc.codigo || doc.CodigoDocumento || '').toString().toUpperCase().trim();
    const nombreDoc = (doc.nombre || doc.Titulo || '').toString().toLowerCase();
    
    // Si el documento tiene sección asignada, se usa esa; si no (documentos viejos), se deduce por el prefijo del código
    const seccionDoc = doc.SeccionLateral || doc.seccionLateral || null;
    const seccionActual = sectionType === 'documentos-externos' ? 'externos' : sectionType;

    let matchesSection = true;

    if (seccionDoc) {
      matchesSection = seccionDoc === seccionActual;
    } else if (seccionActual === 'caracterizacion') {
      matchesSection = codigoDoc.startsWith('CP');
    } else if (seccionActual === 'formularios') {
      matchesSection = codigoDoc.startsWith('FO');
    } else if (seccionActual === 'documentos') {
      matchesSection = /^(PR|IT|PG|PL|TB)/.test(codigoDoc);
    } else {
      // Listas Maestras y Documentos Externos solo muestran documentos con la sección asignada
      matchesSection = false;
    }

    const matchesSearch = 
      codigoDoc.includes(searchTerm.toUpperCase()) ||
      nombreDoc.includes(searchTerm.toLowerCase());
      
    return matchesSection && matchesSearch;
  });

  const handleOpenDoc = (doc) => {
    const rutaBD = doc.RutaArchivo || doc.rutaArchivo || '';
    let rutaLimpia = rutaBD.replace(/\\/g, '/');
    if (rutaLimpia.startsWith('uploads/')) {
        rutaLimpia = rutaLimpia.replace('uploads/', '');
    }
    window.open(`${API_BASE}/uploads/${rutaLimpia}`, '_blank');
  };

  const handleDeleteDoc = async (id) => {
    if (window.confirm('¿Eliminar este documento permanentemente?')) {
      try {
        await api.delete(`/documents/${id}`);
        setDocuments(prev => prev.filter(doc => (doc.id || doc.IdDocumento) !== id));
      } catch (err) {
        alert('Error al eliminar');
      }
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
          defaultDept={selectedDept} 
          deptCode={currentDeptCode} 
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
                onChange={(e) => setSelectedDept(Number(e.target.value))} 
                className="bg-transparent text-xs font-bold text-red-700 focus:outline-none cursor-pointer"
              >
                {departments.map(d => <option key={d.id} value={d.id}>{d.codigo} - {d.nombre}</option>)}
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
              <th className="p-3">Nombre</th>
              <th className="p-3 text-center">Rev</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs">
            {loading ? <tr><td colSpan="4" className="text-center p-4">Cargando...</td></tr> : 
             filteredDocuments.length === 0 ? <tr><td colSpan="4" className="text-center p-4">Sin documentos en esta sección.</td></tr> :
             filteredDocuments.map(doc => {
               const id = doc.id || doc.IdDocumento;
               return (
                <tr key={id} className="hover:bg-red-50">
                  <td className="p-3 font-bold">{doc.codigo || doc.CodigoDocumento || 'S/C'}</td>
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
    </div>
  );
}