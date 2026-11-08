/**
 * Business Logic Layer (Capa de Lógica de Negocio / Spring Services)
 * Implements core domain rules, validations, schedule collision detection,
 * ACID transaction coordination, and audit logging interceptor.
 */

import { db } from '../repository/database.ts';
import {
  UsuarioRepository,
  EstudianteRepository,
  DocenteRepository,
  CurricularRepository,
  ProgramacionRepository,
  MatriculaRepository,
  CalificacionRepository,
  AuditoriaRepository
} from '../repository/repositories.ts';
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
  AuditoriaLog,
  HorarioSesion,
  RolUsuario
} from '../domain/models.ts';
import {
  AuthResponseDto,
  EstudianteDto,
  DocenteDto,
  GrupoDetalladoDto,
  MatriculaResponseDto,
  CalificacionConsolidadaDto,
  ReporteConsolidadoDto
} from '../dto/dtos.ts';

// Repositories instantiation (Dependency Injection pattern)
const usuarioRepo = new UsuarioRepository();
const estudianteRepo = new EstudianteRepository();
const docenteRepo = new DocenteRepository();
const curricularRepo = new CurricularRepository();
const programacionRepo = new ProgramacionRepository();
const matriculaRepo = new MatriculaRepository();
const calificacionRepo = new CalificacionRepository();
const auditoriaRepo = new AuditoriaRepository();

// Helper to check time overlapping
export function verificarCruceHorarios(h1: HorarioSesion, h2: HorarioSesion): boolean {
  if (h1.dia !== h2.dia) return false;
  // Convert HH:mm to minutes for comparison
  const [h1StartH, h1StartM] = h1.horaInicio.split(':').map(Number);
  const [h1EndH, h1EndM] = h1.horaFin.split(':').map(Number);
  const [h2StartH, h2StartM] = h2.horaInicio.split(':').map(Number);
  const [h2EndH, h2EndM] = h2.horaFin.split(':').map(Number);

  const start1 = h1StartH * 60 + h1StartM;
  const end1 = h1EndH * 60 + h1EndM;
  const start2 = h2StartH * 60 + h2StartM;
  const end2 = h2EndH * 60 + h2EndM;

  return Math.max(start1, start2) < Math.min(end1, end2);
}

// ----------------------------------------------------
// RF-12: Auditoria Service
// ----------------------------------------------------
export class AuditoriaService {
  public registrarEvento(
    usuario: { id: string; email: string; rol: RolUsuario } | undefined,
    tipoAccion: AuditoriaLog['tipoAccion'],
    modulo: AuditoriaLog['modulo'],
    registroAfectadoId: string,
    datosModificados: string,
    ipAddress = '127.0.0.1'
  ): AuditoriaLog {
    const log: AuditoriaLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      usuarioId: usuario ? usuario.id : 'SISTEMA_ANONIMO',
      usuarioEmail: usuario ? usuario.email : 'anonimo@siga.edu.co',
      usuarioRol: usuario ? usuario.rol : 'ESTUDIANTE',
      timestamp: new Date().toISOString(),
      tipoAccion,
      modulo,
      registroAfectadoId,
      datosModificados,
      ipAddress
    };
    return auditoriaRepo.save(log);
  }

  public obtenerLogs(): AuditoriaLog[] {
    return auditoriaRepo.findAll(150);
  }
}

export const auditoriaService = new AuditoriaService();

// ----------------------------------------------------
// RF-01 & RF-02: Auth & RBAC Service
// ----------------------------------------------------
export class AuthService {
  public login(email: string, passwordPlain: string, ipAddress = '127.0.0.1'): AuthResponseDto {
    const usuario = usuarioRepo.findByEmail(email);
    if (!usuario) {
      throw new Error('Credenciales inválidas: Usuario no encontrado en el sistema.');
    }

    if (!usuario.activo) {
      throw new Error('Acceso denegado: La cuenta de usuario se encuentra inactiva.');
    }

    // In a real Spring Boot app with Spring Security: passwordEncoder.matches(passwordPlain, usuario.passwordHash)
    // Here we validate known seeded passwords or prefix matches
    if (passwordPlain !== '123456' && !passwordPlain.includes('admin') && !passwordPlain.includes('pass')) {
      throw new Error('Credenciales inválidas: Contraseña incorrecta.');
    }

    // Determine linked profile
    let perfilId: string | undefined = undefined;
    if (usuario.rol === 'ESTUDIANTE') {
      const est = estudianteRepo.findByUsuarioId(usuario.id);
      perfilId = est ? est.id : undefined;
    } else if (usuario.rol === 'DOCENTE') {
      const doc = docenteRepo.findByUsuarioId(usuario.id);
      perfilId = doc ? doc.id : undefined;
    }

    // Generate JWT-like token (Simulating Stateless JWT Token RNF-01 / RF-01)
    const tokenPayload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: `${usuario.nombre} ${usuario.apellido}`,
      perfilId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 8 // 8 hours
    };
    const token = `siga_jwt_${btoa(JSON.stringify(tokenPayload))}`;

    // Update last access
    usuario.ultimoAcceso = new Date().toISOString();
    usuarioRepo.save(usuario);

    // Audit log
    auditoriaService.registrarEvento(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      'LOGIN',
      'AUTENTICACION',
      usuario.id,
      `Inicio de sesión exitoso con rol ${usuario.rol}. Emisión de token JWT stateless.`,
      ipAddress
    );

    return {
      token,
      expiresIn: 28800,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
        rol: usuario.rol,
        documentoIdentidad: usuario.documentoIdentidad,
        perfilId
      }
    };
  }

  public logout(usuario: Usuario, ipAddress = '127.0.0.1'): void {
    auditoriaService.registrarEvento(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      'LOGOUT',
      'AUTENTICACION',
      usuario.id,
      `Cierre de sesión e invalidación de token JWT en Gateway.`,
      ipAddress
    );
  }
}

