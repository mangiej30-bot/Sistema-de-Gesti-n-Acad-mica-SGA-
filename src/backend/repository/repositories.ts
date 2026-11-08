/**
 * Repository Layer (simulates Spring Data JPA interfaces and Hibernate queries)
 * Provides CRUD methods, custom query finders, logical deletions, and indexed lookups (RF-11 / RNF-02)
 */

import { db } from './database.ts';
import {
  Usuario,
  Estudiante,
  Docente,
  ProgramaAcademico,
  Asignatura,
  PeriodoAcademico,
  Grupo,
  Matricula,
  CalificacionItem,
  AuditoriaLog
} from '../domain/models.ts';

export class UsuarioRepository {
  findByEmail(email: string): Usuario | undefined {
    return db.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findById(id: string): Usuario | undefined {
    return db.usuarios.find(u => u.id === id);
  }

  save(usuario: Usuario): Usuario {
    const idx = db.usuarios.findIndex(u => u.id === usuario.id);
    if (idx >= 0) {
      db.usuarios[idx] = { ...usuario, updatedAt: new Date().toISOString() };
      return db.usuarios[idx];
    } else {
      const nuevo = {
        ...usuario,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.usuarios.push(nuevo);
      return nuevo;
    }
  }
}

export class EstudianteRepository {
  findAll(soloActivos = false): Estudiante[] {
    if (soloActivos) {
      return db.estudiantes.filter(e => e.estado === 'ACTIVO');
    }
    return [...db.estudiantes];
  }

  findById(id: string): Estudiante | undefined {
    return db.estudiantes.find(e => e.id === id);
  }

  findByUsuarioId(usuarioId: string): Estudiante | undefined {
    return db.estudiantes.find(e => e.usuarioId === usuarioId);
  }

  findByDocumento(documento: string): Estudiante | undefined {
    return db.estudiantes.find(e => e.documentoIdentidad === documento);
  }

  findByCodigo(codigo: string): Estudiante | undefined {
    return db.estudiantes.find(e => e.codigoEstudiantil.toLowerCase() === codigo.toLowerCase());
  }

  save(estudiante: Estudiante): Estudiante {
    const idx = db.estudiantes.findIndex(e => e.id === estudiante.id);
    if (idx >= 0) {
      db.estudiantes[idx] = { ...estudiante, updatedAt: new Date().toISOString() };
      return db.estudiantes[idx];
    } else {
      const nuevo = {
        ...estudiante,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.estudiantes.push(nuevo);
      return nuevo;
    }
  }

  /**
   * Borrado lógico (RF-03): cambia estado a INACTIVO
   */
  desactivarLogico(id: string): boolean {
    const est = this.findById(id);
    if (!est) return false;
    est.estado = 'INACTIVO';
    est.updatedAt = new Date().toISOString();
    return true;
  }
}

export class DocenteRepository {
  findAll(soloActivos = false): Docente[] {
    if (soloActivos) {
      return db.docentes.filter(d => d.activo);
    }
    return [...db.docentes];
  }

  findById(id: string): Docente | undefined {
    return db.docentes.find(d => d.id === id);
  }

  findByUsuarioId(usuarioId: string): Docente | undefined {
    return db.docentes.find(d => d.usuarioId === usuarioId);
  }

  findByDocumento(documento: string): Docente | undefined {
    return db.docentes.find(d => d.documentoIdentidad === documento);
  }

  save(docente: Docente): Docente {
    const idx = db.docentes.findIndex(d => d.id === docente.id);
    if (idx >= 0) {
      db.docentes[idx] = { ...docente, updatedAt: new Date().toISOString() };
      return db.docentes[idx];
    } else {
      const nuevo = {
        ...docente,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.docentes.push(nuevo);
      return nuevo;
    }
  }

  /**
   * Borrado lógico (RF-04): cambia activo a false
   */
  desactivarLogico(id: string): boolean {
    const doc = this.findById(id);
    if (!doc) return false;
    doc.activo = false;
    doc.updatedAt = new Date().toISOString();
    return true;
  }
}

export class CurricularRepository {
  // Programas
  findAllProgramas(): ProgramaAcademico[] {
    return [...db.programas];
  }

  findProgramaById(id: string): ProgramaAcademico | undefined {
    return db.programas.find(p => p.id === id);
  }

  findProgramaByCodigo(codigo: string): ProgramaAcademico | undefined {
    return db.programas.find(p => p.codigo.toLowerCase() === codigo.toLowerCase());
  }

  savePrograma(programa: ProgramaAcademico): ProgramaAcademico {
    const idx = db.programas.findIndex(p => p.id === programa.id);
    if (idx >= 0) {
      db.programas[idx] = programa;
      return db.programas[idx];
    }
    db.programas.push(programa);
    return programa;
  }

  // Asignaturas
  findAllAsignaturas(): Asignatura[] {
    return [...db.asignaturas];
  }

  findAsignaturaById(id: string): Asignatura | undefined {
    return db.asignaturas.find(a => a.id === id);
  }

  findAsignaturaByCodigo(codigo: string): Asignatura | undefined {
    return db.asignaturas.find(a => a.codigo.toLowerCase() === codigo.toLowerCase());
  }

  findAsignaturasByPrograma(programaId: string): Asignatura[] {
    return db.asignaturas.filter(a => a.programaId === programaId);
  }

  saveAsignatura(asig: Asignatura): Asignatura {
    const idx = db.asignaturas.findIndex(a => a.id === asig.id);
    if (idx >= 0) {
      db.asignaturas[idx] = asig;
      return db.asignaturas[idx];
    }
    db.asignaturas.push(asig);
    return asig;
  }
}

export class ProgramacionRepository {
  // Periodos
  findAllPeriodos(): PeriodoAcademico[] {
    return [...db.periodos];
  }

  findPeriodoActivo(): PeriodoAcademico | undefined {
    return db.periodos.find(p => p.estado === 'ACTIVO');
  }

  findPeriodoById(id: string): PeriodoAcademico | undefined {
    return db.periodos.find(p => p.id === id);
  }

  savePeriodo(periodo: PeriodoAcademico): PeriodoAcademico {
    const idx = db.periodos.findIndex(p => p.id === periodo.id);
    if (idx >= 0) {
      db.periodos[idx] = periodo;
      return db.periodos[idx];
    }
    db.periodos.push(periodo);
    return periodo;
  }

  // Grupos
  findAllGrupos(periodoId?: string): Grupo[] {
    if (periodoId) {
      return db.grupos.filter(g => g.periodoId === periodoId);
    }
    return [...db.grupos];
  }

  findGrupoById(id: string): Grupo | undefined {
    return db.grupos.find(g => g.id === id);
  }

  findGruposByDocente(docenteId: string, periodoId?: string): Grupo[] {
    return db.grupos.filter(g => {
      const matchDoc = g.docenteId === docenteId;
      return periodoId ? matchDoc && g.periodoId === periodoId : matchDoc;
    });
  }

  findGruposByAsignatura(asignaturaId: string, periodoId?: string): Grupo[] {
    return db.grupos.filter(g => {
      const matchAsig = g.asignaturaId === asignaturaId;
      return periodoId ? matchAsig && g.periodoId === periodoId : matchAsig;
    });
  }

  saveGrupo(grupo: Grupo): Grupo {
    const idx = db.grupos.findIndex(g => g.id === grupo.id);
    if (idx >= 0) {
      db.grupos[idx] = grupo;
      return db.grupos[idx];
    }
    db.grupos.push(grupo);
    return grupo;
  }
}

export class MatriculaRepository {
  findAll(): Matricula[] {
    return [...db.matriculas];
  }

  findById(id: string): Matricula | undefined {
    return db.matriculas.find(m => m.id === id);
  }

  findByEstudianteAndPeriodo(estudianteId: string, periodoId: string): Matricula[] {
    return db.matriculas.filter(m => m.estudianteId === estudianteId && m.periodoId === periodoId && m.estado === 'CONFIRMADA');
  }

  findByGrupo(grupoId: string): Matricula[] {
    return db.matriculas.filter(m => m.grupoId === grupoId && m.estado === 'CONFIRMADA');
  }

  findMatriculaExistente(estudianteId: string, asignaturaId: string, periodoId: string): Matricula | undefined {
    return db.matriculas.find(m =>
      m.estudianteId === estudianteId &&
      m.asignaturaId === asignaturaId &&
      m.periodoId === periodoId &&
      m.estado === 'CONFIRMADA'
    );
  }

  save(matricula: Matricula): Matricula {
    const idx = db.matriculas.findIndex(m => m.id === matricula.id);
    if (idx >= 0) {
      db.matriculas[idx] = matricula;
      return db.matriculas[idx];
    }
    db.matriculas.push(matricula);
    return matricula;
  }
}

export class CalificacionRepository {
  findByMatricula(matriculaId: string): CalificacionItem[] {
    return db.calificaciones.filter(c => c.matriculaId === matriculaId);
  }

  findByGrupo(grupoId: string): CalificacionItem[] {
    return db.calificaciones.filter(c => c.grupoId === grupoId);
  }

  findByEstudiante(estudianteId: string): CalificacionItem[] {
    return db.calificaciones.filter(c => c.estudianteId === estudianteId);
  }

  save(item: CalificacionItem): CalificacionItem {
    const idx = db.calificaciones.findIndex(c => c.matriculaId === item.matriculaId && c.corte === item.corte);
    if (idx >= 0) {
      db.calificaciones[idx] = item;
      return db.calificaciones[idx];
    }
    db.calificaciones.push(item);
    return item;
  }
}

export class AuditoriaRepository {
  findAll(limit = 100): AuditoriaLog[] {
    return [...db.auditoriaLogs].reverse().slice(0, limit);
  }

  save(log: AuditoriaLog): AuditoriaLog {
    db.auditoriaLogs.push(log);
    return log;
  }
}
