/**
 * Curricular Management View
 * Implements RF-05 (Programas, planes de estudio, asignaturas, validación creditos > 0, código único, creación y edición completa)
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Layers,
  Sparkles,
  Edit2
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ProgramaAcademico, Asignatura } from '../backend/domain/models.ts';

export const CurricularView: React.FC = () => {
  const [programas, setProgramas] = useState<ProgramaAcademico[]>([]);
  const [asignaturas, setAsignaturas] = useState<(Asignatura & { programaNombre?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'PROGRAMAS' | 'ASIGNATURAS'>('ASIGNATURAS');

  // Modal Asignatura State
  const [isAsigModalOpen, setIsAsigModalOpen] = useState(false);
  const [editingAsigId, setEditingAsigId] = useState<string | null>(null);
  const [asigFormData, setAsigFormData] = useState({
    codigo: '',
    nombre: '',
    programaId: '',
    creditos: 3,
    semestreNivel: 1,
    departamento: 'Ingeniería de Software y Sistemas',
    activo: true,
    descripcion: ''
  });

  // Modal Programa State
  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [editingProgId, setEditingProgId] = useState<string | null>(null);
  const [progFormData, setProgFormData] = useState<{
    codigo: string;
    nombre: string;
    facultad: string;
    nivelFormacion: 'PREGRADO' | 'POSGRADO' | 'MAESTRIA' | 'DOCTORADO';
    totalCreditos: number;
    duracionSemestres: number;
    activo: boolean;
  }>({
    codigo: '',
    nombre: '',
    facultad: 'Facultad de Ingeniería',
    nivelFormacion: 'PREGRADO',
    totalCreditos: 160,
    duracionSemestres: 10,
    activo: true
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pList, aList] = await Promise.all([
        api.getProgramas(),
        api.getAsignaturas()
      ]);
      setProgramas(pList);
      setAsignaturas(aList);
      if (pList.length > 0 && !asigFormData.programaId) {
        setAsigFormData(prev => ({ ...prev, programaId: pList[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando malla curricular');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Handlers para Asignaturas
  const handleOpenCreateAsignatura = () => {
    setEditingAsigId(null);
    setAsigFormData({
      codigo: '',
      nombre: '',
      programaId: programas.length > 0 ? programas[0].id : '',
      creditos: 3,
      semestreNivel: 1,
      departamento: 'Ingeniería de Software y Sistemas',
      activo: true,
      descripcion: ''
    });
    setIsAsigModalOpen(true);
  };

  const handleOpenEditAsignatura = (asig: Asignatura) => {
    setEditingAsigId(asig.id);
    setAsigFormData({
      codigo: asig.codigo,
      nombre: asig.nombre,
      programaId: asig.programaId,
      creditos: asig.creditos,
      semestreNivel: asig.semestreNivel,
      departamento: asig.departamento,
      activo: asig.activo,
      descripcion: asig.descripcion || ''
    });
    setIsAsigModalOpen(true);
  };

  const handleSubmitAsignatura = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Regla RF-05: creditos > 0
      if (asigFormData.creditos <= 0) {
        setError('Validación RF-05: Los créditos de la asignatura deben ser estrictamente mayores a cero.');
        return;
      }

      if (editingAsigId) {
        await api.updateAsignatura(editingAsigId, asigFormData);
        setSuccessMsg(`Asignatura ${asigFormData.nombre} (${asigFormData.codigo}) actualizada exitosamente.`);
      } else {
        await api.createAsignatura(asigFormData);
        setSuccessMsg(`Asignatura ${asigFormData.nombre} (${asigFormData.codigo}) creada exitosamente.`);
      }

      setIsAsigModalOpen(false);
      cargarDatos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la asignatura');
    }
  };

  // Handlers para Programas
  const handleOpenCreatePrograma = () => {
    setEditingProgId(null);
    setProgFormData({
      codigo: '',
      nombre: '',
      facultad: 'Facultad de Ingeniería',
      nivelFormacion: 'PREGRADO',
      totalCreditos: 160,
      duracionSemestres: 10,
      activo: true
    });
    setIsProgModalOpen(true);
  };

  const handleOpenEditPrograma = (prog: ProgramaAcademico) => {
    setEditingProgId(prog.id);
    setProgFormData({
      codigo: prog.codigo,
      nombre: prog.nombre,
      facultad: prog.facultad,
      nivelFormacion: prog.nivelFormacion,
      totalCreditos: prog.totalCreditos,
      duracionSemestres: prog.duracionSemestres,
      activo: prog.activo
    });
    setIsProgModalOpen(true);
  };

  const handleSubmitPrograma = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingProgId) {
        await api.updatePrograma(editingProgId, progFormData);
        setSuccessMsg(`Programa académico ${progFormData.nombre} (${progFormData.codigo}) actualizado con éxito.`);
      } else {
        await api.createPrograma(progFormData);
        setSuccessMsg(`Programa académico ${progFormData.nombre} registrado con éxito.`);
      }

      setIsProgModalOpen(false);
      cargarDatos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el programa');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión Curricular</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono font-medium">
              RF-05
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Estructura jerárquica de Programas Académicos, Planes de Estudio y Asignaturas con edición y validación de créditos.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleOpenCreatePrograma}
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition cursor-pointer"
          >
            Nuevo Programa
          </button>
          <button
            onClick={handleOpenCreateAsignatura}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Asignatura</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('ASIGNATURAS')}
          className={`py-3 px-6 font-semibold text-sm transition border-b-2 cursor-pointer ${
            activeTab === 'ASIGNATURAS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Catálogo de Asignaturas ({asignaturas.length})
        </button>
        <button
          onClick={() => setActiveTab('PROGRAMAS')}
          className={`py-3 px-6 font-semibold text-sm transition border-b-2 cursor-pointer ${
            activeTab === 'PROGRAMAS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Programas Académicos ({programas.length})
        </button>
      </div>

      {/* View: Asignaturas */}
      {activeTab === 'ASIGNATURAS' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Código Único</th>
                  <th className="px-4 py-3.5">Asignatura</th>
                  <th className="px-4 py-3.5">Programa</th>
                  <th className="px-4 py-3.5 text-center">Nivel / Semestre</th>
                  <th className="px-4 py-3.5 text-center">Créditos (&gt;0)</th>
                  <th className="px-4 py-3.5">Departamento</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {asignaturas.map((asig) => (
                  <tr key={asig.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                      {asig.codigo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{asig.nombre}</div>
                      {asig.descripcion && (
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{asig.descripcion}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-700 dark:text-slate-300">{asig.programaNombre}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs font-mono">
                        Semestre {asig.semestreNivel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                        {asig.creditos} créditos
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {asig.departamento}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEditAsignatura(asig)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title="Editar asignatura"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View: Programas */}
      {activeTab === 'PROGRAMAS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programas.map((prog) => (
            <div
              key={prog.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {prog.codigo}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                      {prog.nombre}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prog.facultad}</span>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {prog.nivelFormacion}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-700/60 pt-3 mt-3 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Total Créditos:</span>{' '}
                    <strong className="font-mono">{prog.totalCreditos}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Duración:</span>{' '}
                    <strong className="font-mono">{prog.duracionSemestres} Semestres</strong>
                  </div>
                </div>
              </div>

              {/* Botón de Edición del Programa */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                <button
                  onClick={() => handleOpenEditPrograma(prog)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                  title="Editar programa académico"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Programa</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar Asignatura */}
      {isAsigModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingAsigId ? 'Editar Asignatura Curricular (RF-05)' : 'Registrar Asignatura (RF-05)'}
            </h2>
            <form onSubmit={handleSubmitAsignatura} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código de Asignatura *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SIS-401"
                    value={asigFormData.codigo}
                    onChange={(e) => setAsigFormData({ ...asigFormData, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Debe ser único en el sistema</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Créditos Académicos *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={asigFormData.creditos}
                    onChange={(e) => setAsigFormData({ ...asigFormData, creditos: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Regla RF-05: mayor a cero (&gt;0)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Asignatura *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Patrones de Diseño de Software"
                  value={asigFormData.nombre}
                  onChange={(e) => setAsigFormData({ ...asigFormData, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Programa Académico *
                  </label>
                  <select
                    value={asigFormData.programaId}
                    onChange={(e) => setAsigFormData({ ...asigFormData, programaId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {programas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semestre / Nivel
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={asigFormData.semestreNivel}
                    onChange={(e) => setAsigFormData({ ...asigFormData, semestreNivel: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Departamento Responsable
                </label>
                <input
                  type="text"
                  value={asigFormData.departamento}
                  onChange={(e) => setAsigFormData({ ...asigFormData, departamento: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción del Contenido Programático
                </label>
                <textarea
                  rows={2}
                  value={asigFormData.descripcion}
                  onChange={(e) => setAsigFormData({ ...asigFormData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAsigModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shadow-xs"
                >
                  {editingAsigId ? 'Guardar Cambios' : 'Guardar Asignatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Programa */}
      {isProgModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingProgId ? 'Editar Programa Académico (RF-05)' : 'Registrar Programa Académico (RF-05)'}
            </h2>
            <form onSubmit={handleSubmitPrograma} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código de Programa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ING-IA"
                    value={progFormData.codigo}
                    onChange={(e) => setProgFormData({ ...progFormData, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nivel de Formación
                  </label>
                  <select
                    value={progFormData.nivelFormacion}
                    onChange={(e) => setProgFormData({ ...progFormData, nivelFormacion: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="PREGRADO">Pregrado</option>
                    <option value="POSGRADO">Especialización</option>
                    <option value="MAESTRIA">Maestría</option>
                    <option value="DOCTORADO">Doctorado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Programa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ingeniería en Inteligencia Artificial"
                  value={progFormData.nombre}
                  onChange={(e) => setProgFormData({ ...progFormData, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Facultad Responsable *
                </label>
                <input
                  type="text"
                  required
                  value={progFormData.facultad}
                  onChange={(e) => setProgFormData({ ...progFormData, facultad: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Créditos
                  </label>
                  <input
                    type="number"
                    value={progFormData.totalCreditos}
                    onChange={(e) => setProgFormData({ ...progFormData, totalCreditos: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duración (Semestres)
                  </label>
                  <input
                    type="number"
                    value={progFormData.duracionSemestres}
                    onChange={(e) => setProgFormData({ ...progFormData, duracionSemestres: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsProgModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shadow-xs"
                >
                  {editingProgId ? 'Guardar Cambios' : 'Guardar Programa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