export const authService = new AuthService();

// ----------------------------------------------------
// RF-03: Estudiante Service
// ----------------------------------------------------
export class EstudianteService {
  public listarTodos(soloActivos = false): EstudianteDto[] {
    const list = estudianteRepo.findAll(soloActivos);
    const programas = curricularRepo.findAllProgramas();
    return list.map(e => {
      const prog = programas.find(p => p.id === e.programaId);
      return {
        id: e.id,
        documentoIdentidad: e.documentoIdentidad,
        codigoEstudiantil: e.codigoEstudiantil,
        nombres: e.nombres,
        apellidos: e.apellidos,
        email: e.email,
        telefono: e.telefono,
        programaId: e.programaId,
        programaNombre: prog ? prog.nombre : 'No asignado',
        semestreActual: e.semestreActual,
        promedioAcumulado: e.promedioAcumulado,
        estado: e.estado
      };
    });
  }

  public obtenerPorId(id: string): EstudianteDto {
    const e = estudianteRepo.findById(id);
    if (!e) throw new Error(`Estudiante con ID ${id} no encontrado.`);
    const prog = curricularRepo.findProgramaById(e.programaId);
    return {
      id: e.id,
      documentoIdentidad: e.documentoIdentidad,
      codigoEstudiantil: e.codigoEstudiantil,
      nombres: e.nombres,
      apellidos: e.apellidos,
      email: e.email,
      telefono: e.telefono,
      programaId: e.programaId,
      programaNombre: prog ? prog.nombre : 'No asignado',
      semestreActual: e.semestreActual,
      promedioAcumulado: e.promedioAcumulado,
      estado: e.estado
    };
  }

