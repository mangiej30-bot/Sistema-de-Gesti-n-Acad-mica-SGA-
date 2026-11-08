/**
 * Domain Models for Academic Management System (SIGA)
 * Represents the persistent entity model (Hibernate / JPA Entities)
 */

export type RolUsuario = 'ADMIN' | 'COORDINADOR' | 'DOCENTE' | 'ESTUDIANTE';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  documentoIdentidad: string;
  telefono: string;
  rol: RolUsuario;
  activo: boolean;
  passwordHash: string; // Simulando hash bcrypt/Argon2id (RNF-01)
  ultimoAcceso?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Estudiante {
  id: string;
  usuarioId: string;
  documentoIdentidad: string;
  codigoEstudiantil: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  programaId: string;
  semestreActual: number;
  promedioAcumulado: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'GRADUADO' | 'SUSPENDIDO';
  createdAt: string;
  updatedAt: string;
}

export interface Docente {
  id: string;
  usuarioId: string;
  documentoIdentidad: string;
  codigoDocente: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  departamento: string;
  facultad: string;
  tituloAcademico: string;
  tipoContrato: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'CATEDRA';
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramaAcademico {
  id: string;
  codigo: string;
  nombre: string;
  facultad: string;
  nivelFormacion: 'PREGRADO' | 'POSGRADO' | 'MAESTRIA' | 'DOCTORADO';
  totalCreditos: number;
  duracionSemestres: number;
  activo: boolean;
}

export interface Asignatura {
  id: string;
  codigo: string;
  nombre: string;
  programaId: string;
  creditos: number;
  semestreNivel: number;
  departamento: string;
  activo: boolean;
  descripcion?: string;
}

export interface PeriodoAcademico {
  id: string;
  codigo: string; // ej. 2026-1
  nombre: string; // ej. "Primer Periodo Académico 2026"
  fechaInicio: string;
  fechaFin: string;
  fechaInicioNotas: string;
  fechaCierreNotas: string;
  estado: 'CONFIGURACION' | 'ACTIVO' | 'CIERRE_TEMPORAL' | 'FINALIZADO';
  permiteCalificaciones: boolean;
}

export interface HorarioSesion {
  dia: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO';
  horaInicio: string; // HH:mm ej. "08:00"
  horaFin: string;    // HH:mm ej. "10:00"
  aula: string;       // ej. "Lab-301" o "Aula Virtual Zoom"
}

export interface Grupo {
  id: string;
  codigo: string; // ej. "SIS301-G1"
  asignaturaId: string;
  periodoId: string;
  docenteId: string;
  cupoMaximo: number;
  cupoOcupado: number;
  horarios: HorarioSesion[];
  estado: 'ABIERTO' | 'CERRADO' | 'CANCELADO';
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO';
}

export interface Matricula {
  id: string;
  estudianteId: string;
  grupoId: string;
  periodoId: string;
  asignaturaId: string;
  fechaMatricula: string;
  estado: 'CONFIRMADA' | 'CANCELADA';
  notaFinal?: number;
  aprobado?: boolean;
}

export interface CalificacionItem {
  id: string;
  matriculaId: string;
  estudianteId: string;
  grupoId: string;
  corte: 1 | 2 | 3; // Parcial 1 (30%), Parcial 2 (35%), Examen Final (35%)
  porcentaje: number;
  nota: number; // 0.0 - 5.0
  fechaRegistro: string;
  observaciones?: string;
}

export interface AuditoriaLog {
  id: string;
  usuarioId: string;
  usuarioEmail: string;
  usuarioRol: RolUsuario;
  timestamp: string;
  tipoAccion: 'LOGIN' | 'LOGOUT' | 'CREACION' | 'ACTUALIZACION' | 'DESACTIVACION' | 'MATRICULA' | 'CALIFICACION' | 'SEGURIDAD';
  modulo: 'AUTENTICACION' | 'ESTUDIANTES' | 'DOCENTES' | 'CURRICULAR' | 'PROGRAMACION' | 'MATRICULAS' | 'CALIFICACIONES' | 'SISTEMA';
  registroAfectadoId: string;
  datosModificados: string; // JSON String o descripción detallada
  ipAddress: string;
}
