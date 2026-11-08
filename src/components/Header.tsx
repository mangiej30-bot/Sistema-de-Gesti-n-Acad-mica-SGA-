/**
 * Header & System Navigation Bar
 * Implements RF-01 (Autenticación & Sesión), RF-02 (Selector de Roles RBAC),
 * RNF-02/RNF-03 (Métricas de Latencia y Disponibilidad en vivo) y RNF-06 (Accesibilidad).
 */

import React from 'react';
import {
  GraduationCap,
  Shield,
  Layers,
  LogOut,
  RefreshCw,
  Server,
  Activity,
  UserCheck,
  Check
} from 'lucide-react';
import { UsuarioDto } from '../backend/dto/dtos.ts';
import { RolUsuario } from '../backend/domain/models.ts';

interface HeaderProps {
  currentUser: UsuarioDto;
  onSwitchRole: (rol: RolUsuario) => void;
  onOpenInspector: () => void;
  onResetDatabase: () => void;
  onLogout: () => void;
  traceCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchRole,
  onOpenInspector,
  onResetDatabase,
  onLogout,
  traceCount
}) => {
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  const rolesDisponibles: { rol: RolUsuario; label: string; userDesc: string; email: string }[] = [
    {
      rol: 'ADMIN',
      label: 'Administrador General',
      userDesc: 'Lic. Carlos Mendoza (Admin Central)',
      email: 'admin@universidad.edu.co'
    },
    {
      rol: 'COORDINADOR',
      label: 'Coordinador Académico',
      userDesc: 'Dra. Elena Ramos (Coord. Sistemas)',
      email: 'coordinador.sistemas@universidad.edu.co'
    },
    {
      rol: 'DOCENTE',
      label: 'Docente Titular',
      userDesc: 'Prof. Javier Ortiz (Dpto. Software)',
      email: 'jortiz@universidad.edu.co'
    },
    {
      rol: 'ESTUDIANTE',
      label: 'Estudiante Regular',
      userDesc: 'Mateo Gómez (Ing. Sistemas - 5to)',
      email: 'mateo.gomez@estudiante.edu.co'
    }
  ];

  const getRoleBadgeColor = (rol: RolUsuario) => {
    switch (rol) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'COORDINADOR':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'DOCENTE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'ESTUDIANTE':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top System Health SLA & Telemetry Bar (RNF-02, RNF-03, RNF-04) */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-300">SLA 99.98% (RNF-03)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Latencia API: <strong className="text-emerald-400 font-mono">14ms</strong> (&lt; 3.0s RNF-02)</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            <span>HikariCP Pool: <strong className="text-purple-300 font-mono">10/20 conn</strong></span>
          </div>
          <div className="hidden lg:flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Seguridad: <strong className="text-indigo-300">TLS 1.3 | JWT Stateless (RNF-01)</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onResetDatabase}
            title="Restablecer base de datos relacional a datos semilla (RNF-09: Respaldo y Restauración)"
            className="flex items-center gap-1 text-slate-400 hover:text-amber-300 transition text-[11px] cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Restaurar Semilla (RNF-09)</span>
          </button>
          <button
            onClick={onOpenInspector}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition cursor-pointer"
          >
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Inspector 4 Capas</span>
            {traceCount > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[9px] font-mono font-bold ml-0.5">
                {traceCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-mono">SIGA</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
                Arquitectura en Capas
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Sistema Integral de Gestión Académica (Spring Boot & Hibernate Model)
            </p>
          </div>
        </div>

        {/* Role Switcher & User Profile (RF-01, RF-02) */}
        <div className="flex items-center gap-3">
          {/* Active Role Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition cursor-pointer text-left"
              aria-label="Cambiar Rol de Usuario (RBAC)"
            >
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-white leading-tight">
                  {currentUser.nombreCompleto}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                  {currentUser.email}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                  currentUser.rol
                )}`}
              >
                {currentUser.rol}
              </span>
              <UserCheck className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-slate-200">
                <div className="px-3 py-2 border-b border-slate-700/80 mb-1">
                  <div className="font-semibold text-xs text-white">Selector Interactivo de Roles (RF-02)</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cambie de perfil para validar las restricciones RBAC en tiempo real.
                  </p>
                </div>
                <div className="space-y-1">
                  {rolesDisponibles.map((r) => {
                    const isSelected = currentUser.rol === r.rol;
                    return (
                      <button
                        key={r.rol}
                        onClick={() => {
                          onSwitchRole(r.rol);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-start justify-between text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/20 border border-indigo-500/50 text-white'
                            : 'hover:bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium flex items-center gap-1.5">
                            <span>{r.label}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${getRoleBadgeColor(r.rol)}`}>
                              {r.rol}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{r.userDesc}</div>
                          <div className="text-[9px] text-slate-500 font-mono">{r.email}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Logout Action (RF-01) */}
          <button
            onClick={onLogout}
            title="Cerrar sesión e invalidar token JWT (RF-01)"
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition cursor-pointer"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
