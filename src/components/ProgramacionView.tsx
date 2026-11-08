/**
 * Academic Scheduling & Group Management View
 * Implements RF-06 (Periodos, grupos, cupos, docentes, horarios)
 * and the live Schedule Conflict Detection Algorithm for teachers and classrooms.
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.ts';
import { GrupoDetalladoDto, DocenteDto, UsuarioDto } from '../backend/dto/dtos.ts';
import { PeriodoAcademico, Asignatura, HorarioSesion } from '../backend/domain/models.ts';
import { verificarCruceHorarios } from '../backend/service/services.ts';

interface ProgramacionViewProps {
  currentUser?: UsuarioDto;
}

export const ProgramacionView: React.FC<ProgramacionViewProps> = ({ currentUser }) => {
  const [grupos, setGrupos] = useState<GrupoDetalladoDto[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [docentes, setDocentes] = useState<DocenteDto[]>([]);

  const [selectedPeriodoId, setSelectedPeriodoId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Crear Grupo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    asignaturaId: '',
    periodoId: '',
    docenteId: '',
    cupoMaximo: 25,
    modalidad: 'PRESENCIAL' as const,
    dia: 'LUNES' as HorarioSesion['dia'],
    horaInicio: '08:00',
    horaFin: '10:00',
    aula: 'Laboratorio de Software 302'
  });

  // Live Conflict State (RF-06)
  const [liveConflict, setLiveConflict] = useState<{ hasConflict: boolean; message?: string }>({
    hasConflict: false
  });

  const canManageProgramacion = !currentUser || currentUser.rol === 'ADMIN' || currentUser.rol === 'COORDINADOR';

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [gList, pList, aList, dList] = await Promise.all([
        api.getGrupos(),
        api.getPeriodos(),
        api.getAsignaturas(),
        api.getDocentes(true)
      ]);
      setGrupos(gList);
      setPeriodos(pList);
      setAsignaturas(aList);
      setDocentes(dList);

      const activo = pList.find(p => p.estado === 'ACTIVO') || pList[0];
      if (activo && !selectedPeriodoId) {
        setSelectedPeriodoId(activo.id);
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando programación académica');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Update live conflict detection when form parameters change
  useEffect(() => {
    if (!formData.docenteId || !formData.periodoId) {
      setLiveConflict({ hasConflict: false });
      return;
    }

    const testHorario: HorarioSesion = {
      dia: formData.dia,
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
      aula: formData.aula
    };

    const gruposPeriodo = grupos.filter(g => g.periodoId === formData.periodoId);

    for (const g of gruposPeriodo) {
      for (const h of g.horarios) {
        if (verificarCruceHorarios(testHorario, h)) {
          // Check teacher collision
          if (g.docenteId === formData.docenteId) {
            setLiveConflict({
              hasConflict: true,
              message: `[CRUCE_DOCENTE] El docente seleccionado ya tiene clase en el grupo ${g.codigo} (${g.asignaturaNombre}) el ${testHorario.dia} de ${h.horaInicio} a ${h.horaFin}.`
            });
            return;
          }
          // Check classroom collision
          if (
            testHorario.aula.toLowerCase() === h.aula.toLowerCase() &&
            !testHorario.aula.toLowerCase().includes('virtual')
          ) {
            setLiveConflict({
              hasConflict: true,
              message: `[CRUCE_AULA] El espacio "${testHorario.aula}" ya está reservado por el grupo ${g.codigo} el ${testHorario.dia} de ${h.horaInicio} a ${h.horaFin}.`
            });
            return;
          }
        }
      }
    }

    setLiveConflict({ hasConflict: false });
  }, [formData, grupos]);

  const handleOpenCreateModal = () => {
    setFormData({
      codigo: `SIS-${Math.floor(Math.random() * 800 + 100)}-G1`,
      asignaturaId: asignaturas.length > 0 ? asignaturas[0].id : '',
      periodoId: selectedPeriodoId || (periodos.length > 0 ? periodos[0].id : ''),
      docenteId: docentes.length > 0 ? docentes[0].id : '',
      cupoMaximo: 25,
      modalidad: 'PRESENCIAL',
      dia: 'LUNES',
      horaInicio: '14:00',
      horaFin: '16:00',
      aula: 'Edificio Central Aula 204'
    });
    setIsModalOpen(true);
  };

  const handleCreateGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (liveConflict.hasConflict) {
      setError(`No se puede crear el grupo: ${liveConflict.message}`);
      return;
    }

    try {
      const payload = {
        codigo: formData.codigo,
        asignaturaId: formData.asignaturaId,
        periodoId: formData.periodoId,
        docenteId: formData.docenteId,
        cupoMaximo: formData.cupoMaximo,
        modalidad: formData.modalidad,
        estado: 'ABIERTO' as const,
        horarios: [
          {
            dia: formData.dia,
            horaInicio: formData.horaInicio,
            horaFin: formData.horaFin,
            aula: formData.aula
          }
        ]
      };

      await api.createGrupo(payload);
      setSuccessMsg(`Grupo ${formData.codigo} programado exitosamente. Validación de disponibilidad superada (RF-06).`);
      setIsModalOpen(false);
      cargarDatos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al programar grupo');
    }
  };

  const handleToggleNotas = async (periodo: PeriodoAcademico) => {
    try {
      const nuevoEstado = !periodo.permiteCalificaciones;
      await api.toggleVentanaNotas(periodo.id, nuevoEstado);
      setSuccessMsg(
        `Ventana de calificaciones ${nuevoEstado ? 'habilitada' : 'cerrada'} para el periodo ${periodo.codigo} (RF-08).`
      );
      cargarDatos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error alternando ventana de notas');
    }
  };

  const periodoSeleccionado = periodos.find(p => p.id === selectedPeriodoId);
  const gruposFiltrados = grupos.filter(g => !selectedPeriodoId || g.periodoId === selectedPeriodoId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Programación Académica</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 font-mono font-medium">
              RF-06
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configuración de periodos, cupos, aulas, docentes y algoritmo de prevención de cruces de horario.
          </p>
        </div>

        {canManageProgramacion && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apertura de Nuevo Grupo</span>
          </button>
        )}
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

      {/* Period Control Bar (Coordinación Académica) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Periodo Académico Activo
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedPeriodoId}
                onChange={(e) => setSelectedPeriodoId(e.target.value)}
                className="font-bold text-slate-900 dark:text-white bg-transparent border-none text-base focus:ring-0 cursor-pointer p-0"
              >
                {periodos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.codigo}) - {p.estado}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {periodoSeleccionado && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Ventana de Calificaciones (RF-08):{' '}
              <strong className={periodoSeleccionado.permiteCalificaciones ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {periodoSeleccionado.permiteCalificaciones ? 'ABIERTA' : 'CERRADA'}
              </strong>
            </div>

            {canManageProgramacion ? (
              <button
                onClick={() => handleToggleNotas(periodoSeleccionado)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                  periodoSeleccionado.permiteCalificaciones
                    ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                }`}
              >
                {periodoSeleccionado.permiteCalificaciones ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Cerrar Ventana de Notas
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> Habilitar Ventana de Notas
                  </>
                )}
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                (Control exclusivo de Coordinación)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gruposFiltrados.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            No hay grupos programados para este periodo académico.
          </div>
        ) : (
          gruposFiltrados.map((g) => {
            const ocupacionPorcentaje = Math.round((g.cupoOcupado / g.cupoMaximo) * 100);
            return (
              <div
                key={g.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {g.codigo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        g.estado === 'ABIERTO'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {g.estado}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {g.asignaturaNombre}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {g.asignaturaCodigo} • {g.creditos} Créditos
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="font-medium truncate">{g.docenteNombre}</span>
                  </div>

                  {/* Horarios */}
                  <div className="mt-3 space-y-1.5 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-semibold uppercase text-slate-400">Horarios Programados:</div>
                    {g.horarios.map((h, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {h.dia} {h.horaInicio} - {h.horaFin}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[120px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {h.aula}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cupo Indicator */}
                <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Cupo Ocupado:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {g.cupoOcupado} / {g.cupoMaximo} ({g.cuposDisponibles} disp.)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ocupacionPorcentaje >= 100
                          ? 'bg-rose-500'
                          : ocupacionPorcentaje >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, ocupacionPorcentaje)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Crear Grupo con Live Conflict Detector (RF-06) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Programar Grupo Académico (RF-06)
              </h2>
            </div>

            <form onSubmit={handleCreateGrupo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código de Grupo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cupo Máximo *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.cupoMaximo}
                    onChange={(e) => setFormData({ ...formData, cupoMaximo: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Asignatura Curricular *
                </label>
                <select
                  value={formData.asignaturaId}
                  onChange={(e) => setFormData({ ...formData, asignaturaId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {asignaturas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codigo} - {a.nombre} ({a.creditos} cr.)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Docente Titular Asignado *
                </label>
                <select
                  value={formData.docenteId}
                  onChange={(e) => setFormData({ ...formData, docenteId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombres} {d.apellidos} ({d.departamento})
                    </option>
                  ))}
                </select>
              </div>

              {/* Horario y Aula */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Horario y Asignación de Aula
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Día</label>
                    <select
                      value={formData.dia}
                      onChange={(e) => setFormData({ ...formData, dia: e.target.value as any })}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="LUNES">Lunes</option>
                      <option value="MARTES">Martes</option>
                      <option value="MIERCOLES">Miércoles</option>
                      <option value="JUEVES">Jueves</option>
                      <option value="VIERNES">Viernes</option>
                      <option value="SABADO">Sábado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Inicio</label>
                    <input
                      type="time"
                      value={formData.horaInicio}
                      onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Fin</label>
                    <input
                      type="time"
                      value={formData.horaFin}
                      onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Aula / Espacio Físico</label>
                  <input
                    type="text"
                    value={formData.aula}
                    onChange={(e) => setFormData({ ...formData, aula: e.target.value })}
                    placeholder="Laboratorio de Software 302"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              {/* LIVE CONFLICT FEEDBACK (RF-06 Algoritmo de Cruces) */}
              {liveConflict.hasConflict ? (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Conflicto de Cruce Detectado:</span>
                    <p className="mt-0.5 leading-relaxed">{liveConflict.message}</p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Sin colisiones de docente ni de aula para este horario (Algoritmo RF-06 verificado).</span>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={liveConflict.hasConflict}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition shadow-xs text-white ${
                    liveConflict.hasConflict
                      ? 'bg-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  }`}
                >
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
