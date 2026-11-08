/**
 * Persistence & Data Access Layer (Spring Data JPA / Hibernate Simulation)
 * Implements RNF-05 (Separación de capas e inversión de control),
 * RNF-07 (Integridad, consistencia, transacciones ACID all-or-nothing y bloqueos)
 * y persistencia en memoria/almacenamiento estructurado.
 */

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

// Initial Seed Data for the University System
const initialUsuarios: Usuario[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@universidad.edu.co',
    nombre: 'Carlos',
    apellido: 'Mendoza',
    documentoIdentidad: '1098765432',
    telefono: '+57 310 555 0101',
    rol: 'ADMIN',
    activo: true,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$simulated_hash_admin',
    ultimoAcceso: new Date(Date.now() - 3600000).toISOString(),
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'usr-coord-1',
    email: 'coordinador.sistemas@universidad.edu.co',
    nombre: 'Elena',
    apellido: 'Ramos',
    documentoIdentidad: '1023456789',
    telefono: '+57 312 444 0202',
    rol: 'COORDINADOR',
    activo: true,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$simulated_hash_coord',
    ultimoAcceso: new Date(Date.now() - 7200000).toISOString(),
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2026-02-05T11:00:00Z',
  },
  {
    id: 'usr-doc-1',
    email: 'jortiz@universidad.edu.co',
    nombre: 'Javier',
    apellido: 'Ortiz',
    documentoIdentidad: '79845123',
    telefono: '+57 315 777 0303',
    rol: 'DOCENTE',
    activo: true,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$simulated_hash_doc1',
    ultimoAcceso: new Date(Date.now() - 14400000).toISOString(),
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z',
  },
  {
    id: 'usr-doc-2',
    email: 'mrodriguez@universidad.edu.co',
    nombre: 'María',
    apellido: 'Rodríguez',
    documentoIdentidad: '52896314',
    telefono: '+57 318 999 0404',
    rol: 'DOCENTE',
    activo: true,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$simulated_hash_doc2',
    ultimoAcceso: new Date(Date.now() - 28800000).toISOString(),
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2026-02-10T15:00:00Z',
  },
  {
    id: 'usr-est-1',
    email: 'mateo.gomez@estudiante.edu.co',
    nombre: 'Mateo',
    apellido: 'Gómez',
    documentoIdentidad: '1014236589',
    telefono: '+57 301 222 0505',
    rol: 'ESTUDIANTE',
    activo: true,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$simulated_hash_est1',
    ultimoAcceso: new Date(Date.now() - 1800000).toISOString(),
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2026-02-15T09:00:00Z',
  },
  {
    id: 'usr-est-2',
    email: 'sofia.restrepo@estudiante.edu.co',
    nombre: 'Sofía',
    apellido: 'Restrepo',
    documentoIdentidad: '1035698741',
    telefono: '+57 300 111 0606',
    rol: 'ESTUDIANTE',
    activo: true,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$simulated_hash_est2',
    ultimoAcceso: new Date(Date.now() - 86400000).toISOString(),
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2026-02-15T09:30:00Z',
  }
];

const initialProgramas: ProgramaAcademico[] = [
  {
    id: 'prog-1',
    codigo: 'ING-SIS',
    nombre: 'Ingeniería de Sistemas y Computación',
    facultad: 'Facultad de Ingeniería',
    nivelFormacion: 'PREGRADO',
    totalCreditos: 160,
    duracionSemestres: 10,
    activo: true,
  },
  {
    id: 'prog-2',
    codigo: 'ADM-EMP',
    nombre: 'Administración de Empresas',
    facultad: 'Facultad de Ciencias Económicas',
    nivelFormacion: 'PREGRADO',
    totalCreditos: 145,
    duracionSemestres: 9,
    activo: true,
  },
  {
    id: 'prog-3',
    codigo: 'MED-SAL',
    nombre: 'Medicina General',
    facultad: 'Facultad de Ciencias de la Salud',
    nivelFormacion: 'PREGRADO',
    totalCreditos: 210,
    duracionSemestres: 12,
    activo: true,
  },
  {
    id: 'prog-4',
    codigo: 'DER-POL',
    nombre: 'Derecho y Ciencias Políticas',
    facultad: 'Facultad de Ciencias Jurídicas',
    nivelFormacion: 'PREGRADO',
    totalCreditos: 155,
    duracionSemestres: 10,
    activo: true,
  }
];