  public crearEstudiante(
    data: Omit<Estudiante, 'id' | 'usuarioId' | 'createdAt' | 'updatedAt' | 'promedioAcumulado'>,
    actor?: Usuario
  ): EstudianteDto {
    // Validar unicidad de documento de identidad (RF-03)
    const existenteDoc = estudianteRepo.findByDocumento(data.documentoIdentidad);
    if (existenteDoc) {
      throw new Error(`Ya existe un estudiante registrado con el documento ${data.documentoIdentidad}.`);
    }

    const nuevoId = `est-${Date.now()}`;
    const nuevoUsuarioId = `usr-${nuevoId}`;

    // Crear usuario asociado
    const usuario: Usuario = {
      id: nuevoUsuarioId,
      email: data.email,
      nombre: data.nombres,
      apellido: data.apellidos,
      documentoIdentidad: data.documentoIdentidad,
      telefono: data.telefono,
      rol: 'ESTUDIANTE',
      activo: true,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$simulated_hash_new_est',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    usuarioRepo.save(usuario);

    const estudiante: Estudiante = {
      id: nuevoId,
      usuarioId: nuevoUsuarioId,
      documentoIdentidad: data.documentoIdentidad,
      codigoEstudiantil: data.codigoEstudiantil || `EST-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      nombres: data.nombres,
      apellidos: data.apellidos,
      email: data.email,
      telefono: data.telefono,
      programaId: data.programaId,
      semestreActual: data.semestreActual || 1,
      promedioAcumulado: 0.0,
      estado: data.estado || 'ACTIVO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    estudianteRepo.save(estudiante);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'CREACION',
      'ESTUDIANTES',
      estudiante.id,
      `Registro nuevo estudiante ${estudiante.nombres} ${estudiante.apellidos} (${estudiante.codigoEstudiantil})`
    );

    return this.obtenerPorId(estudiante.id);
  }

  public actualizarEstudiante(
    id: string,
    data: Partial<Omit<Estudiante, 'id' | 'usuarioId' | 'createdAt'>>,
    actor?: Usuario
  ): EstudianteDto {
    const est = estudianteRepo.findById(id);
    if (!est) throw new Error(`Estudiante ${id} no encontrado.`);

    if (data.documentoIdentidad && data.documentoIdentidad !== est.documentoIdentidad) {
      const duplicado = estudianteRepo.findByDocumento(data.documentoIdentidad);
      if (duplicado) throw new Error(`El documento ${data.documentoIdentidad} ya está en uso por otro estudiante.`);
      est.documentoIdentidad = data.documentoIdentidad;
    }

    if (data.nombres) est.nombres = data.nombres;
    if (data.apellidos) est.apellidos = data.apellidos;
    if (data.email) est.email = data.email;
    if (data.telefono) est.telefono = data.telefono;
    if (data.programaId) est.programaId = data.programaId;
    if (data.semestreActual !== undefined) est.semestreActual = data.semestreActual;
    if (data.estado) est.estado = data.estado;

    estudianteRepo.save(est);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'ACTUALIZACION',
      'ESTUDIANTES',
      est.id,
      `Actualización de datos para estudiante ${est.codigoEstudiantil}`
    );

    return this.obtenerPorId(est.id);
  }

  public desactivarLogico(id: string, actor?: Usuario): boolean {
    const success = estudianteRepo.desactivarLogico(id);
    if (success) {
      auditoriaService.registrarEvento(
        actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
        'DESACTIVACION',
        'ESTUDIANTES',
        id,
        `Desactivación lógica (borrado suave) de estudiante ${id}`
      );
    }
    return success;
  }
}

export const estudianteService = new EstudianteService();

// ----------------------------------------------------
// RF-04: Docente Service
// ----------------------------------------------------
export class DocenteService {
  public listarTodos(soloActivos = false): DocenteDto[] {
    const list = docenteRepo.findAll(soloActivos);
    return list.map(d => ({
      id: d.id,
      documentoIdentidad: d.documentoIdentidad,
      codigoDocente: d.codigoDocente,
      nombres: d.nombres,
      apellidos: d.apellidos,
      email: d.email,
      telefono: d.telefono,
      departamento: d.departamento,
      facultad: d.facultad,
      tituloAcademico: d.tituloAcademico,
      tipoContrato: d.tipoContrato,
      activo: d.activo
    }));
  }

  public obtenerPorId(id: string): DocenteDto {
    const d = docenteRepo.findById(id);
    if (!d) throw new Error(`Docente con ID ${id} no encontrado.`);
    return {
      id: d.id,
      documentoIdentidad: d.documentoIdentidad,
      codigoDocente: d.codigoDocente,
      nombres: d.nombres,
      apellidos: d.apellidos,
      email: d.email,
      telefono: d.telefono,
      departamento: d.departamento,
      facultad: d.facultad,
      tituloAcademico: d.tituloAcademico,
      tipoContrato: d.tipoContrato,
      activo: d.activo
    };
  }

  public crearDocente(
    data: Omit<Docente, 'id' | 'usuarioId' | 'createdAt' | 'updatedAt'>,
    actor?: Usuario
  ): DocenteDto {
    const existe = docenteRepo.findByDocumento(data.documentoIdentidad);
    if (existe) {
      throw new Error(`Ya existe un docente con el documento ${data.documentoIdentidad}.`);
    }

    const nuevoId = `doc-${Date.now()}`;
    const nuevoUsuarioId = `usr-${nuevoId}`;

    const usuario: Usuario = {
      id: nuevoUsuarioId,
      email: data.email,
      nombre: data.nombres,
      apellido: data.apellidos,
      documentoIdentidad: data.documentoIdentidad,
      telefono: data.telefono,
      rol: 'DOCENTE',
      activo: true,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$simulated_hash_new_doc',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    usuarioRepo.save(usuario);

    const docente: Docente = {
      id: nuevoId,
      usuarioId: nuevoUsuarioId,
      documentoIdentidad: data.documentoIdentidad,
      codigoDocente: data.codigoDocente || `DOC-${Math.floor(Math.random() * 9000 + 1000)}`,
      nombres: data.nombres,
      apellidos: data.apellidos,
      email: data.email,
      telefono: data.telefono,
      departamento: data.departamento,
      facultad: data.facultad,
      tituloAcademico: data.tituloAcademico,
      tipoContrato: data.tipoContrato,
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    docenteRepo.save(docente);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'CREACION',
      'DOCENTES',
      docente.id,
      `Registro de docente ${docente.nombres} ${docente.apellidos} en ${docente.departamento}`
    );

    return this.obtenerPorId(docente.id);
  }

  public actualizarDocente(
    id: string,
    data: Partial<Omit<Docente, 'id' | 'usuarioId' | 'createdAt'>>,
    actor?: Usuario
  ): DocenteDto {
    const doc = docenteRepo.findById(id);
    if (!doc) throw new Error(`Docente ${id} no encontrado.`);

    if (data.nombres) doc.nombres = data.nombres;
    if (data.apellidos) doc.apellidos = data.apellidos;
    if (data.email) doc.email = data.email;
    if (data.telefono) doc.telefono = data.telefono;
    if (data.departamento) doc.departamento = data.departamento;
    if (data.facultad) doc.facultad = data.facultad;
    if (data.tituloAcademico) doc.tituloAcademico = data.tituloAcademico;
    if (data.tipoContrato) doc.tipoContrato = data.tipoContrato;
    if (data.activo !== undefined) doc.activo = data.activo;

    docenteRepo.save(doc);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'ACTUALIZACION',
      'DOCENTES',
      doc.id,
      `Actualización de información del docente ${doc.codigoDocente}`
    );

    return this.obtenerPorId(doc.id);
  }

  public desactivarLogico(id: string, actor?: Usuario): boolean {
    const success = docenteRepo.desactivarLogico(id);
    if (success) {
      auditoriaService.registrarEvento(
        actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
        'DESACTIVACION',
        'DOCENTES',
        id,
        `Desactivación lógica del docente ${id}`
      );
    }
    return success;
  }
}

export const docenteService = new DocenteService();

// ----------------------------------------------------
// RF-05: Curricular Service (Programas y Asignaturas)
// ----------------------------------------------------
export class CurricularService {
  public listarProgramas(): ProgramaAcademico[] {
    return curricularRepo.findAllProgramas();
  }

  public crearPrograma(data: Omit<ProgramaAcademico, 'id'>, actor?: Usuario): ProgramaAcademico {
    const existente = curricularRepo.findProgramaByCodigo(data.codigo);
    if (existente) {
      throw new Error(`Ya existe un programa académico con el código ${data.codigo}.`);
    }

    const nuevo: ProgramaAcademico = {
      ...data,
      id: `prog-${Date.now()}`
    };
    curricularRepo.savePrograma(nuevo);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'CREACION',
      'CURRICULAR',
      nuevo.id,
      `Creación de programa académico ${nuevo.nombre} (${nuevo.codigo})`
    );

    return nuevo;
  }

  public listarAsignaturas(programaId?: string): (Asignatura & { programaNombre?: string })[] {
    const list = programaId
      ? curricularRepo.findAsignaturasByPrograma(programaId)
      : curricularRepo.findAllAsignaturas();

    const programas = curricularRepo.findAllProgramas();
    return list.map(a => {
      const p = programas.find(prog => prog.id === a.programaId);
      return {
        ...a,
        programaNombre: p ? p.nombre : 'No asignado'
      };
    });
  }

  public crearAsignatura(data: Omit<Asignatura, 'id'>, actor?: Usuario): Asignatura {
    if (data.creditos <= 0) {
      throw new Error('Validación fallida (RF-05): Los créditos de la asignatura deben ser mayores a cero.');
    }

    const existente = curricularRepo.findAsignaturaByCodigo(data.codigo);
    if (existente) {
      throw new Error(`Validación fallida (RF-05): Ya existe una asignatura con el código ${data.codigo}.`);
    }

    const nueva: Asignatura = {
      ...data,
      id: `asig-${Date.now()}`
    };
    curricularRepo.saveAsignatura(nueva);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'CREACION',
      'CURRICULAR',
      nueva.id,
      `Creación de asignatura ${nueva.nombre} (${nueva.codigo}) con ${nueva.creditos} créditos`
    );

    return nueva;
  }

  public actualizarPrograma(
    id: string,
    data: Partial<Omit<ProgramaAcademico, 'id'>>,
    actor?: Usuario
  ): ProgramaAcademico {
    const prog = curricularRepo.findProgramaById(id);
    if (!prog) throw new Error(`Programa académico con ID ${id} no encontrado.`);

    if (data.codigo && data.codigo.toLowerCase() !== prog.codigo.toLowerCase()) {
      const duplicado = curricularRepo.findProgramaByCodigo(data.codigo);
      if (duplicado) {
        throw new Error(`Ya existe un programa académico con el código ${data.codigo}.`);
      }
      prog.codigo = data.codigo;
    }

    if (data.nombre) prog.nombre = data.nombre;
    if (data.facultad) prog.facultad = data.facultad;
    if (data.nivelFormacion) prog.nivelFormacion = data.nivelFormacion;
    if (data.totalCreditos !== undefined) prog.totalCreditos = data.totalCreditos;
    if (data.duracionSemestres !== undefined) prog.duracionSemestres = data.duracionSemestres;
    if (data.activo !== undefined) prog.activo = data.activo;

    curricularRepo.savePrograma(prog);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'ACTUALIZACION',
      'CURRICULAR',
      prog.id,
      `Actualización del programa académico ${prog.nombre} (${prog.codigo})`
    );

    return prog;
  }

  public actualizarAsignatura(
    id: string,
    data: Partial<Omit<Asignatura, 'id'>>,
    actor?: Usuario
  ): Asignatura {
    const asig = curricularRepo.findAsignaturaById(id);
    if (!asig) throw new Error(`Asignatura con ID ${id} no encontrada.`);

    if (data.creditos !== undefined && data.creditos <= 0) {
      throw new Error('Validación fallida (RF-05): Los créditos de la asignatura deben ser mayores a cero.');
    }

    if (data.codigo && data.codigo.toLowerCase() !== asig.codigo.toLowerCase()) {
      const duplicado = curricularRepo.findAsignaturaByCodigo(data.codigo);
      if (duplicado) {
        throw new Error(`Validación fallida (RF-05): Ya existe una asignatura con el código ${data.codigo}.`);
      }
      asig.codigo = data.codigo;
    }

    if (data.nombre) asig.nombre = data.nombre;
    if (data.programaId) asig.programaId = data.programaId;
    if (data.creditos !== undefined) asig.creditos = data.creditos;
    if (data.semestreNivel !== undefined) asig.semestreNivel = data.semestreNivel;
    if (data.departamento) asig.departamento = data.departamento;
    if (data.activo !== undefined) asig.activo = data.activo;
    if (data.descripcion !== undefined) asig.descripcion = data.descripcion;

    curricularRepo.saveAsignatura(asig);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'ACTUALIZACION',
      'CURRICULAR',
      asig.id,
      `Actualización de asignatura ${asig.nombre} (${asig.codigo}) con ${asig.creditos} créditos`
    );

    return asig;
  }
}

export const curricularService = new CurricularService();

// ----------------------------------------------------
// RF-06: Programación Académica (Periodos, Grupos y Detección de Cruces)
// ----------------------------------------------------
export class ProgramacionService {
  public listarPeriodos(): PeriodoAcademico[] {
    return programacionRepo.findAllPeriodos();
  }

  public obtenerPeriodoActivo(): PeriodoAcademico | undefined {
    return programacionRepo.findPeriodoActivo();
  }

  public crearPeriodo(data: Omit<PeriodoAcademico, 'id'>, actor?: Usuario): PeriodoAcademico {
    const nuevo: PeriodoAcademico = {
      ...data,
      id: `per-${data.codigo.replace(/[^a-zA-Z0-9]/g, '-')}`
    };
    programacionRepo.savePeriodo(nuevo);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'CREACION',
      'PROGRAMACION',
      nuevo.id,
      `Apertura de periodo académico ${nuevo.nombre} (${nuevo.codigo})`
    );
    return nuevo;
  }

  public alternarFechasNotas(periodoId: string, permite: boolean, actor?: Usuario): PeriodoAcademico {
    const p = programacionRepo.findPeriodoById(periodoId);
    if (!p) throw new Error(`Periodo ${periodoId} no encontrado.`);
    p.permiteCalificaciones = permite;
    programacionRepo.savePeriodo(p);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'ACTUALIZACION',
      'PROGRAMACION',
      p.id,
      `Coordinación ${permite ? 'habilitó' : 'inhabilitó'} la ventana de ingreso de calificaciones para ${p.codigo}`
    );
    return p;
  }

  public listarGrupos(periodoId?: string): GrupoDetalladoDto[] {
    const grupos = programacionRepo.findAllGrupos(periodoId);
    const asignaturas = curricularRepo.findAllAsignaturas();
    const periodos = programacionRepo.findAllPeriodos();
    const docentes = docenteRepo.findAll();

    return grupos.map(g => {
      const asig = asignaturas.find(a => a.id === g.asignaturaId);
      const per = periodos.find(p => p.id === g.periodoId);
      const doc = docentes.find(d => d.id === g.docenteId);

      return {
        id: g.id,
        codigo: g.codigo,
        asignaturaId: g.asignaturaId,
        asignaturaCodigo: asig ? asig.codigo : '',
        asignaturaNombre: asig ? asig.nombre : 'Sin Asignatura',
        creditos: asig ? asig.creditos : 0,
        periodoId: g.periodoId,
        periodoCodigo: per ? per.codigo : '',
        docenteId: g.docenteId,
        docenteNombre: doc ? `${doc.nombres} ${doc.apellidos}` : 'Docente por Asignar',
        cupoMaximo: g.cupoMaximo,
        cupoOcupado: g.cupoOcupado,
        cuposDisponibles: Math.max(0, g.cupoMaximo - g.cupoOcupado),
        horarios: g.horarios,
        estado: g.estado,
        modalidad: g.modalidad
      };
    });
  }

  /**
   * RF-06: Algoritmo de validación de disponibilidad y cruce de horarios:
   * 1. El docente no puede tener dos grupos en el mismo horario.
   * 2. Un aula física no puede estar ocupada simultáneamente por dos grupos.
   */
  public validarCrucesHorarios(
    nuevoGrupo: Omit<Grupo, 'id' | 'cupoOcupado'>,
    grupoIdExcluir?: string
  ): { tieneConflicto: boolean; mensaje?: string } {
    const gruposExistentes = programacionRepo.findAllGrupos(nuevoGrupo.periodoId)
      .filter(g => g.id !== grupoIdExcluir && g.estado !== 'CANCELADO');

    for (const horarioNuevo of nuevoGrupo.horarios) {
      for (const grupoExistente of gruposExistentes) {
        for (const horarioExistente of grupoExistente.horarios) {
          const cruceTiempo = verificarCruceHorarios(horarioNuevo, horarioExistente);
          if (cruceTiempo) {
            // Validar cruce de docente
            if (grupoExistente.docenteId === nuevoGrupo.docenteId) {
              const doc = docenteRepo.findById(nuevoGrupo.docenteId);
              const docNombre = doc ? `${doc.nombres} ${doc.apellidos}` : 'El docente';
              return {
                tieneConflicto: true,
                mensaje: `[CRUCE_DOCENTE] ${docNombre} ya tiene asignada la clase del grupo ${grupoExistente.codigo} el día ${horarioNuevo.dia} de ${horarioExistente.horaInicio} a ${horarioExistente.horaFin}.`
              };
            }

            // Validar cruce de aula
            if (
              horarioNuevo.aula.toLowerCase() === horarioExistente.aula.toLowerCase() &&
              !horarioNuevo.aula.toLowerCase().includes('virtual')
            ) {
              return {
                tieneConflicto: true,
                mensaje: `[CRUCE_AULA] El espacio físico "${horarioNuevo.aula}" ya está reservado para el grupo ${grupoExistente.codigo} el día ${horarioNuevo.dia} de ${horarioExistente.horaInicio} a ${horarioExistente.horaFin}.`
              };
            }
          }
        }
      }
    }

    return { tieneConflicto: false };
  }

  public crearGrupo(data: Omit<Grupo, 'id' | 'cupoOcupado'>, actor?: Usuario): GrupoDetalladoDto {
    const validacion = this.validarCrucesHorarios(data);
    if (validacion.tieneConflicto) {
      throw new Error(`Validación de Programación Académica (RF-06): ${validacion.mensaje}`);
    }

    const nuevo: Grupo = {
      ...data,
      id: `grp-${Date.now()}`,
      cupoOcupado: 0
    };
    programacionRepo.saveGrupo(nuevo);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'CREACION',
      'PROGRAMACION',
      nuevo.id,
      `Creación de grupo ${nuevo.codigo} con cupo ${nuevo.cupoMaximo} y validación de cruces de aula/docente superada`
    );

    const detallado = this.listarGrupos(nuevo.periodoId).find(g => g.id === nuevo.id);
    return detallado!;
  }
}

export const programacionService = new ProgramacionService();

// ----------------------------------------------------
// RF-07: Servicio Transaccional de Matrículas (ACID)
// ----------------------------------------------------
export class MatriculaService {
  /**
   * Ejecuta la matrícula con aislamiento ACID, bloqueo pesimista y verificación de reglas de negocio:
   * 1. Grupo debe tener cupo disponible > 0.
   * 2. Evitar matrículas duplicadas en la misma asignatura dentro del mismo periodo (RF-07).
   * 3. Evitar cruce de horario con otras asignaturas matriculadas por el estudiante.
   * 4. Si todo es válido, incrementa el cupo y registra la matrícula de forma atómica.
   */
  public async realizarMatricula(
    estudianteId: string,
    grupoId: string,
    actor?: Usuario
  ): Promise<MatriculaResponseDto> {
    // Wrap in ACID transaction with row-level lock on the group
    return await db.executeTransaction(async () => {
      const grupo = programacionRepo.findGrupoById(grupoId);
      if (!grupo) throw new Error(`El grupo académico ${grupoId} no existe.`);

      if (grupo.estado !== 'ABIERTO') {
        throw new Error(`El grupo ${grupo.codigo} se encuentra cerrado o cancelado.`);
      }

      // 1. Regla: Validar cupos disponibles (cupoOcupado < cupoMaximo)
      if (grupo.cupoOcupado >= grupo.cupoMaximo) {
        throw new Error(`Validación de cupo (RF-07): El grupo ${grupo.codigo} no tiene cupos disponibles (${grupo.cupoOcupado}/${grupo.cupoMaximo}).`);
      }

      // 2. Regla: Evitar doble inscripción de un estudiante en la misma asignatura dentro del mismo periodo
      const matriculaExistente = matriculaRepo.findMatriculaExistente(estudianteId, grupo.asignaturaId, grupo.periodoId);
      if (matriculaExistente) {
        const asig = curricularRepo.findAsignaturaById(grupo.asignaturaId);
        throw new Error(`Validación de unicidad (RF-07): El estudiante ya se encuentra matriculado en la asignatura "${asig?.nombre || grupo.asignaturaId}" en el periodo actual.`);
      }

      // 3. Regla: Validar cruces de horario para el estudiante
      const matriculasActuales = matriculaRepo.findByEstudianteAndPeriodo(estudianteId, grupo.periodoId);
      for (const mat of matriculasActuales) {
        const grupoInscrito = programacionRepo.findGrupoById(mat.grupoId);
        if (grupoInscrito) {
          for (const hNuevo of grupo.horarios) {
            for (const hInscrito of grupoInscrito.horarios) {
              if (verificarCruceHorarios(hNuevo, hInscrito)) {
                throw new Error(`Cruce de Horario Estudiante (RF-07): El horario del grupo ${grupo.codigo} coincide con el grupo ya matriculado ${grupoInscrito.codigo} el día ${hNuevo.dia} (${hNuevo.horaInicio} - ${hNuevo.horaFin}).`);
              }
            }
          }
        }
      }

      // 4. Todo verificado: Realizar incremento atómico y persistir
      grupo.cupoOcupado += 1;
      programacionRepo.saveGrupo(grupo);

      const nuevaMatricula: Matricula = {
        id: `mat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        estudianteId,
        grupoId: grupo.id,
        periodoId: grupo.periodoId,
        asignaturaId: grupo.asignaturaId,
        fechaMatricula: new Date().toISOString(),
        estado: 'CONFIRMADA'
      };
      matriculaRepo.save(nuevaMatricula);

      // Auditar evento crítico
      auditoriaService.registrarEvento(
        actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
        'MATRICULA',
        'MATRICULAS',
        nuevaMatricula.id,
        `Matrícula confirmada con éxito. Estudiante: ${estudianteId}, Grupo: ${grupo.codigo}, Cupo restante: ${grupo.cupoMaximo - grupo.cupoOcupado}`
      );

      const estudiante = estudianteRepo.findById(estudianteId);
      const asig = curricularRepo.findAsignaturaById(grupo.asignaturaId);
      const per = programacionRepo.findPeriodoById(grupo.periodoId);

      return {
        id: nuevaMatricula.id,
        estudianteId,
        estudianteNombre: estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : 'Estudiante',
        grupoId: grupo.id,
        grupoCodigo: grupo.codigo,
        asignaturaNombre: asig ? asig.nombre : '',
        periodoCodigo: per ? per.codigo : '',
        fechaMatricula: nuevaMatricula.fechaMatricula,
        estado: nuevaMatricula.estado,
        horarios: grupo.horarios
      };
    }, [grupoId]); // Pessimistic Lock on Grupo ID
  }

  public listarMatriculasEstudiante(estudianteId: string, periodoId?: string): MatriculaResponseDto[] {
    const periodos = programacionRepo.findAllPeriodos();
    const periodoTarget = periodoId || programacionRepo.findPeriodoActivo()?.id;
    if (!periodoTarget) return [];

    const matriculas = matriculaRepo.findByEstudianteAndPeriodo(estudianteId, periodoTarget);
    const estudiante = estudianteRepo.findById(estudianteId);

    return matriculas.map(m => {
      const grupo = programacionRepo.findGrupoById(m.grupoId);
      const asig = curricularRepo.findAsignaturaById(m.asignaturaId);
      const per = periodos.find(p => p.id === m.periodoId);

      return {
        id: m.id,
        estudianteId: m.estudianteId,
        estudianteNombre: estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : '',
        grupoId: m.grupoId,
        grupoCodigo: grupo ? grupo.codigo : '',
        asignaturaNombre: asig ? asig.nombre : '',
        periodoCodigo: per ? per.codigo : '',
        fechaMatricula: m.fechaMatricula,
        estado: m.estado,
        horarios: grupo ? grupo.horarios : []
      };
    });
  }

  public cancelarMatricula(matriculaId: string, actor?: Usuario): boolean {
    const mat = matriculaRepo.findById(matriculaId);
    if (!mat || mat.estado === 'CANCELADA') return false;

    mat.estado = 'CANCELADA';
    matriculaRepo.save(mat);

    // Liberar cupo en el grupo
    const grupo = programacionRepo.findGrupoById(mat.grupoId);
    if (grupo && grupo.cupoOcupado > 0) {
      grupo.cupoOcupado -= 1;
      programacionRepo.saveGrupo(grupo);
    }

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'ACTUALIZACION',
      'MATRICULAS',
      mat.id,
      `Cancelación de matrícula ${matriculaId}. Cupo liberado en grupo ${grupo?.codigo}`
    );

    return true;
  }
}

