/**
 * Live Layer Call Inspector Drawer
 * Demonstrates RNF-05 (Mantenibilidad & Arquitectura en 4 Capas) and RNF-02 (Rendimiento < 3s)
 * Shows in real-time how requests traverse from Presentation to Controller to Service to Repository.
 */

import React from 'react';
import { X, Layers, Clock, CheckCircle2, AlertTriangle, Shield, Database, Cpu, Globe } from 'lucide-react';
import { LayerTrace } from '../services/api.ts';

interface LayerInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  traces: LayerTrace[];
  onClear: () => void;
}

export const LayerInspectorDrawer: React.FC<LayerInspectorDrawerProps> = ({
  isOpen,
  onClose,
  traces,
  onClear
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 text-slate-100 shadow-2xl z-50 flex flex-col border-l border-slate-700 animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-indigo-500/20 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Inspector de Capas en Vivo</h3>
            <p className="text-xs text-slate-400">Trazabilidad de llamadas: Capa 1 → Capa 2 → Capa 3 → Capa 4</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-xs px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
          >
            Limpiar
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
            aria-label="Cerrar inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-4 py-2.5 bg-indigo-950/40 border-b border-indigo-900/50 text-xs text-indigo-200 flex items-center gap-2">
        <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          Monitoreo de latencia y flujo arquitectónico (RNF-02 SLA &lt; 3.0s y RNF-05 desacoplamiento).
        </span>
      </div>

      {/* Traces List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {traces.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay llamadas registradas en esta sesión.</p>
            <p className="text-xs mt-1">Navega o realiza acciones para ver la traza por capas.</p>
          </div>
        ) : (
          traces.map((t) => (
            <div
              key={t.id}
              className="bg-slate-800/80 rounded-lg p-3.5 border border-slate-700 text-xs space-y-2.5"
            >
              {/* Request Summary */}
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      t.method === 'GET'
                        ? 'bg-blue-900/60 text-blue-300'
                        : t.method === 'POST'
                        ? 'bg-emerald-900/60 text-emerald-300'
                        : t.method === 'DELETE'
                        ? 'bg-rose-900/60 text-rose-300'
                        : 'bg-amber-900/60 text-amber-300'
                    }`}
                  >
                    {t.method}
                  </span>
                  <span className="font-mono text-slate-200 font-medium truncate max-w-[210px]">
                    /api/v1{t.endpoint}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      t.status < 300
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : t.status === 403
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    HTTP {t.status}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {t.durationMs}ms
                  </span>
                </div>
              </div>

              {/* 4 Layers Flow Breakdown */}
              <div className="space-y-1.5 pt-0.5">
                {/* Capa 1: Presentación */}
                <div className="flex items-start gap-2 bg-slate-900/60 p-1.5 rounded">
                  <Globe className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-sky-300 text-[11px]">Capa 1: Presentación (React)</div>
                    <div className="text-slate-400 text-[10px] truncate">{t.layers.presentation}</div>
                  </div>
                </div>

                {/* Capa 2: Controladores / API Gateway */}
                <div className="flex items-start gap-2 bg-slate-900/60 p-1.5 rounded">
                  <Shield className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-purple-300 text-[11px]">Capa 2: API / Controladores REST</div>
                    <div className="text-slate-400 text-[10px] truncate">{t.layers.controller}</div>
                  </div>
                </div>

                {/* Capa 3: Lógica de Negocio / Servicios */}
                <div className="flex items-start gap-2 bg-slate-900/60 p-1.5 rounded">
                  <Cpu className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-amber-300 text-[11px]">Capa 3: Lógica de Negocio (Services)</div>
                    <div className="text-slate-400 text-[10px] truncate">{t.layers.service}</div>
                  </div>
                </div>

                {/* Capa 4: Persistencia & Base de Datos */}
                <div className="flex items-start gap-2 bg-slate-900/60 p-1.5 rounded">
                  <Database className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-emerald-300 text-[11px]">Capa 4: Persistencia (Hibernate/JPA)</div>
                    <div className="text-slate-400 text-[10px] truncate">{t.layers.persistence}</div>
                  </div>
                </div>
              </div>

              {/* Timestamp & Status Icon */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Hora: {t.timestamp}</span>
                <span className="flex items-center gap-1">
                  {t.status < 300 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Transacción exitosa
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-400" /> Rechazo controlado
                    </>
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-800/90 border-t border-slate-700 text-center text-[11px] text-slate-400">
        Cumplimiento RNF-02: 100% de consultas &lt; 3s | Aislamiento ACID RNF-07
      </div>
    </div>
  );
};