const initialDocentes: Docente[] = [
  {
    id: 'doc-1',
    usuarioId: 'usr-doc-1',
    documentoIdentidad: '79845123',
    codigoDocente: 'DOC-1001',
    nombres: 'Javier',
    apellidos: 'Ortiz Pardo',
    email: 'jortiz@universidad.edu.co',
    telefono: '+57 315 777 0303',
    departamento: 'Ingeniería de Software y Sistemas',
    facultad: 'Facultad de Ingeniería',
    tituloAcademico: 'Magíster en Arquitectura de Software y Cloud Computing',
    tipoContrato: 'TIEMPO_COMPLETO',
    activo: true,
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z',
  },
  {
    id: 'doc-2',
    usuarioId: 'usr-doc-2',
    documentoIdentidad: '52896314',
    codigoDocente: 'DOC-1002',
    nombres: 'María',
    apellidos: 'Rodríguez Silva',
    email: 'mrodriguez@universidad.edu.co',
    telefono: '+57 318 999 0404',
    departamento: 'Ciencias Básicas y Matemáticas',
    facultad: 'Facultad de Ingeniería',
    tituloAcademico: 'Doctora en Ciencias Matemáticas y Modelado',
    tipoContrato: 'TIEMPO_COMPLETO',
    activo: true,
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2026-02-10T15:00:00Z',
  }
];

const initialEstudiantes: Estudiante[] = [
  {
    id: 'est-1',
    usuarioId: 'usr-est-1',
    documentoIdentidad: '1014236589',
    codigoEstudiantil: 'EST-2023-084',
    nombres: 'Mateo',
    apellidos: 'Gómez Morales',
    email: 'mateo.gomez@estudiante.edu.co',
    telefono: '+57 301 222 0505',
    programaId: 'prog-1',
    semestreActual: 5,
    promedioAcumulado: 4.35,
    estado: 'ACTIVO',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2026-02-15T09:00:00Z',
  },
  {
    id: 'est-2',
    usuarioId: 'usr-est-2',
    documentoIdentidad: '1035698741',
    codigoEstudiantil: 'EST-2024-112',
    nombres: 'Sofía',
    apellidos: 'Restrepo Castro',
    email: 'sofia.restrepo@estudiante.edu.co',
    telefono: '+57 300 111 0606',
    programaId: 'prog-2',
    semestreActual: 3,
    promedioAcumulado: 4.60,
    estado: 'ACTIVO',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2026-02-15T09:30:00Z',
  }
];

const initialAsignaturas: Asignatura[] = [
  {
    id: 'asig-1',
    codigo: 'SIS-301',
    nombre: 'Arquitectura de Software y Patrones de Diseño',
    programaId: 'prog-1',
    creditos: 3,
    semestreNivel: 5,
    departamento: 'Ingeniería de Software y Sistemas',
    activo: true,
    descripcion: 'Diseño en capas, microservicios, SOLID, Spring Boot, Hibernate y Clean Architecture.',
  },
  {
    id: 'asig-2',
    codigo: 'SIS-202',
    nombre: 'Bases de Datos Relacionales y SQL Avanzado',
    programaId: 'prog-1',
    creditos: 4,
    semestreNivel: 4,
    departamento: 'Ingeniería de Software y Sistemas',
    activo: true,
    descripcion: 'Modelado relacional, PostgreSQL, normalización, transacciones ACID y optimización de índices.',
  },
  {
    id: 'asig-3',
    codigo: 'MAT-101',
    nombre: 'Cálculo Diferencial e Integral',
    programaId: 'prog-1',
    creditos: 4,
    semestreNivel: 1,
    departamento: 'Ciencias Básicas y Matemáticas',
    activo: true,
    descripcion: 'Límites, derivadas, integrales y modelos matemáticos de optimización.',
  },
  {
    id: 'asig-4',
    codigo: 'ADM-101',
    nombre: 'Fundamentos de Gestión y Teoría Organizacional',
    programaId: 'prog-2',
    creditos: 3,
    semestreNivel: 1,
    departamento: 'Administración y Finanzas',
    activo: true,
    descripcion: 'Procesos de planeación, organización, dirección y control empresarial.',
  },
  {
    id: 'asig-5',
    codigo: 'ADM-204',
    nombre: 'Contabilidad de Costos y Presupuestos',
    programaId: 'prog-2',
    creditos: 3,
    semestreNivel: 3,
    departamento: 'Administración y Finanzas',
    activo: true,
    descripcion: 'Costeo ABC, punto de equilibrio, formulación y control presupuestal.',
  }
];