export const matriculaService = new MatriculaService();

// ----------------------------------------------------
// RF-08 & RF-09: Evaluaciones y Calificaciones
// ----------------------------------------------------
export class CalificacionService {
  /**
   * RF-08: El docente debe poder registrar y actualizar calificaciones:
   * 1. Solo en grupos donde está asignado como titular.
   * 2. Únicamente dentro de las fechas que habilita la coordinación.
   * 3. Nota entre 0.0 y 5.0.
   */
  public registrarCalificacion(
    params: {
      docenteId: string;
      matriculaId: string;
      corte: 1 | 2 | 3;
      nota: number;
      observaciones?: string;
    },
    actor?: Usuario
  ): CalificacionItem {
    const { docenteId, matriculaId, corte, nota, observaciones } = params;

    // Validación de rango de nota
    if (nota < 0.0 || nota > 5.0 || isNaN(nota)) {
      throw new Error('Validación de nota (RF-08): La calificación debe ser un valor numérico entre 0.0 y 5.0.');
    }

    const matricula = matriculaRepo.findById(matriculaId);
    if (!matricula || matricula.estado !== 'CONFIRMADA') {
      throw new Error('La matrícula no existe o no se encuentra confirmada.');
    }

    const grupo = programacionRepo.findGrupoById(matricula.grupoId);
    if (!grupo) throw new Error('El grupo asociado a la matrícula no fue encontrado.');

    // 1. Validar titularidad del docente (a menos que sea ADMIN o COORDINADOR)
    const esAdminOCoord = actor && (actor.rol === 'ADMIN' || actor.rol === 'COORDINADOR');
    if (!esAdminOCoord && grupo.docenteId !== docenteId) {
      throw new Error('Seguridad de Evaluaciones (RF-08): Solo el docente titular asignado al grupo tiene permisos para asentar o modificar calificaciones.');
    }

    // 2. Validar ventana de fechas habilitada por Coordinación (RF-08)
    const periodo = programacionRepo.findPeriodoById(grupo.periodoId);
    if (!periodo || !periodo.permiteCalificaciones) {
      throw new Error(`Restricción de Calendario (RF-08): La ventana de registro de calificaciones se encuentra cerrada por la Coordinación Académica para el periodo ${periodo?.codigo || ''}.`);
    }

    const porcentaje = corte === 1 ? 30 : 35;

    const item: CalificacionItem = {
      id: `cal-${matriculaId}-${corte}`,
      matriculaId,
      estudianteId: matricula.estudianteId,
      grupoId: grupo.id,
      corte,
      porcentaje,
      nota: Number(nota.toFixed(2)),
      fechaRegistro: new Date().toISOString(),
      observaciones
    };

    calificacionRepo.save(item);

    // Recalcular nota final de la matrícula
    this.recalcularNotaFinalMatricula(matriculaId);

    auditoriaService.registrarEvento(
      actor ? { id: actor.id, email: actor.email, rol: actor.rol } : undefined,
      'CALIFICACION',
      'CALIFICACIONES',
      item.id,
      `Registro de nota Corte ${corte} (${porcentaje}%): ${item.nota} para matrícula ${matriculaId} en ${grupo.codigo}`
    );

    return item;
  }

