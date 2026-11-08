/**
 * SIGA - Sistema Integral de Gestión Académica
 * Root Application Component implementing the 4-Layer Architecture
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
  FileSpreadsheet,
  ShieldAlert,
  Award,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { api, LayerTrace, DEFAULT_ADMIN_USER, generateJwtToken } from './services/api.ts';
import { UsuarioDto } from './backend/dto/dtos.ts';
import { RolUsuario } from './backend/domain/models.ts';

// Components
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { EstudiantesView } from './components/EstudiantesView.tsx';
import { DocentesView } from './components/DocentesView.tsx';
import { CurricularView } from './components/CurricularView.tsx';
import { ProgramacionView } from './components/ProgramacionView.tsx';
import { MatriculasView } from './components/MatriculasView.tsx';
import { CalificacionesView } from './components/CalificacionesView.tsx';
import { ReportesView } from './components/ReportesView.tsx';
import { AuditoriaView } from './components/AuditoriaView.tsx';
import { ArquitecturaTrazabilidadView } from './components/ArquitecturaTrazabilidadView.tsx';
import { LayerInspectorDrawer } from './components/LayerInspectorDrawer.tsx';
import { LoginModal } from './components/LoginModal.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UsuarioDto | null>(() => {
    return api.getCurrentUser() || DEFAULT_ADMIN_USER;
  });

  const [activeModule, setActiveModule] = useState<string>('inicio');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [traces, setTraces] = useState<LayerTrace[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Ensure default valid JWT token is set if not already
    if (!api.getToken() && currentUser) {
      api.setSession(generateJwtToken(currentUser), currentUser);
    }

    const unsub = api.subscribeTraces((updatedTraces) => {
      setTraces([...updatedTraces]);
    });
    return unsub;
  }, []);

  const handleSwitchRole = async (rol: RolUsuario) => {
    // Switch between seeded users for RBAC verification (RF-02)
    let email = 'admin@universidad.edu.co';
    if (rol === 'COORDINADOR') email = 'coordinador.sistemas@universidad.edu.co';
    if (rol === 'DOCENTE') email = 'jortiz@universidad.edu.co';
    if (rol === 'ESTUDIANTE') email = 'mateo.gomez@estudiante.edu.co';

    try {
      const res = await api.login(email, '123456');
      setCurrentUser(res.usuario);
      // If student or docente, adapt active view if on restricted module
      if (rol === 'ESTUDIANTE' && (activeModule === 'docentes' || activeModule === 'estudiantes' || activeModule === 'reportes' || activeModule === 'auditoria')) {
        setActiveModule('matriculas');
      } else if (rol === 'DOCENTE' && (activeModule === 'docentes' || activeModule === 'reportes' || activeModule === 'auditoria')) {
        setActiveModule('calificaciones');
      }
    } catch (err) {
      console.error('Error switching role:', err);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: UsuarioDto) => {
    setCurrentUser(user);
    setActiveModule('inicio');
  };

  const handleResetDatabase = async () => {
    await api.resetDatos();
    window.location.reload();
  };

  if (!currentUser) {
    return <LoginModal onSuccess={handleLoginSuccess} />;
  }

  // Navigation Items with RBAC visibility rules (RF-02)
  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: LayoutDashboard, roles: ['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE'] },
    { id: 'estudiantes', label: 'Estudiantes', icon: Users, roles: ['ADMIN', 'COORDINADOR', 'DOCENTE'] },
    { id: 'docentes', label: 'Docentes', icon: GraduationCap, roles: ['ADMIN', 'COORDINADOR'] },
    { id: 'curricular', label: 'Curricular', icon: BookOpen, roles: ['ADMIN', 'COORDINADOR', 'DOCENTE'] },
    { id: 'programacion', label: 'Programación', icon: Calendar, roles: ['ADMIN', 'COORDINADOR', 'DOCENTE'] },
    { id: 'matriculas', label: 'Matrículas', icon: Award, roles: ['ADMIN', 'COORDINADOR', 'ESTUDIANTE'] },
    { id: 'calificaciones', label: 'Calificaciones', icon: CheckCircle2, roles: ['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE'] },
    { id: 'reportes', label: 'Reportes', icon: FileSpreadsheet, roles: ['ADMIN', 'COORDINADOR'] },
    { id: 'auditoria', label: 'Auditoría', icon: ShieldAlert, roles: ['ADMIN', 'COORDINADOR'] },
    { id: 'arquitectura', label: 'Arquitectura & Trazabilidad', icon: Layers, roles: ['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(currentUser.rol));

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onResetDatabase={handleResetDatabase}
        onLogout={handleLogout}
        traceCount={traces.length}
      />

      {/* Secondary Sub-Navbar (Desktop & Mobile) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-[73px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between sm:justify-start gap-1 overflow-x-auto py-2 scrollbar-none">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:flex items-center gap-1">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Dropdown Nav */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-1.5">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 text-left transition ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeModule === 'inicio' && (
          <DashboardView
            currentUser={currentUser}
            onNavigate={(mod) => setActiveModule(mod)}
          />
        )}
        {activeModule === 'estudiantes' && <EstudiantesView />}
        {activeModule === 'docentes' && <DocentesView />}
        {activeModule === 'curricular' && <CurricularView />}
        {activeModule === 'programacion' && <ProgramacionView currentUser={currentUser} />}
        {activeModule === 'matriculas' && <MatriculasView currentUser={currentUser} />}
        {activeModule === 'calificaciones' && <CalificacionesView currentUser={currentUser} />}
        {activeModule === 'reportes' && <ReportesView />}
        {activeModule === 'auditoria' && <AuditoriaView />}
        {activeModule === 'arquitectura' && <ArquitecturaTrazabilidadView />}
      </main>

      {/* Live Layer Call Inspector Drawer (RNF-05, RNF-02) */}
      <LayerInspectorDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        traces={traces}
        onClear={() => setTraces([])}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>SIGA</strong> — Sistema Integral de Gestión Académica • Arquitectura en 4 Capas
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span>Spring Boot 3.x Model</span>
            <span>•</span>
            <span>Hibernate / JPA ACID</span>
            <span>•</span>
            <span>OpenAPI 3.0</span>
            <span>•</span>
            <span>WCAG 2.1 AA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
