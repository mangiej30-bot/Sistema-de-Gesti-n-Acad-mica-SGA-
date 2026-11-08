/**
 * Data Transfer Objects (DTOs)
 * Implements RNF-11 (Privacidad y filtrado de datos sensibles en la capa de negocio)
 * and contract definitions for REST Controller Layer (Capa de Presentación / API Gateway)
 */

import { RolUsuario, HorarioSesion } from '../domain/models.ts';

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  expiresIn: number;
  usuario: UsuarioDto;
}

export interface UsuarioDto {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: RolUsuario;
  documentoIdentidad: string;
  perfilId?: string; // ID de Estudiante o Docente vinculado
}

export interface EstudianteDto {
  id: string;
  documentoIdentidad: string;
  codigoEstudiantil: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  programaId: string;
  programaNombre?: string;
  semestreActual: number;
  promedioAcumulado: number;
  estado: string;
}

export interface DocenteDto {
  id: string;
  documentoIdentidad: string;
  codigoDocente: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  departamento: string;
  facultad: string;
  tituloAcademico: string;
  tipoContrato: string;
  activo: boolean;
}

export interface GrupoDetalladoDto {
  id: string;
  codigo: string;
  asignaturaId: string;
  asignaturaCodigo: string;
  asignaturaNombre: string;
  creditos: number;
  periodoId: string;
  periodoCodigo: string;
  docenteId: string;
  docenteNombre: string;
  cupoMaximo: number;
  cupoOcupado: number;
  cuposDisponibles: number;
  horarios: HorarioSesion[];
  estado: string;
  modalidad: string;
}

export interface MatriculaResponseDto {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  grupoId: string;
  grupoCodigo: string;
  asignaturaNombre: string;
  periodoCodigo: string;
  fechaMatricula: string;
  estado: string;
  horarios: HorarioSesion[];
}

export interface RegistrarCalificacionDto {
  matriculaId: string;
  corte: 1 | 2 | 3;
  nota: number;
  observaciones?: string;
}

export interface CalificacionConsolidadaDto {
  matriculaId: string;
  estudianteId: string;
  codigoEstudiantil: string;
  nombreEstudiante: string;
  documentoIdentidad: string;
  asignaturaNombre: string;
  asignaturaCodigo: string;
  grupoCodigo: string;
  corte1?: number; // 30%
  corte2?: number; // 35%
  corte3?: number; // 35%
  notaFinal: number;
  estadoAprobacion: 'APROBADO' | 'REPROBADO' | 'EN_CURSO';
}

export interface ReporteConsolidadoDto {
  totalEstudiantesActivos: number;
  totalDocentesActivos: number;
  totalProgramas: number;
  totalGruposAbiertos: number;
  totalMatriculasActivas: number;
  promedioGeneralInstitucional: number;
  tasaAprobacionPorcentaje: number;
  distribucionPorFacultad: { facultad: string; cantidad: number }[];
  matriculasPorPrograma: { programa: string; matriculas: number }[];
}

export interface TraceabilityItemDto {
  id: string;
  codigo: string;
  tipo: 'RF' | 'RNF';
  titulo: string;
  descripcionCorta: string;
  capasInvolucradas: ('Presentación (React)' | 'Controladores / API' | 'Lógica de Negocio / Servicios' | 'Persistencia / Hibernate')[];
  componentes: string[];
  patronArquitectonico: string;
  estadoImplementacion: 'IMPLEMENTADO' | 'EN_PROCESO' | 'VALIDADO';
}