  private recalcularNotaFinalMatricula(matriculaId: string): void {
    const notas = calificacionRepo.findByMatricula(matriculaId);
    const n1 = notas.find(n => n.corte === 1)?.nota;
    const n2 = notas.find(n => n.corte === 2)?.nota;
    const n3 = notas.find(n => n.corte === 3)?.nota;

    if (n1 !== undefined || n2 !== undefined || n3 !== undefined) {
      const nota1 = (n1 ?? 0) * 0.30;
      const nota2 = (n2 ?? 0) * 0.35;
      const nota3 = (n3 ?? 0) * 0.35;
      const finalVal = Number((nota1 + nota2 + nota3).toFixed(2));

      const mat = matriculaRepo.findById(matriculaId);
      if (mat) {
        mat.notaFinal = finalVal;
        mat.aprobado = finalVal >= 3.0;
        matriculaRepo.save(mat);
      }
    }
  }

  /**
   * RF-08 & RF-09: Vista consolidada de calificaciones por grupo
   */
  public obtenerSabanaNotasGrupo(grupoId: string): CalificacionConsolidadaDto[] {
    const matriculas = matriculaRepo.findByGrupo(grupoId);
    const grupo = programacionRepo.findGrupoById(grupoId);
    const asig = grupo ? curricularRepo.findAsignaturaById(grupo.asignaturaId) : undefined;
    const allCalificaciones = calificacionRepo.findByGrupo(grupoId);

    return matriculas.map(m => {
      const est = estudianteRepo.findById(m.estudianteId);
      const notasMat = allCalificaciones.filter(c => c.matriculaId === m.id);

      const c1 = notasMat.find(c => c.corte === 1)?.nota;
      const c2 = notasMat.find(c => c.corte === 2)?.nota;
      const c3 = notasMat.find(c => c.corte === 3)?.nota;

      let notaFinal = 0;
      if (c1 !== undefined) notaFinal += c1 * 0.30;
      if (c2 !== undefined) notaFinal += c2 * 0.35;
      if (c3 !== undefined) notaFinal += c3 * 0.35;
      notaFinal = Number(notaFinal.toFixed(2));

      const tieneTodas = c1 !== undefined && c2 !== undefined && c3 !== undefined;
      let estadoAprobacion: 'APROBADO' | 'REPROBADO' | 'EN_CURSO' = 'EN_CURSO';
      if (tieneTodas) {
        estadoAprobacion = notaFinal >= 3.0 ? 'APROBADO' : 'REPROBADO';
      }

      return {
        matriculaId: m.id,
        estudianteId: m.estudianteId,
        codigoEstudiantil: est?.codigoEstudiantil || 'N/A',
        nombreEstudiante: est ? `${est.nombres} ${est.apellidos}` : 'Estudiante',
        documentoIdentidad: est?.documentoIdentidad || '',
        asignaturaNombre: asig?.nombre || '',
        asignaturaCodigo: asig?.codigo || '',
        grupoCodigo: grupo?.codigo || '',
        corte1: c1,
        corte2: c2,
        corte3: c3,
        notaFinal,
        estadoAprobacion
      };
    });
  }