const initialPeriodos: PeriodoAcademico[] = [
  {
    id: 'per-2026-1',
    codigo: '2026-1',
    nombre: 'Periodo Académico Ordinario 2026-I',
    fechaInicio: '2026-02-02',
    fechaFin: '2026-06-20',
    fechaInicioNotas: '2026-03-01',
    fechaCierreNotas: '2026-06-25',
    estado: 'ACTIVO',
    permiteCalificaciones: true,
  },
  {
    id: 'per-2025-2',
    codigo: '2025-2',
    nombre: 'Periodo Académico Ordinario 2025-II',
    fechaInicio: '2025-08-01',
    fechaFin: '2025-12-15',
    fechaInicioNotas: '2025-09-01',
    fechaCierreNotas: '2025-12-20',
    estado: 'FINALIZADO',
    permiteCalificaciones: false,
  }
];

const initialGrupos: Grupo[] = [
  {
    id: 'grp-1',
    codigo: 'SIS301-G1',
    asignaturaId: 'asig-1',
    periodoId: 'per-2026-1',
    docenteId: 'doc-1',
    cupoMaximo: 25,
    cupoOcupado: 1,
    horarios: [
      { dia: 'LUNES', horaInicio: '08:00', horaFin: '10:00', aula: 'Laboratorio de Software 302' },
      { dia: 'MIERCOLES', horaInicio: '08:00', horaFin: '10:00', aula: 'Laboratorio de Software 302' }
    ],
    estado: 'ABIERTO',
    modalidad: 'PRESENCIAL',
  },
  {
    id: 'grp-2',
    codigo: 'SIS202-G1',
    asignaturaId: 'asig-2',
    periodoId: 'per-2026-1',
    docenteId: 'doc-1',
    cupoMaximo: 20,
    cupoOcupado: 1,
    horarios: [
      { dia: 'MARTES', horaInicio: '10:00', horaFin: '12:00', aula: 'Edificio Central Aula 104' },
      { dia: 'JUEVES', horaInicio: '10:00', horaFin: '12:00', aula: 'Edificio Central Aula 104' }
    ],
    estado: 'ABIERTO',
    modalidad: 'PRESENCIAL',
  },
  {
    id: 'grp-3',
    codigo: 'MAT101-G1',
    asignaturaId: 'asig-3',
    periodoId: 'per-2026-1',
    docenteId: 'doc-2',
    cupoMaximo: 30,
    cupoOcupado: 0,
    horarios: [
      { dia: 'LUNES', horaInicio: '14:00', horaFin: '16:00', aula: 'Aula Magna 201' },
      { dia: 'VIERNES', horaInicio: '14:00', horaFin: '16:00', aula: 'Aula Magna 201' }
    ],
    estado: 'ABIERTO',
    modalidad: 'PRESENCIAL',
  },
  {
    id: 'grp-4',
    codigo: 'ADM204-G1',
    asignaturaId: 'asig-5',
    periodoId: 'per-2026-1',
    docenteId: 'doc-2',
    cupoMaximo: 25,
    cupoOcupado: 1,
    horarios: [
      { dia: 'MIERCOLES', horaInicio: '10:00', horaFin: '12:00', aula: 'Edificio Económicas Aula 305' },
      { dia: 'VIERNES', horaInicio: '10:00', horaFin: '12:00', aula: 'Edificio Económicas Aula 305' }
    ],
    estado: 'ABIERTO',
    modalidad: 'PRESENCIAL',
  }
];

