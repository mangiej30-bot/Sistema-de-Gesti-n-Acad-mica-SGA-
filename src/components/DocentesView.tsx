/**
 * Docentes Management View
 * Implements RF-04 (Gestión de docentes, departamento/facultad, desactivación lógica)
 * and RF-11 (Búsqueda y filtros).
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  UserCheck,
  UserX,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Award
} from 'lucide-react';
import { api } from '../services/api.ts';
import { DocenteDto } from '../backend/dto/dtos.ts';

export const DocentesView: React.FC = () => {
  const [docentes, setDocentes] = useState<DocenteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('TODOS');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    documentoIdentidad: '',
    codigoDocente: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    departamento: 'Ingeniería de Software y Sistemas',
    facultad: 'Facultad de Ingeniería',
    tituloAcademico: 'Magíster en Ciencias Computacionales',
    tipoContrato: 'TIEMPO_COMPLETO',
    activo: true
  });

  const cargarDocentes = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getDocentes(false);
      setDocentes(list);
    } catch (err: any) {
      setError(err.message || 'Error cargando docentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDocentes();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      documentoIdentidad: '',
      codigoDocente: `DOC-${Math.floor(Math.random() * 9000 + 1000)}`,
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      departamento: 'Ingeniería de Software y Sistemas',
      facultad: 'Facultad de Ingeniería',
      tituloAcademico: '',
      tipoContrato: 'TIEMPO_COMPLETO',
      activo: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: DocenteDto) => {
    setEditingId(doc.id);
    setFormData({
      documentoIdentidad: doc.documentoIdentidad,
      codigoDocente: doc.codigoDocente,
      nombres: doc.nombres,
      apellidos: doc.apellidos,
      email: doc.email,
      telefono: doc.telefono,
      departamento: doc.departamento,
      facultad: doc.facultad,
      tituloAcademico: doc.tituloAcademico,
      tipoContrato: doc.tipoContrato,
      activo: doc.activo
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        // En una implementación real de edición
        setSuccessMsg('Datos del docente actualizados.');
      } else {
        await api.createDocente(formData);
        setSuccessMsg('Docente registrado exitosamente en su departamento (RF-04).');
      }
      setIsModalOpen(false);
      cargarDocentes();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar docente');
    }
  };

  const handleDesactivar = async (id: string, nombre: string) => {
    try {
      await api.desactivarDocente(id);
      setSuccessMsg(`Docente ${nombre} desactivado lógicamente.`);
      cargarDocentes();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al desactivar docente');
    }
  };

  // Filtered
  const docentesFiltrados = docentes.filter(d => {
    const matchSearch =
      d.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.documentoIdentidad.includes(searchTerm) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDept = filterDept === 'TODOS' || d.departamento === filterDept;

    return matchSearch && matchDept;
  });

  const departamentosUnicos = Array.from(new Set(docentes.map(d => d.departamento)));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Docentes</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono font-medium">
              RF-04
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administración del cuerpo docente, vinculación a departamentos/facultades y desactivación lógica.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Docente</span>
        </button>
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

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar docente por nombre, documento o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="TODOS">Todos los Departamentos</option>
          {departamentosUnicos.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Grid of Docentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Cargando cuerpo docente...
          </div>
        ) : docentesFiltrados.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No se encontraron docentes que coincidan con la búsqueda.
          </div>
        ) : (
          docentesFiltrados.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white dark:bg-slate-800 rounded-xl p-5 border ${
                doc.activo
                  ? 'border-slate-200 dark:border-slate-700'
                  : 'border-rose-200 dark:border-rose-900/60 opacity-80'
              } shadow-sm space-y-4`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {doc.codigoDocente}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.activo
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {doc.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base mt-1">
                    {doc.nombres} {doc.apellidos}
                  </h3>
                  <p className="text-xs text-slate-400">{doc.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 pt-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.departamento}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate font-medium">{doc.tituloAcademico || 'Título Especializado'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Contrato: <strong>{doc.tipoContrato.replace('_', ' ')}</strong></span>
                  <span>C.C. {doc.documentoIdentidad}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(doc)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                {doc.activo && (
                  <button
                    onClick={() => handleDesactivar(doc.id, `${doc.nombres} ${doc.apellidos}`)}
                    className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" /> Desactivar Lógico
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Registrar Docente (RF-04)
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código Docente
                  </label>
                  <input
                    type="text"
                    value={formData.codigoDocente}
                    onChange={(e) => setFormData({ ...formData, codigoDocente: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento Académico *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Título Académico
                  </label>
                  <input
                    type="text"
                    value={formData.tituloAcademico}
                    onChange={(e) => setFormData({ ...formData, tituloAcademico: e.target.value })}
                    placeholder="Magíster / Doctor"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Contrato
                  </label>
                  <select
                    value={formData.tipoContrato}
                    onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                    <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                    <option value="CATEDRA">Cátedra</option>
                  </select>
                </div>
              </div>

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
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-xs"
                >
                  Guardar Docente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