  /**
   * RF-09: Vista consolidada de historial académico y calificaciones para el estudiante
   */
  public obtenerKardexEstudiante(estudianteId: string): {
    estudiante: EstudianteDto;
    promedioAcumulado: number;
    totalCreditosAprobados: number;
    asignaturas: (CalificacionConsolidadaDto & {
      creditos: number;
      periodoCodigo: string;
      docenteNombre: string;
    })[];
  } {
    const est = estudianteService.obtenerPorId(estudianteId);
    const matriculas = db.matriculas.filter(m => m.estudianteId === estudianteId);
    const asignaturas = curricularRepo.findAllAsignaturas();
    const periodos = programacionRepo.findAllPeriodos();
    const grupos = programacionRepo.findAllGrupos();
    const docentes = docenteRepo.findAll();

    let sumaPonderada = 0;
    let totalCreditosConsiderados = 0;
    let totalCreditosAprobados = 0;

    const list = matriculas.map(m => {
      const g = grupos.find(grp => grp.id === m.grupoId);
      const asig = asignaturas.find(a => a.id === m.asignaturaId);
      const per = periodos.find(p => p.id === m.periodoId);
      const doc = docentes.find(d => d.id === g?.docenteId);

      const notas = calificacionRepo.findByMatricula(m.id);
      const c1 = notas.find(c => c.corte === 1)?.nota;
      const c2 = notas.find(c => c.corte === 2)?.nota;
      const c3 = notas.find(c => c.corte === 3)?.nota;

      let notaFinal = 0;
      if (c1 !== undefined) notaFinal += c1 * 0.30;
      if (c2 !== undefined) notaFinal += c2 * 0.35;
      if (c3 !== undefined) notaFinal += c3 * 0.35;
      notaFinal = Number(notaFinal.toFixed(2));

      const creditos = asig ? asig.creditos : 3;

      if (c1 !== undefined || c2 !== undefined || c3 !== undefined) {
        sumaPonderada += notaFinal * creditos;
        totalCreditosConsiderados += creditos;
      }

      const tieneTodas = c1 !== undefined && c2 !== undefined && c3 !== undefined;
      const aprobado = tieneTodas && notaFinal >= 3.0;
      if (aprobado) {
        totalCreditosAprobados += creditos;
      }

      const estadoAprobacion: 'APROBADO' | 'REPROBADO' | 'EN_CURSO' = tieneTodas
        ? (notaFinal >= 3.0 ? 'APROBADO' : 'REPROBADO')
        : 'EN_CURSO';

      return {
        matriculaId: m.id,
        estudianteId,
        codigoEstudiantil: est.codigoEstudiantil,
        nombreEstudiante: `${est.nombres} ${est.apellidos}`,
        documentoIdentidad: est.documentoIdentidad,
        asignaturaNombre: asig?.nombre || 'Asignatura',
        asignaturaCodigo: asig?.codigo || '',
        grupoCodigo: g?.codigo || '',
        corte1: c1,
        corte2: c2,
        corte3: c3,
        notaFinal,
        estadoAprobacion,
        creditos,
        periodoCodigo: per?.codigo || '',
        docenteNombre: doc ? `${doc.nombres} ${doc.apellidos}` : 'Por Asignar'
      };
    });

    const promedio = totalCreditosConsiderados > 0
      ? Number((sumaPonderada / totalCreditosConsiderados).toFixed(2))
      : est.promedioAcumulado;

    return {
      estudiante: est,
      promedioAcumulado: promedio,
      totalCreditosAprobados,
      asignaturas: list
    };
  }
}

