/**
 * Academic Reports View
 * Implements RF-10 (Reportes consolidados, métricas institucionales, filtros dinámicos y exportación).
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Users,
  Award,
  BookOpen,
  PieChart,
  Calendar,
  Building,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ReporteConsolidadoDto } from '../backend/dto/dtos.ts';
import { PeriodoAcademico } from '../backend/domain/models.ts';

export const ReportesView: React.FC = () => {
  const [reporte, setReporte] = useState<ReporteConsolidadoDto | null>(null);
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const cargarDatos = async (periodoId?: string) => {
    try {
      setLoading(true);
      const [rep, pList] = await Promise.all([
        api.getReporteConsolidado(periodoId),
        api.getPeriodos()
      ]);
      setReporte(rep);
      setPeriodos(pList);
      if (!selectedPeriodo && pList.length > 0) {
        setSelectedPeriodo(pList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handlePeriodoChange = (pId: string) => {
    setSelectedPeriodo(pId);
    cargarDatos(pId);
  };

  const exportarCSV = () => {
    if (!reporte) return;
    const rows = [
      ['Reporte Institucional Academico SIGA', new Date().toLocaleDateString()],
      ['Metrica', 'Valor'],
      ['Estudiantes Activos', reporte.totalEstudiantesActivos],
      ['Docentes Activos', reporte.totalDocentesActivos],
      ['Programas Academicos', reporte.totalProgramas],
      ['Grupos Abiertos', reporte.totalGruposAbiertos],
      ['Matriculas Activas', reporte.totalMatriculasActivas],
      ['Promedio General Institucional', reporte.promedioGeneralInstitucional],
      ['Tasa de Aprobacion (%)', `${reporte.tasaAprobacionPorcentaje}%`],
      [],
      ['Matriculas por Programa'],
      ...reporte.matriculasPorPrograma.map(m => [m.programa, m.matriculas]),
      [],
      ['Distribucion por Facultad'],
      ...reporte.distribucionPorFacultad.map(f => [f.facultad, f.cantidad])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_academico_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes y Analítica Académica</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono font-medium">
              RF-10
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Información consolidada de matrículas, resultados y capacidad institucional respaldada por vistas desacopladas.
          </p>
        </div>

        <button
          onClick={exportarCSV}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-sm cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar a CSV</span>
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>Filtrar Reportes por Periodo:</span>
        </div>
        <select
          value={selectedPeriodo}
          onChange={(e) => handlePeriodoChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({p.codigo})
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      {reporte && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs uppercase font-semibold text-slate-400">Estudiantes Activos</span>
            <div className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {reporte.totalEstudiantesActivos}
            </div>
            <span className="text-[11px] text-slate-400">Total matriculables</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs uppercase font-semibold text-slate-400">Docentes Activos</span>
            <div className="mt-2 text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {reporte.totalDocentesActivos}
            </div>
            <span className="text-[11px] text-slate-400">Cuerpo docente asignado</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs uppercase font-semibold text-slate-400">Tasa de Aprobación</span>
            <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {reporte.tasaAprobacionPorcentaje}%
            </div>
            <span className="text-[11px] text-slate-400">Notas &gt;= 3.0</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs uppercase font-semibold text-slate-400">Promedio General</span>
            <div className="mt-2 text-3xl font-black text-sky-600 dark:text-sky-400 font-mono">
              {reporte.promedioGeneralInstitucional}
            </div>
            <span className="text-[11px] text-slate-400">Escala de 0.0 a 5.0</span>
          </div>
        </div>
      )}

      {/* Program Distribution Table & Faculty Breakdown */}
      {reporte && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matrículas por Programa */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Matrículas Activas por Programa</span>
            </h3>
            <div className="space-y-3">
              {reporte.matriculasPorPrograma.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="truncate pr-2">{p.programa}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{p.matriculas} matrículas</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (p.matriculas / Math.max(1, reporte.totalMatriculasActivas)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución por Facultad */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-500" />
              <span>Oferta Académica por Facultad</span>
            </h3>
            <div className="space-y-3">
              {reporte.distribucionPorFacultad.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{f.facultad}</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {f.cantidad} programas
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
