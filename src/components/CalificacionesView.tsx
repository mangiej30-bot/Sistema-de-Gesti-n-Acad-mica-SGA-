/**
 * Calificaciones & Kardex View
 * Implements RF-08 (Registro de calificaciones, titularidad de docente y control de calendario por coordinación)
 * and RF-09 (Consulta de resultados, historial académico y notas ponderadas para estudiantes).
 */

import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Save,
  Lock,
  Unlock,
  GraduationCap,
  Calendar,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api.ts';
import {
  UsuarioDto,
  GrupoDetalladoDto,
  CalificacionConsolidadaDto,
  EstudianteDto
} from '../backend/dto/dtos.ts';
import { PeriodoAcademico } from '../backend/domain/models.ts';

interface CalificacionesViewProps {
  currentUser: UsuarioDto;
}

export const CalificacionesView: React.FC<CalificacionesViewProps> = ({ currentUser }) => {
  const [grupos, setGrupos] = useState<GrupoDetalladoDto[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>('');
  const [sabanaNotas, setSabanaNotas] = useState<CalificacionConsolidadaDto[]>([]);

  // Estudiante Kardex state (RF-09)
  const [kardexData, setKardexData] = useState<{
    estudiante: EstudianteDto;
    promedioAcumulado: number;
    totalCreditosAprobados: number;
    asignaturas: any[];
  } | null>(null);

  // Editable grades state
  const [editingNotas, setEditingNotas] = useState<Record<string, { c1: number | ''; c2: number | ''; c3: number | '' }>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab: 'DOCENTE_GRADEBOOK' vs 'ESTUDIANTE_KARDEX'
  const isEstudiante = currentUser.rol === 'ESTUDIANTE';
  const [activeTab, setActiveTab] = useState<'GRADEBOOK' | 'KARDEX'>(
    isEstudiante ? 'KARDEX' : 'GRADEBOOK'
  );

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [gList, pList] = await Promise.all([
        api.getGrupos(),
        api.getPeriodos()
      ]);
      setPeriodos(pList);

      // If user is DOCENTE, filter only assigned groups
      const docenteGrupos = currentUser.rol === 'DOCENTE' && currentUser.perfilId
        ? gList.filter(g => g.docenteId === currentUser.perfilId)
        : gList;

      setGrupos(docenteGrupos);

      // Only load teacher gradebook sheet if user is NOT a student
      if (currentUser.rol !== 'ESTUDIANTE' && docenteGrupos.length > 0) {
        const targetGrupo = selectedGrupoId || docenteGrupos[0].id;
        setSelectedGrupoId(targetGrupo);
        await cargarSabana(targetGrupo);
      }

      // If user is ESTUDIANTE or when viewing student kardex
      const studentId = currentUser.perfilId || (currentUser.email?.includes('sofia') ? 'est-2' : 'est-1');
      if (currentUser.rol === 'ESTUDIANTE' || activeTab === 'KARDEX') {
        try {
          const k = await api.getKardexEstudiante(studentId);
          setKardexData(k);
        } catch (kErr: any) {
          console.warn('Could not load student kardex:', kErr);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando datos de calificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.rol === 'ESTUDIANTE') {
      setActiveTab('KARDEX');
    }
    cargarDatos();
  }, [currentUser]);

  const cargarSabana = async (grupoId: string) => {
    if (currentUser.rol === 'ESTUDIANTE') return;
    try {
      const data = await api.getSabanaNotasGrupo(grupoId);
      setSabanaNotas(data);

      // Initialize edit state
      const initialMap: Record<string, { c1: number | ''; c2: number | ''; c3: number | '' }> = {};
      data.forEach(item => {
        initialMap[item.matriculaId] = {
          c1: item.corte1 !== undefined ? item.corte1 : '',
          c2: item.corte2 !== undefined ? item.corte2 : '',
          c3: item.corte3 !== undefined ? item.corte3 : ''
        };
      });
      setEditingNotas(initialMap);
    } catch (err: any) {
      setError(err.message || 'Error cargando planilla de notas');
    }
  };

  const handleGrupoChange = async (gId: string) => {
    setSelectedGrupoId(gId);
    setError(null);
    setSuccessMsg(null);
    await cargarSabana(gId);
  };

  const handleNotaChange = (matriculaId: string, corte: 'c1' | 'c2' | 'c3', val: string) => {
    const num = val === '' ? '' : parseFloat(val);
    if (typeof num === 'number' && (num < 0 || num > 5.0)) return;

    setEditingNotas(prev => ({
      ...prev,
      [matriculaId]: {
        ...prev[matriculaId],
        [corte]: num
      }
    }));
  };

  const handleGuardarNota = async (matriculaId: string, corte: 1 | 2 | 3, valor: number | '') => {
    if (valor === '' || isNaN(valor)) return;

    const grupoActual = grupos.find(g => g.id === selectedGrupoId);
    if (!grupoActual) return;

    try {
      setSaving(true);
      setError(null);

      // Docente titular ID (or current user's profile ID if teacher)
      const docenteId = currentUser.rol === 'DOCENTE' && currentUser.perfilId
        ? currentUser.perfilId
        : grupoActual.docenteId;

      await api.registrarNota({
        docenteId,
        matriculaId,
        corte,
        nota: valor,
        observaciones: 'Calificación asentada en el sistema académico SIGA.'
      });

      setSuccessMsg(`Nota del Corte ${corte} guardada exitosamente (RF-08).`);
      await cargarSabana(selectedGrupoId);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al asentar calificación');
    } finally {
      setSaving(false);
    }
  };

  const grupoActual = grupos.find(g => g.id === selectedGrupoId);
  const periodoActual = periodos.find(p => p.id === grupoActual?.periodoId);
  const ventanaAbierta = periodoActual ? periodoActual.permiteCalificaciones : true;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Evaluaciones, Calificaciones y Kardex
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-mono font-medium">
            RF-08 & RF-09
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Registro docente de notas por cortes (30%, 35%, 35%), control de fechas límite por Coordinación y vista consolidada para estudiantes.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 flex items-start gap-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Restricción de Calificaciones:</div>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {!isEstudiante && (
          <button
            onClick={() => setActiveTab('GRADEBOOK')}
            className={`py-3 px-6 font-semibold text-sm transition border-b-2 cursor-pointer ${
              activeTab === 'GRADEBOOK'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Planilla de Notas del Docente (RF-08)
          </button>
        )}
        <button
          onClick={async () => {
            setActiveTab('KARDEX');
            if (!kardexData) {
              const studentId = currentUser.perfilId || (currentUser.email?.includes('sofia') ? 'est-2' : 'est-1');
              try {
                const k = await api.getKardexEstudiante(studentId);
                setKardexData(k);
              } catch (err: any) {
                console.warn('Could not load kardex on tab click:', err);
              }
            }
          }}
          className={`py-3 px-6 font-semibold text-sm transition border-b-2 cursor-pointer ${
            activeTab === 'KARDEX'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Kardex & Historial Académico del Estudiante (RF-09)
        </button>
      </div>

      {/* Tab 1: Gradebook Docente (RF-08) */}
      {activeTab === 'GRADEBOOK' && (
        <div className="space-y-4">
          {/* Group & Period Selector */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Grupo Académico Asignado
                </label>
                <select
                  value={selectedGrupoId}
                  onChange={(e) => handleGrupoChange(e.target.value)}
                  className="font-bold text-slate-900 dark:text-white bg-transparent border-none text-base focus:ring-0 cursor-pointer p-0 mt-0.5"
                >
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.codigo} - {g.asignaturaNombre} (Docente: {g.docenteNombre})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calendar Restriction Warning (RF-08) */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 border ${
                  ventanaAbierta
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {ventanaAbierta ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> Ventana de Registro Habilitada
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Ventana Cerrada por Coordinación (RF-08)
                  </>
                )}
              </span>
            </div>
          </div>

          {!ventanaAbierta && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                La Coordinación Académica ha cerrado las fechas de ingreso de calificaciones para este periodo. Las notas se encuentran en modo de solo lectura.
              </span>
            </div>
          )}

          {/* Gradebook Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5">Estudiante</th>
                    <th className="px-4 py-3.5 text-center">Corte 1 (30%)</th>
                    <th className="px-4 py-3.5 text-center">Corte 2 (35%)</th>
                    <th className="px-4 py-3.5 text-center">Corte 3 / Final (35%)</th>
                    <th className="px-4 py-3.5 text-center">Definitiva</th>
                    <th className="px-4 py-3.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {sabanaNotas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No hay estudiantes matriculados en este grupo académico.
                      </td>
                    </tr>
                  ) : (
                    sabanaNotas.map((item) => {
                      const editValues = editingNotas[item.matriculaId] || { c1: '', c2: '', c3: '' };
                      return (
                        <tr key={item.matriculaId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {item.nombreEstudiante}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {item.codigoEstudiantil} • C.C. {item.documentoIdentidad}
                            </div>
                          </td>

                          {/* Corte 1 */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                step="0.1"
                                min="0.0"
                                max="5.0"
                                disabled={!ventanaAbierta || saving}
                                value={editValues.c1}
                                onChange={(e) => handleNotaChange(item.matriculaId, 'c1', e.target.value)}
                                className="w-16 px-2 py-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                              />
                              {ventanaAbierta && editValues.c1 !== item.corte1 && (
                                <button
                                  onClick={() => handleGuardarNota(item.matriculaId, 1, editValues.c1)}
                                  className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                                  title="Guardar nota Corte 1"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Corte 2 */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                step="0.1"
                                min="0.0"
                                max="5.0"
                                disabled={!ventanaAbierta || saving}
                                value={editValues.c2}
                                onChange={(e) => handleNotaChange(item.matriculaId, 'c2', e.target.value)}
                                className="w-16 px-2 py-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                              />
                              {ventanaAbierta && editValues.c2 !== item.corte2 && (
                                <button
                                  onClick={() => handleGuardarNota(item.matriculaId, 2, editValues.c2)}
                                  className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                                  title="Guardar nota Corte 2"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Corte 3 */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                step="0.1"
                                min="0.0"
                                max="5.0"
                                disabled={!ventanaAbierta || saving}
                                value={editValues.c3}
                                onChange={(e) => handleNotaChange(item.matriculaId, 'c3', e.target.value)}
                                className="w-16 px-2 py-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                              />
                              {ventanaAbierta && editValues.c3 !== item.corte3 && (
                                <button
                                  onClick={() => handleGuardarNota(item.matriculaId, 3, editValues.c3)}
                                  className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                                  title="Guardar nota Corte 3"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Definitiva */}
                          <td className="px-4 py-3 text-center">
                            <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                              {item.notaFinal.toFixed(2)}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                item.estadoAprobacion === 'APROBADO'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : item.estadoAprobacion === 'REPROBADO'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {item.estadoAprobacion}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Kardex Estudiantil (RF-09) */}
      {activeTab === 'KARDEX' && kardexData && (
        <div className="space-y-6">
          {/* Student Academic Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs uppercase font-semibold text-slate-400">Promedio Acumulado (GPA)</span>
              <div className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {kardexData.promedioAcumulado.toFixed(2)}
              </div>
              <span className="text-xs text-slate-400">Escala de 0.0 a 5.0</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs uppercase font-semibold text-slate-400">Créditos Aprobados</span>
              <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {kardexData.totalCreditosAprobados}
              </div>
              <span className="text-xs text-slate-400">Sobre total del plan curricular</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs uppercase font-semibold text-slate-400">Estudiante</span>
              <div className="mt-2 font-bold text-slate-900 dark:text-white text-base">
                {kardexData.estudiante.nombres} {kardexData.estudiante.apellidos}
              </div>
              <span className="text-xs text-slate-400">{kardexData.estudiante.programaNombre}</span>
            </div>
          </div>

          {/* Detailed Course Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Historial de Asignaturas y Calificaciones Publicadas (RF-09)
              </h2>
              <span className="text-xs text-slate-400">Consultas de lectura directa optimizadas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5">Asignatura</th>
                    <th className="px-4 py-3.5 text-center">Periodo</th>
                    <th className="px-4 py-3.5 text-center">Créditos</th>
                    <th className="px-4 py-3.5 text-center">Parcial 1 (30%)</th>
                    <th className="px-4 py-3.5 text-center">Parcial 2 (35%)</th>
                    <th className="px-4 py-3.5 text-center">Examen Final (35%)</th>
                    <th className="px-4 py-3.5 text-center">Nota Final</th>
                    <th className="px-4 py-3.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {kardexData.asignaturas.map((asig) => (
                    <tr key={asig.matriculaId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{asig.asignaturaNombre}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {asig.asignaturaCodigo} • Grupo {asig.grupoCodigo} • Prof. {asig.docenteNombre}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-slate-500">
                        {asig.periodoCodigo}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs">
                        {asig.creditos}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {asig.corte1 !== undefined ? asig.corte1.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {asig.corte2 !== undefined ? asig.corte2.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {asig.corte3 !== undefined ? asig.corte3.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-base text-slate-900 dark:text-white">
                        {asig.notaFinal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            asig.estadoAprobacion === 'APROBADO'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : asig.estadoAprobacion === 'REPROBADO'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {asig.estadoAprobacion}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