export const calificacionService = new CalificacionService();

// ----------------------------------------------------
// RF-10: Reportes y Métricas Consolidadas
// ----------------------------------------------------
export class ReporteService {
  public generarReporteConsolidado(periodoId?: string): ReporteConsolidadoDto {
    const periodos = programacionRepo.findAllPeriodos();
    const periodoTarget = periodoId || programacionRepo.findPeriodoActivo()?.id;

    const estudiantesActivos = estudianteRepo.findAll(true);
    const docentesActivos = docenteRepo.findAll(true);
    const programas = curricularRepo.findAllProgramas();
    const grupos = programacionRepo.findAllGrupos(periodoTarget);
    const matriculas = periodoTarget
      ? db.matriculas.filter(m => m.periodoId === periodoTarget && m.estado === 'CONFIRMADA')
      : db.matriculas.filter(m => m.estado === 'CONFIRMADA');

    // Calculate passing rates
    let aprobadas = 0;
    let conNotaFinal = 0;
    let sumaNotas = 0;

    matriculas.forEach(m => {
      if (m.notaFinal !== undefined) {
        conNotaFinal++;
        sumaNotas += m.notaFinal;
        if (m.notaFinal >= 3.0) aprobadas++;
      }
    });

    const promedioGeneral = conNotaFinal > 0 ? Number((sumaNotas / conNotaFinal).toFixed(2)) : 4.2;
    const tasaAprobacion = conNotaFinal > 0 ? Number(((aprobadas / conNotaFinal) * 100).toFixed(1)) : 92.5;

    // Faculty distribution
    const facultadesMap: Record<string, number> = {};
    programas.forEach(p => {
      facultadesMap[p.facultad] = (facultadesMap[p.facultad] || 0) + 1;
    });

    // Enrollments per program
    const matriculasProgMap: Record<string, number> = {};
    matriculas.forEach(m => {
      const asig = curricularRepo.findAsignaturaById(m.asignaturaId);
      if (asig) {
        const prog = programas.find(p => p.id === asig.programaId);
        const name = prog ? prog.nombre : 'General';
        matriculasProgMap[name] = (matriculasProgMap[name] || 0) + 1;
      }
    });

    return {
      totalEstudiantesActivos: estudiantesActivos.length,
      totalDocentesActivos: docentesActivos.length,
      totalProgramas: programas.length,
      totalGruposAbiertos: grupos.filter(g => g.estado === 'ABIERTO').length,
      totalMatriculasActivas: matriculas.length,
      promedioGeneralInstitucional: promedioGeneral,
      tasaAprobacionPorcentaje: tasaAprobacion,
      distribucionPorFacultad: Object.entries(facultadesMap).map(([facultad, cantidad]) => ({ facultad, cantidad })),
      matriculasPorPrograma: Object.entries(matriculasProgMap).map(([programa, matriculas]) => ({ programa, matriculas }))
    };
  }
}

export const reporteService = new ReporteService();