const initialMatriculas: Matricula[] = [
  {
    id: 'mat-1',
    estudianteId: 'est-1',
    grupoId: 'grp-1',
    periodoId: 'per-2026-1',
    asignaturaId: 'asig-1',
    fechaMatricula: '2026-02-03T10:15:00Z',
    estado: 'CONFIRMADA',
    notaFinal: 4.4,
    aprobado: true,
  },
  {
    id: 'mat-2',
    estudianteId: 'est-1',
    grupoId: 'grp-2',
    periodoId: 'per-2026-1',
    asignaturaId: 'asig-2',
    fechaMatricula: '2026-02-03T10:20:00Z',
    estado: 'CONFIRMADA',
    notaFinal: 4.1,
    aprobado: true,
  },
  {
    id: 'mat-3',
    estudianteId: 'est-2',
    grupoId: 'grp-4',
    periodoId: 'per-2026-1',
    asignaturaId: 'asig-5',
    fechaMatricula: '2026-02-04T09:00:00Z',
    estado: 'CONFIRMADA',
    notaFinal: 4.7,
    aprobado: true,
  }
];

const initialCalificaciones: CalificacionItem[] = [
  {
    id: 'cal-1',
    matriculaId: 'mat-1',
    estudianteId: 'est-1',
    grupoId: 'grp-1',
    corte: 1,
    porcentaje: 30,
    nota: 4.5,
    fechaRegistro: '2026-03-15T16:30:00Z',
    observaciones: 'Excelente sustentación del diseño en capas y controladores REST.',
  },
  {
    id: 'cal-2',
    matriculaId: 'mat-1',
    estudianteId: 'est-1',
    grupoId: 'grp-1',
    corte: 2,
    porcentaje: 35,
    nota: 4.2,
    fechaRegistro: '2026-04-20T11:00:00Z',
    observaciones: 'Implementación correcta de repositorios JPA y transacciones ACID.',
  },
  {
    id: 'cal-3',
    matriculaId: 'mat-1',
    estudianteId: 'est-1',
    grupoId: 'grp-1',
    corte: 3,
    porcentaje: 35,
    nota: 4.5,
    fechaRegistro: '2026-06-10T14:00:00Z',
    observaciones: 'Proyecto final desplegado y documentado con OpenAPI 3.0.',
  },
  {
    id: 'cal-4',
    matriculaId: 'mat-2',
    estudianteId: 'est-1',
    grupoId: 'grp-2',
    corte: 1,
    porcentaje: 30,
    nota: 4.0,
    fechaRegistro: '2026-03-18T10:00:00Z',
  },
  {
    id: 'cal-5',
    matriculaId: 'mat-2',
    estudianteId: 'est-1',
    grupoId: 'grp-2',
    corte: 2,
    porcentaje: 35,
    nota: 4.2,
    fechaRegistro: '2026-04-22T09:30:00Z',
  },
  {
    id: 'cal-6',
    matriculaId: 'mat-3',
    estudianteId: 'est-2',
    grupoId: 'grp-4',
    corte: 1,
    porcentaje: 30,
    nota: 4.8,
    fechaRegistro: '2026-03-20T15:00:00Z',
  },
  {
    id: 'cal-7',
    matriculaId: 'mat-3',
    estudianteId: 'est-2',
    grupoId: 'grp-4',
    corte: 2,
    porcentaje: 35,
    nota: 4.6,
    fechaRegistro: '2026-04-25T11:00:00Z',
  }
];

const initialAuditoria: AuditoriaLog[] = [
  {
    id: 'aud-1',
    usuarioId: 'usr-admin-1',
    usuarioEmail: 'admin@universidad.edu.co',
    usuarioRol: 'ADMIN',
    timestamp: '2026-02-01T08:30:00Z',
    tipoAccion: 'LOGIN',
    modulo: 'AUTENTICACION',
    registroAfectadoId: 'usr-admin-1',
    datosModificados: 'Autenticación exitosa mediante credenciales individuales y emisión de token JWT',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'aud-2',
    usuarioId: 'usr-admin-1',
    usuarioEmail: 'admin@universidad.edu.co',
    usuarioRol: 'ADMIN',
    timestamp: '2026-02-02T09:00:00Z',
    tipoAccion: 'CREACION',
    modulo: 'PROGRAMACION',
    registroAfectadoId: 'grp-1',
    datosModificados: 'Apertura de grupo SIS301-G1 para Arquitectura de Software con cupo 25',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'aud-3',
    usuarioId: 'usr-est-1',
    usuarioEmail: 'mateo.gomez@estudiante.edu.co',
    usuarioRol: 'ESTUDIANTE',
    timestamp: '2026-02-03T10:15:00Z',
    tipoAccion: 'MATRICULA',
    modulo: 'MATRICULAS',
    registroAfectadoId: 'mat-1',
    datosModificados: 'Matrícula confirmada en grupo SIS301-G1 bajo aislamiento transaccional',
    ipAddress: '192.168.1.150',
  },
  {
    id: 'aud-4',
    usuarioId: 'usr-doc-1',
    usuarioEmail: 'jortiz@universidad.edu.co',
    usuarioRol: 'DOCENTE',
    timestamp: '2026-03-15T16:30:00Z',
    tipoAccion: 'CALIFICACION',
    modulo: 'CALIFICACIONES',
    registroAfectadoId: 'cal-1',
    datosModificados: 'Registro de nota Corte 1: 4.5 para estudiante EST-2023-084 en SIS301-G1',
    ipAddress: '192.168.1.120',
  }
];

