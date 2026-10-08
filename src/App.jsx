import React, { useState } from 'react';
import Login from './modules/auth/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SectionView from './components/SectionView';
import DocumentUpload from './modules/documents/DocumentUpload';
import IndicatorsView from './components/IndicatorsView';
import UserModal from './components/UserModal';
import UsersView from './components/UsersView';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('inicio');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Inicializamos con null, se asignará cuando el usuario inicie sesión exitosamente
  const [selectedDept, setSelectedDept] = useState(null);

  const handleLogout = () => {
    setUser(null);
    setSelectedDept(null);
    setActiveView('inicio');
  };

  if (!user) {
    return <Login onLoginSuccess={(response) => {
      // Tu backend devuelve la estructura con la propiedad 'usuario'
      const userData = response.usuario || response;

      setUser(userData);

      // Capturamos el ID correcto del departamento acorde al JSON actual de tu API
      const userDeptId = userData.departamentoId 
                      || userData.id 
                      || userData.idDepartamento 
                      || userData.IdDepartamento;

      if (userDeptId) {
        setSelectedDept(Number(userDeptId)); // Tomará el 2 correctamente para Higiene
      } else {
        setSelectedDept(1); // Valor por defecto si no viene especificado
      }
    }} />;
  }

  const deptName = user.departamentoNombre || user.departamentoCodigo || 'Departamento General';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Barra de navegación superior */}
      <Navbar 
      user={user} onLogout={handleLogout} 
      setActiveView={setActiveView} 
      onOpenUserModal={() => setIsUserModalOpen(true)}
      />

      {/* Contenedor principal con Sidebar y Panel de Trabajo */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentView={activeView} 
          setCurrentView={setActiveView} 
          user={user} 
          selectedDept={selectedDept}
          setSelectedDept={setSelectedDept}
        />
      
        {/* Área de Contenido Dinámico */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
            {activeView === 'inicio' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Sistema Control de Documentos - SGC</h2>
                <p className="text-slate-600">Industrias Amapola | Departamento: <span className="font-semibold text-red-700">{deptName}</span></p>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div 
                    onClick={() => setActiveView('documentos')}
                    className="p-5 bg-slate-50 hover:bg-red-50/30 border border-slate-200 hover:border-red-200 rounded-xl cursor-pointer transition"
                  >
                    <h3 className="font-bold text-slate-800 mb-1">📁 Gestión Documental</h3>
                    <p className="text-sm text-slate-500">Sube caracterizaciones, procedimientos y formularios en formato PDF directo al servidor físico.</p>
                  </div>
                  <div 
                    onClick={() => setActiveView('indicadores')}
                    className="p-5 bg-slate-50 hover:bg-red-50/30 border border-slate-200 hover:border-red-200 rounded-xl cursor-pointer transition"
                  >
                    <h3 className="font-bold text-slate-800 mb-1">📊 Indicadores de Procesos</h3>
                    <p className="text-sm text-slate-500">Registra y controla los numeradores y denominadores mensuales de tu departamento.</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-1">🔒 Servidor Local</h3>
                    <p className="text-sm text-slate-500">Conectado de forma segura a la infraestructura de oficina (192.168.10.112).</p>
                  </div>
                </div>
              </div>
            )}

            {/* Vistas controladas */}
            {activeView === 'caracterizacion' && (
              <SectionView title="Caracterización de Procesos" department={selectedDept} sectionType="caracterizacion" user={user} />
            )}

            {activeView === 'documentos' && (
              <SectionView title="Gestión de Documentos" department={selectedDept} sectionType="documentos" user={user} />
            )}

            {activeView === 'formularios' && (
              <SectionView title="Gestión de Formularios" department={selectedDept} sectionType="formularios" user={user} />
            )}

            {activeView === 'documentos-externos' && (
              <SectionView title="Documentos Externos" department={selectedDept} sectionType="externos" user={user} />
            )}

            {activeView === 'indicadores' && (
              <IndicatorsView selectedDept={selectedDept} currentUser={user} />
            )}

            {activeView === 'users' && (
              <UsersView currentUser={user} />
            )}

          </div>
        </main>
      </div>
      {/* Modal global de Gestión de Usuarios */}
      <UserModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        currentUser={user} 
      />
    </div>
  );
}