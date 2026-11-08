/**
 * Audit Log View
 * Implements RF-12 (Bitácora inmutable de eventos críticos: logins, matrículas, notas, cambios).
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Clock,
  User,
  Database,
  FileCode,
  Shield,
  Activity,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { api } from '../services/api.ts';
import { AuditoriaLog } from '../backend/domain/models.ts';

export const AuditoriaView: React.FC = () => {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModulo, setFilterModulo] = useState('TODOS');
  const [selectedLog, setSelectedLog] = useState<AuditoriaLog | null>(null);

  const cargarLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditoria();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarLogs();
  }, []);

  const logsFiltrados = logs.filter(l => {
    const matchSearch =
      l.usuarioEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.datosModificados.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.registroAfectadoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.tipoAccion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchModulo = filterModulo === 'TODOS' || l.modulo === filterModulo;

    return matchSearch && matchModulo;
  });

  const getBadgeColor = (tipo: AuditoriaLog['tipoAccion']) => {
    switch (tipo) {
      case 'LOGIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'MATRICULA':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'CALIFICACION':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'CREACION':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
      case 'DESACTIVACION':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      case 'SEGURIDAD':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bitácora Inmutable de Auditoría</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-mono font-medium">
              RF-12
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro append-only de eventos críticos del sistema (usuario, fecha, acción, módulo y datos afectados).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Lock className="w-4 h-4 text-emerald-500" />
          <span>Tabla Inmutable (Sin UPDATE/DELETE)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o detalles técnicos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={filterModulo}
          onChange={(e) => setFilterModulo(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="TODOS">Todos los Módulos</option>
          <option value="AUTENTICACION">Autenticación</option>
          <option value="MATRICULAS">Matrículas</option>
          <option value="CALIFICACIONES">Calificaciones</option>
          <option value="ESTUDIANTES">Estudiantes</option>
          <option value="DOCENTES">Docentes</option>
          <option value="PROGRAMACION">Programación</option>
          <option value="CURRICULAR">Curricular</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3.5">Marca de Tiempo</th>
                <th className="px-4 py-3.5">Usuario & Rol</th>
                <th className="px-4 py-3.5">Acción</th>
                <th className="px-4 py-3.5">Módulo</th>
                <th className="px-4 py-3.5">Registro / Detalles</th>
                <th className="px-4 py-3.5 text-right">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {logsFiltrados.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition text-xs">
                  <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {log.usuarioEmail}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{log.usuarioRol} • {log.ipAddress}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${getBadgeColor(log.tipoAccion)}`}>
                      {log.tipoAccion}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {log.modulo}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-300">
                    {log.datosModificados}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
                    >
                      Inspeccionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle de Auditoría */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Registro Inmutable de Auditoría
            </h2>
            <p className="text-xs text-slate-400 font-mono mb-4">ID: {selectedLog.id}</p>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block">Marca de Tiempo (ISO-8601):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedLog.timestamp}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Usuario:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.usuarioEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Rol / IP:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.usuarioRol} ({selectedLog.ipAddress})</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Registro Afectado:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedLog.registroAfectadoId}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Carga Modificada (Payload):</span>
                <div className="p-2.5 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed break-words">
                  {selectedLog.datosModificados}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
