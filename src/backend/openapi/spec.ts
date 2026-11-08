/**
 * OpenAPI 3.0 Specification (RNF-08: Interoperabilidad y API REST documentada)
 */

export const openApiSpecification = {
  openapi: '3.0.3',
  info: {
    title: 'SIGA - Sistema Integral de Gestión Académica API',
    version: '1.0.0',
    description: 'API RESTful modular basada en arquitectura en capas (Spring Boot / Hibernate / Node.js) que implementa los requerimientos funcionales RF-01 al RF-12 y no funcionales RNF-01 al RNF-12.',
    contact: {
      name: 'Dirección de Tecnología Académica',
      email: 'arquitectura@siga.edu.co'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Gateway / Entorno de Ejecución Local'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido en /auth/login. Se envía en el encabezado Authorization: Bearer <token>'
      }
    },
    schemas: {
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          nombreCompleto: { type: 'string' },
          rol: { type: 'string', enum: ['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE'] },
          documentoIdentidad: { type: 'string' }
        }
      },
      Estudiante: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          documentoIdentidad: { type: 'string' },
          codigoEstudiantil: { type: 'string' },
          nombres: { type: 'string' },
          apellidos: { type: 'string' },
          email: { type: 'string' },
          telefono: { type: 'string' },
          programaId: { type: 'string' },
          semestreActual: { type: 'integer' },
          promedioAcumulado: { type: 'number' },
          estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO', 'GRADUADO', 'SUSPENDIDO'] }
        }
      },
      Docente: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          documentoIdentidad: { type: 'string' },
          codigoDocente: { type: 'string' },
          nombres: { type: 'string' },
          apellidos: { type: 'string' },
          email: { type: 'string' },
          departamento: { type: 'string' },
          facultad: { type: 'string' },
          tipoContrato: { type: 'string' },
          activo: { type: 'boolean' }
        }
      },
      Matricula: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          estudianteId: { type: 'string' },
          grupoId: { type: 'string' },
          fechaMatricula: { type: 'string', format: 'date-time' },
          estado: { type: 'string' }
        }
      },
      AuditoriaLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          usuarioId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          tipoAccion: { type: 'string' },
          modulo: { type: 'string' },
          datosModificados: { type: 'string' }
        }
      }
    }
  },
  security: [
    { bearerAuth: [] }
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Autenticación de usuarios (RF-01)',
        description: 'Verifica credenciales institucionales y emite un token JWT stateless.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@universidad.edu.co' },
                  password: { type: 'string', example: '123456' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Autenticación exitosa y emisión de token JWT' },
          '401': { description: 'Credenciales inválidas' }
        }
      }
    },
    '/estudiantes': {
      get: {
        summary: 'Consultar lista de estudiantes (RF-03, RF-11)',
        description: 'Permite buscar y filtrar con paginación optimizada.',
        responses: { '200': { description: 'Listado obtenido con éxito' } }
      },
      post: {
        summary: 'Registrar nuevo estudiante (RF-03)',
        description: 'Valida documento único y crea cuenta vinculada.',
        responses: { '201': { description: 'Estudiante creado' } }
      }
    },
    '/docentes': {
      get: {
        summary: 'Consultar docentes (RF-04)',
        responses: { '200': { description: 'Lista de docentes' } }
      },
      post: {
        summary: 'Registrar docente (RF-04)',
        responses: { '201': { description: 'Docente registrado' } }
      }
    },
    '/curricular/programas': {
      get: { summary: 'Listar programas académicos (RF-05)' },
      post: { summary: 'Crear programa académico (RF-05)' }
    },
    '/curricular/asignaturas': {
      get: { summary: 'Listar asignaturas y créditos (RF-05)' },
      post: { summary: 'Crear asignatura curricular con créditos > 0 (RF-05)' }
    },
    '/programacion/grupos': {
      get: { summary: 'Consultar oferta de grupos académicos (RF-06)' },
      post: {
        summary: 'Crear grupo con validación de cruces de docente y aula (RF-06)',
        description: 'Ejecuta el algoritmo de detección de conflictos en la capa de negocio.'
      }
    },
    '/matriculas': {
      post: {
        summary: 'Matricular estudiante en grupo (RF-07)',
        description: 'Transacción ACID con bloqueo pesimista y verificación de cupos y no duplicidad.'
      }
    },
    '/calificaciones': {
      post: {
        summary: 'Registrar calificación parcial o final (RF-08)',
        description: 'Valida titularidad del docente y ventana de calendario habilitada.'
      }
    },
    '/calificaciones/kardex/{estudianteId}': {
      get: {
        summary: 'Consultar historial y calificaciones del estudiante (RF-09)',
        description: 'Vista consolidada de asignaturas, porcentajes y promedios.'
      }
    },
    '/reportes/consolidado': {
      get: { summary: 'Reporte consolidado institucional (RF-10)' }
    },
    '/auditoria': {
      get: { summary: 'Consultar bitácora inmutable de auditoría (RF-12)' }
    }
  }
};
