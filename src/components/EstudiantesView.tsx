/**
 * Estudiantes Management View
 * Implements RF-03 (CRUD de Estudiantes, validación de documento único, borrado lógico),
 * RF-11 (Búsqueda y filtros rápidos) y RNF-11 (Privacidad de datos con DTOs).
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  UserX,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building
} from 'lucide-react';
import { api } from '../services/api.ts';
import { EstudianteDto } from '../backend/dto/dtos.ts';
import { ProgramaAcademico } from '../backend/domain/models.ts';

export const EstudiantesView: React.FC = () => {
  const [estudiantes, setEstudiantes] = useState<EstudianteDto[]>([]);
  const [programas, setProgramas] = useState<ProgramaAcademico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters (RF-11)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrograma, setFilterPrograma] = useState('TODOS');
  const [filterEstado, setFilterEstado] = useState('TODOS');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    documentoIdentidad: '',
    codigoEstudiantil: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    programaId: '',
    semestreActual: 1,
    estado: 'ACTIVO'
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [estList, progList] = await Promise.all([
        api.getEstudiantes(false),
        api.getProgramas()
      ]);
      setEstudiantes(estList);
      setProgramas(progList);
      if (progList.length > 0 && !formData.programaId) {
        setFormData(prev => ({ ...prev, programaId: progList[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando estudiantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      documentoIdentidad: '',
      codigoEstudiantil: `EST-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      programaId: programas.length > 0 ? programas[0].id : '',
      semestreActual: 1,
      estado: 'ACTIVO'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (est: EstudianteDto) => {
    setEditingId(est.id);
    setFormData({
      documentoIdentidad: est.documentoIdentidad,
      codigoEstudiantil: est.codigoEstudiantil,
      nombres: est.nombres,
      apellidos: est.apellidos,
      email: est.email,
      telefono: est.telefono,
      programaId: est.programaId,
      semestreActual: est.semestreActual,
      estado: est.estado
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api.updateEstudiante(editingId, formData);
        setSuccessMsg('Estudiante actualizado exitosamente en el sistema.');
      } else {
        await api.createEstudiante(formData);
        setSuccessMsg('Estudiante registrado con éxito. Validación de documento único superada (RF-03).');
      }
      setIsModalOpen(false);
      cargarDatos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar estudiante');
    }
  };

  const handleDesactivar = async (id: string, nombre: string) => {
    try {
      await api.desactivarEstudiante(id);
      setSuccessMsg(`Estudiante ${nombre} desactivado lógicamente (Estado: INACTIVO).`);
      cargarDatos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al desactivar estudiante');
    }
  };

  // Filtered List (RF-11)
  const estudiantesFiltrados = estudiantes.filter(e => {
    const matchSearch =
      e.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.documentoIdentidad.includes(searchTerm) ||
      e.codigoEstudiantil.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPrograma = filterPrograma === 'TODOS' || e.programaId === filterPrograma;
    const matchEstado = filterEstado === 'TODOS' || e.estado === filterEstado;

    return matchSearch && matchPrograma && matchEstado;
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Estudiantes</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-mono font-medium">
              RF-03 & RF-11
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            CRUD completo, verificación de documento único, borrado lógico e integridad del historial académico.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Estudiante</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* Search & Filters Bar (RF-11) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por documento, nombres, apellidos o código estudiantil..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={filterPrograma}
            onChange={(e) => setFilterPrograma(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="TODOS">Todos los Programas</option>
            {programas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVO">Solo Activos</option>
            <option value="INACTIVO">Solo Inactivos (Borrado Lógico)</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3.5">Código / Documento</th>
                <th className="px-4 py-3.5">Nombre Completo</th>
                <th className="px-4 py-3.5">Programa Académico</th>
                <th className="px-4 py-3.5 text-center">Semestre</th>
                <th className="px-4 py-3.5 text-center">Promedio</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Cargando estudiantes desde la capa de persistencia...
                  </td>
                </tr>
              ) : estudiantesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No se encontraron registros de estudiantes con los filtros especificados.
                  </td>
                </tr>
              ) : (
                estudiantesFiltrados.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{est.codigoEstudiantil}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <FileText className="w-3 h-3" /> C.C. {est.documentoIdentidad}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {est.nombres} {est.apellidos}
                      </div>
                      <div className="text-xs text-slate-400">{est.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <Building className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{est.programaNombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs">
                        Sem. {est.semestreActual}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {est.promedioAcumulado > 0 ? est.promedioAcumulado.toFixed(2) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          est.estado === 'ACTIVO'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {est.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(est)}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                          title="Actualizar información"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {est.estado === 'ACTIVO' && (
                          <button
                            onClick={() => handleDesactivar(est.id, `${est.nombres} ${est.apellidos}`)}
                            className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                            title="Desactivar lógicamente (RF-03)"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Estudiante */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingId ? 'Actualizar Registro de Estudiante' : 'Registrar Nuevo Estudiante (RF-03)'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Documento Identidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.documentoIdentidad}
                    onChange={(e) => setFormData({ ...formData, documentoIdentidad: e.target.value })}
                    placeholder="1014236589"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Validación de unicidad en BD</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código Estudiantil
                  </label>
                  <input
                    type="text"
                    value={formData.codigoEstudiantil}
                    onChange={(e) => setFormData({ ...formData, codigoEstudiantil: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="estudiante@universidad.edu.co"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+57 300 000 0000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Programa Académico *
                  </label>
                  <select
                    value={formData.programaId}
                    onChange={(e) => setFormData({ ...formData, programaId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {programas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.codigo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semestre Actual
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.semestreActual}
                    onChange={(e) => setFormData({ ...formData, semestreActual: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {editingId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado de Matrícula (Borrado Lógico)
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO (Desactivación Lógica)</option>
                    <option value="GRADUADO">GRADUADO</option>
                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                  </select>
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shadow-xs"
                >
                  {editingId ? 'Guardar Cambios' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
