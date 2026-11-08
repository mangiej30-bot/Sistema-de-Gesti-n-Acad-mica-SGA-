/**
 * Main Academic Dashboard View
 * Provides high-level KPIs, role-tailored shortcuts, and architectural overview.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  FileCheck2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../services/api.ts';
import { UsuarioDto, ReporteConsolidadoDto } from '../backend/dto/dtos.ts';

interface DashboardViewProps {
  currentUser: UsuarioDto;
  onNavigate: (module: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onNavigate }) => {
  const [stats, setStats] = useState<ReporteConsolidadoDto | null>(null);

  useEffect(() => {
    api.getReporteConsolidado()
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Arquitectura en 4 Capas • Spring Boot & React SPA</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Bienvenido al Sistema Integral de Gestión Académica (SIGA)
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Plataforma universitaria con control de acceso basado en roles (RBAC), gestión curricular, matrícula transaccional bajo aislamiento ACID, algoritmo de prevención de cruces y trazabilidad completa de requerimientos.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('arquitectura')}
              className="px-4 py-2 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-slate-100 transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Ver Matriz de Trazabilidad (RNF-10)</span>
            </button>
            <button
              onClick={() => onNavigate('matriculas')}
              className="px-4 py-2 rounded-xl bg-indigo-600/60 hover:bg-indigo-600/80 text-white font-semibold text-xs border border-indigo-400/40 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Simular Matrícula Transaccional (RF-07)</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative background shape */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('estudiantes')}
            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-slate-400">Estudiantes Activos</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.totalEstudiantesActivos}
            </div>
            <span className="text-[11px] text-slate-400">CRUD & Borrado Lógico (RF-03)</span>
          </div>

          <div
            onClick={() => onNavigate('docentes')}
            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-400 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-slate-400">Docentes Titulares</span>
              <GraduationCap className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.totalDocentesActivos}
            </div>
            <span className="text-[11px] text-slate-400">Cuerpo docente (RF-04)</span>
          </div>

          <div
            onClick={() => onNavigate('programacion')}
            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-purple-400 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-slate-400">Grupos Abiertos</span>
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.totalGruposAbiertos}
            </div>
            <span className="text-[11px] text-slate-400">Sin cruces de aula (RF-06)</span>
          </div>

          <div
            onClick={() => onNavigate('matriculas')}
            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-sky-400 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-slate-400">Matrículas Confirmadas</span>
              <BookOpen className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.totalMatriculasActivas}
            </div>
            <span className="text-[11px] text-slate-400">Aislamiento ACID (RF-07)</span>
          </div>
        </div>
      )}

      {/* Role-tailored Action Hub */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Acciones Rápidas para el Rol: <span className="text-indigo-600 dark:text-indigo-400">{currentUser.rol}</span>
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Control de Acceso Basado en Roles (RF-02)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentUser.rol === 'ADMIN' && (
            <>
              <button
                onClick={() => onNavigate('estudiantes')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Administrar Estudiantes
                  </div>
                  <div className="text-[11px] text-slate-400">Registrar, actualizar o borrado lógico</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('docentes')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Administrar Docentes
                  </div>
                  <div className="text-[11px] text-slate-400">Asignar a departamentos y contratos</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('auditoria')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Bitácora de Auditoría
                  </div>
                  <div className="text-[11px] text-slate-400">Revisar eventos inmutables (RF-12)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>
            </>
          )}

          {currentUser.rol === 'COORDINADOR' && (
            <>
              <button
                onClick={() => onNavigate('programacion')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Apertura de Grupos & Cruces
                  </div>
                  <div className="text-[11px] text-slate-400">Validar cruces de docente y aula (RF-06)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('programacion')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Ventana de Calificaciones
                  </div>
                  <div className="text-[11px] text-slate-400">Habilitar o cerrar ingreso de notas</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('reportes')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Reportes Institucionales
                  </div>
                  <div className="text-[11px] text-slate-400">Filtrar por facultad y exportar a CSV</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>
            </>
          )}

          {currentUser.rol === 'DOCENTE' && (
            <>
              <button
                onClick={() => onNavigate('calificaciones')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Asentar Calificaciones
                  </div>
                  <div className="text-[11px] text-slate-400">Cortes 1, 2 y 3 (30%, 35%, 35%) (RF-08)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('programacion')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Mis Grupos & Horarios
                  </div>
                  <div className="text-[11px] text-slate-400">Consultar asignación de aulas físicas</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>
            </>
          )}

          {currentUser.rol === 'ESTUDIANTE' && (
            <>
              <button
                onClick={() => onNavigate('matriculas')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Matrícula Académica en Línea
                  </div>
                  <div className="text-[11px] text-slate-400">Verificar cupos y matricular materias (RF-07)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('calificaciones')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Mi Kardex & Calificaciones
                  </div>
                  <div className="text-[11px] text-slate-400">Consultar notas parciales y promedio (RF-09)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>
            </>
          )}

          <button
            onClick={() => onNavigate('arquitectura')}
            className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left transition flex items-center justify-between group cursor-pointer"
          >
            <div>
              <div className="font-semibold text-xs text-indigo-900 dark:text-indigo-300">
                Matriz de Trazabilidad RNF-10
              </div>
              <div className="text-[11px] text-slate-500">Mapeo de requerimientos RF-01..12 y RNF-01..12</div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </div>
    </div>
  );
};