/**
 * In-Memory Persistence Layer simulating PostgreSQL Database with Hibernate/JPA
 */
class DatabaseContext {
  private static instance: DatabaseContext;

  public usuarios: Usuario[] = [];
  public estudiantes: Estudiante[] = [];
  public docentes: Docente[] = [];
  public programas: ProgramaAcademico[] = [];
  public asignaturas: Asignatura[] = [];
  public periodos: PeriodoAcademico[] = [];
  public grupos: Grupo[] = [];
  public matriculas: Matricula[] = [];
  public calificaciones: CalificacionItem[] = [];
  public auditoriaLogs: AuditoriaLog[] = [];

  // Lock manager for simulated pessimistic locks (SELECT FOR UPDATE)
  private lockedEntities = new Set<string>();

  private constructor() {
    this.resetToDefaults();
  }

  public static getInstance(): DatabaseContext {
    if (!DatabaseContext.instance) {
      DatabaseContext.instance = new DatabaseContext();
    }
    return DatabaseContext.instance;
  }

  public resetToDefaults(): void {
    this.usuarios = JSON.parse(JSON.stringify(initialUsuarios));
    this.estudiantes = JSON.parse(JSON.stringify(initialEstudiantes));
    this.docentes = JSON.parse(JSON.stringify(initialDocentes));
    this.programas = JSON.parse(JSON.stringify(initialProgramas));
    this.asignaturas = JSON.parse(JSON.stringify(initialAsignaturas));
    this.periodos = JSON.parse(JSON.stringify(initialPeriodos));
    this.grupos = JSON.parse(JSON.stringify(initialGrupos));
    this.matriculas = JSON.parse(JSON.stringify(initialMatriculas));
    this.calificaciones = JSON.parse(JSON.stringify(initialCalificaciones));
    this.auditoriaLogs = JSON.parse(JSON.stringify(initialAuditoria));
    this.lockedEntities.clear();
  }

  /**
   * Simulates an ACID transaction with pessimistic lock and rollback capability
   * Implements RNF-07: "Cada transacción se procesa por completo o se revierte (all-or-nothing)"
   */
  public async executeTransaction<T>(
    operation: () => Promise<T> | T,
    entitiesToLock: string[] = []
  ): Promise<T> {
    // 1. Acquire locks (simulating SELECT ... FOR UPDATE)
    for (const id of entitiesToLock) {
      if (this.lockedEntities.has(id)) {
        throw new Error(`[CONCURRENCY_ERROR] El recurso ${id} está bloqueado por otra transacción activa.`);
      }
      this.lockedEntities.add(id);
    }

    // 2. Snapshot current state for rollback capability
    const snapshot = {
      grupos: JSON.parse(JSON.stringify(this.grupos)),
      matriculas: JSON.parse(JSON.stringify(this.matriculas)),
      calificaciones: JSON.parse(JSON.stringify(this.calificaciones)),
      estudiantes: JSON.parse(JSON.stringify(this.estudiantes)),
    };

    try {
      const result = await operation();
      return result;
    } catch (error) {
      // Rollback to snapshot (all-or-nothing)
      this.grupos = snapshot.grupos;
      this.matriculas = snapshot.matriculas;
      this.calificaciones = snapshot.calificaciones;
      this.estudiantes = snapshot.estudiantes;
      throw error;
    } finally {
      // Release locks
      for (const id of entitiesToLock) {
        this.lockedEntities.delete(id);
      }
    }
  }
}

export const db = DatabaseContext.getInstance();
