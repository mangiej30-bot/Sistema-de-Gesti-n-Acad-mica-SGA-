/**
 * Login Screen & Credential Authenticator
 * Implements RF-01 (Autenticación mediante credenciales individuales, JWT stateless)
 * and RNF-01 (Protección de contraseñas con hash fuerte Argon2id / bcrypt).
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.ts';
import { UsuarioDto } from '../backend/dto/dtos.ts';

interface LoginModalProps {
  onSuccess: (user: UsuarioDto) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('admin@universidad.edu.co');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      onSuccess(res.usuario);
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('123456');
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(presetEmail, '123456');
      onSuccess(res.usuario);
    } catch (err: any) {
      setError(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight font-mono">SIGA</h1>
          <p className="text-xs text-slate-400">
            Sistema Integral de Gestión Académica • Arquitectura en 4 Capas
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Identificador o Correo Institucional (RF-01)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@universidad.edu.co"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500">
              <span>Hash Argon2id / bcrypt verificado (RNF-01)</span>
              <span>Demo: 123456</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Autenticando...' : 'Iniciar Sesión (Emisión JWT)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Role Tester Buttons (RF-02) */}
        <div className="border-t border-slate-800 pt-4 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 block text-center uppercase tracking-wider">
            Acceso Rápido por Rol para Pruebas (RBAC)
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('admin@universidad.edu.co')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 text-left cursor-pointer transition"
            >
              <div className="font-bold">Administrador</div>
              <div className="text-[10px] text-slate-400 truncate">Carlos Mendoza</div>
            </button>

            <button
              onClick={() => handleQuickLogin('coordinador.sistemas@universidad.edu.co')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 text-left cursor-pointer transition"
            >
              <div className="font-bold">Coordinador</div>
              <div className="text-[10px] text-slate-400 truncate">Elena Ramos</div>
            </button>

            <button
              onClick={() => handleQuickLogin('jortiz@universidad.edu.co')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-left cursor-pointer transition"
            >
              <div className="font-bold">Docente</div>
              <div className="text-[10px] text-slate-400 truncate">Javier Ortiz</div>
            </button>

            <button
              onClick={() => handleQuickLogin('mateo.gomez@estudiante.edu.co')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-left cursor-pointer transition"
            >
              <div className="font-bold">Estudiante</div>
              <div className="text-[10px] text-slate-400 truncate">Mateo Gómez</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
