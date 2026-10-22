import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, LogOut, Home, BarChart2, Folder, Settings, User as UserIcon, BookOpen } from 'lucide-react';
import api, { API_BASE } from '../services/api';
import Logo from './Logo';

export default function Navbar({ user, onLogout, setActiveView, onOpenUserModal }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isControlCalidadOpen, setIsControlCalidadOpen] = useState(false);
  const [menuData, setMenuData] = useState({ categorias: [], documentosSuperiores: [] }); 
  const dropdownRef = useRef(null);

  const isAdmin = user?.esAdmin === true;

  // Cargar la estructura del menú y documentos superiores desde la base de datos al montar el componente
  useEffect(() => {
    const fetchMenuStructure = async () => {
      try {
        const response = await api.get('/documents/menu-structure');
        if (response.data) {
          setMenuData({
            categorias: response.data.categorias || response.data || [],
            documentosSuperiores: response.data.documentosSuperiores || []
          });
        }
      } catch (err) {
        console.error("Error al cargar la estructura del menú:", err);
      }
    };

    fetchMenuStructure();
    window.addEventListener('documentoSubido', fetchMenuStructure);
    return () => window.removeEventListener('documentoSubido', fetchMenuStructure);
  }, []);

  // Cerrar menús al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setIsControlCalidadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (menu) => {
    if (activeDropdown === menu) {
      setActiveDropdown(null);
      setIsControlCalidadOpen(false);
    } else {
      setActiveDropdown(menu);
      setIsControlCalidadOpen(false);
    }
  };

  // Norma ISO9001: abre directo el documento más reciente cargado en esa sección
  const handleOpenNormaIso = () => {
    setActiveDropdown(null);
    setIsControlCalidadOpen(false);
    const [norma] = getDocsByMenuSection('norma-iso');
    if (!norma?.rutaArchivo) {
      alert('La Norma ISO9001 aún no ha sido cargada en el sistema.');
      return;
    }
    const ruta = norma.rutaArchivo.replace(/\\/g, '/').replace(/^uploads\//, '');
    window.open(`${API_BASE}/uploads/${ruta}`, '_blank');
  };

  const handleOpenDocument = async (tituloDocumento) => {
    try {
      setActiveDropdown(null);
      setIsControlCalidadOpen(false);
      const response = await api.get(`/documents/view/${encodeURIComponent(tituloDocumento)}`);
      
      if (response.data && response.data.url) {
        const baseURL = API_BASE;
        window.open(`${baseURL}${response.data.url}`, '_blank');
      }
    } catch (err) {
      alert(`El documento "${tituloDocumento}" aún no ha sido cargado o registrado en el sistema.`);
      console.error(err);
    }
  };

  const getDocsByCategory = (categoryId) => {
    if (!Array.isArray(menuData.categorias)) return [];
    const category = menuData.categorias.find(cat => cat.id === categoryId || cat.nombre?.toLowerCase() === categoryId?.toLowerCase());
    return category ? category.documentos : [];
  };

  const getDocsByMenuSection = (sectionKey) => {
    if (!Array.isArray(menuData.documentosSuperiores)) return [];
    return menuData.documentosSuperiores.filter(doc => doc.menuSeccion === sectionKey);
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="w-full px-4 flex justify-between items-center gap-2 h-16" ref={dropdownRef}>
        
        {/* Logo / Título del Sistema y Departamento Dinámico */}
        <div className="flex items-center gap-3 shrink-0">
            {/* <span className="font-extrabold text-xl text-red-800 tracking-wider">SGD-Pola</span> */}
            <Logo />
          {/* Usuario logueado (el departamento se ve al pasar el mouse) */}
          <span
            className="bg-red-50 text-red-700 text-[11px] 2xl:text-xs px-2 py-1 rounded-md font-semibold border border-red-200 flex items-center gap-1 max-w-[150px] 2xl:max-w-[200px] shrink-0"
            title={`Usuario: ${user?.nombreCompleto || user?.username || 'Usuario'} · Dpto: ${user?.codigoDepartamento || user?.departamentoCodigo || 'N/A'}`}
          >
            <UserIcon size={13} className="shrink-0" />
            <span className="truncate">{user?.nombreCompleto || user?.username || 'Usuario'}</span>
          </span>
        </div>

        {/* Menú de Navegación Principal Dinámico */}
        <nav className="hidden xl:flex items-center 2xl:gap-1">
          <button 
            onClick={() => { setActiveView('inicio'); setActiveDropdown(null); setIsControlCalidadOpen(false); }}
            className="px-1.5 2xl:px-2.5 py-2 rounded-lg text-[11px] 2xl:text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1 whitespace-nowrap"
          >
            <Home size={15} /> Inicio
          </button>
          <button 
            onClick={handleOpenNormaIso}
            className="px-1.5 2xl:px-2.5 py-2 rounded-lg text-[11px] 2xl:text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1 whitespace-nowrap"
          >
            <BookOpen size={15} /> Norma ISO9001
          </button>
          {[
            { key: 'docPpal', label: 'Doc. Principales', cat: 'Documentos Principales' },
            { key: 'procedimientos', label: 'Procedimientos', cat: 'Procedimientos' },
            { key: 'instrucciones', label: 'Instrucciones', cat: 'Instrucciones' },
            { key: 'formularios', label: 'Formularios', cat: 'Formularios' },
            { key: 'tablas', label: 'Tablas', cat: 'Tablas' },
            { key: 'documentos-publicos', label: 'Doc. Públicos', cat: 'Documentos Públicos' }
          ].map((menuItem) => {
            const docsSuperiores = getDocsByMenuSection(menuItem.key);
            const documentosDeCat = getDocsByCategory(menuItem.cat);
            const totalDocumentos = [...docsSuperiores, ...documentosDeCat];

            return (
              <div className="relative" key={menuItem.key}>
                <button 
                  onClick={() => toggleDropdown(menuItem.key)}
                  className="px-1.5 2xl:px-2.5 py-2 rounded-lg text-[11px] 2xl:text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1 whitespace-nowrap"
                >
                  {menuItem.label} <ChevronDown size={13} />
                </button>

                {activeDropdown === menuItem.key && (
                  <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 shadow-lg rounded-xl py-2 z-50 max-h-96 overflow-y-auto">
                    {/* Lista Maestra: abre la vista con todos los documentos */}
                    {menuItem.key === 'documentos-publicos' && (
                      <button
                        onClick={() => { setActiveView('lista-maestra'); setActiveDropdown(null); }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 border-b border-slate-100 mb-1"
                      >
                        Lista Maestra
                      </button>
                    )}
                    {menuItem.key === 'documentos-publicos' && (
                      <button
                        onClick={() => { setActiveView('lista-externos'); setActiveDropdown(null); }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 border-b border-slate-100 mb-1"
                      >
                        Lista de Documentos Externos
                      </button>
                    )}

                    {totalDocumentos.length > 0 ? (
                      totalDocumentos.map((doc, idx) => {
                        const docTitle = doc.nombreMenuOpci || doc.titulo || doc.nombre;
                        return (
                          <button 
                            key={idx}
                            onClick={() => handleOpenDocument(docTitle)} 
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-red-50 hover:text-red-700"
                          >
                            {docTitle}
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-4 py-2 text-xs text-slate-400 italic">No hay documentos registrados.</p>
                    )}

                    {menuItem.key === 'documentos-publicos' && (
                      <div>
                        <button 
                          onClick={() => setIsControlCalidadOpen(!isControlCalidadOpen)}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-red-50 hover:text-red-700 flex justify-between items-center transition-colors border-t border-slate-100 mt-1"
                        >
                          Control de Calidad 
                          {isControlCalidadOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {isControlCalidadOpen && (
                          <div className="bg-slate-50/75 py-1 border-y border-slate-100 flex flex-col space-y-0.5">
                            {(() => {

                              
                              const ccDocs = [
                                              ...getDocsByMenuSection('control-calidad'),
                                              ...getDocsByCategory('Control de Calidad')
                                            ];
                              return ccDocs.length > 0 ? (
                                ccDocs.map((ccDoc, ccIdx) => {
                                  const ccTitulo = ccDoc.nombreMenuOpci || ccDoc.titulo || ccDoc.nombre;
                                  return (
                                    <button 
                                      key={ccIdx}
                                      onClick={() => handleOpenDocument(ccTitulo)} 
                                      className="w-full text-left px-4 py-1.5 pl-7 text-xs text-slate-600 hover:bg-red-100/60 hover:text-red-700"
                                    >
                                      {ccTitulo}
                                    </button>
                                  );
                                })
                              ) : (
                                <p className="px-4 py-1.5 pl-7 text-xs text-slate-400 italic">No hay documentos.</p>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="relative">
            <button 
              onClick={() => toggleDropdown('administrar')}
              className="px-1.5 2xl:px-2.5 py-2 rounded-lg text-[11px] 2xl:text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1 whitespace-nowrap bg-slate-50 border border-slate-200"
            >
              <Settings size={14} /> Administrar <ChevronDown size={13} />
            </button>
            {activeDropdown === 'administrar' && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 shadow-lg rounded-xl py-2 z-50">
                <button 
                  onClick={() => { setActiveView('indicadores'); setActiveDropdown(null); }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
                >
                  <BarChart2 size={15} /> Módulo de Indicadores
                </button>
                <button 
                  onClick={() => { setActiveView('documentos'); setActiveDropdown(null); }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
                >
                  <Folder size={15} /> Gestión Documental
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => {
                      setActiveView('users');
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>👥</span> Gestión de Usuarios
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Sección de Datos del Usuario Logueado y Salida */}
        <div className="flex items-center gap-2 shrink-0">
          {/* <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
            <div className="bg-slate-100 p-2 rounded-full text-slate-700">
              <UserIcon size={16} />
            </div>
            <div className="text-left hidden sm:block">
              {/* <p className="text-xs font-bold text-slate-800">
                {user?.nombreCompleto || user?.username || 'Usuario'}
              </p> */}
              {/* <p className="text-[10px] text-slate-500 font-medium">
                {isAdmin ? 'Administrador' : (user?.nombreDepartamento || 'Operativo')}
              </p>
            </div>
          </div> */} 

          <button 
            onClick={onLogout}
            className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
            title="Salir del Sistema"
          >
            <LogOut size={18} />
          </button>
        </div>

      </div>
    </header>
  );
}