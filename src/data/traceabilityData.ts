/**
 * Requirements Traceability Matrix (RNF-10: Matriz de Trazabilidad)
 * Maps all RF-01..RF-12 and RNF-01..RNF-12 to their architectural layers,
 * Spring Boot / Hibernate components, database mechanisms, and validation criteria.
 */

export interface RequirementTrace {
  id: string;
  code: string;
  name: string;
  category: 'RF' | 'RNF';
  description: string;
  layerMapping: {
    presentation: string;
    controllerGateway: string;
    businessService: string;
    persistenceDb: string;
  };
  springHibernatePattern: string;
  validationEvidence: string;
}

export const TRACEABILITY_MATRIX: RequirementTrace[] = [
  {
    id: 'rf-01',
    code: 'RF-01',
    name: 'Autenticación',
    category: 'RF',
    description: 'Inicio y cierre de sesión mediante credenciales individuales, generación de tokens JWT stateless gestionados en API Gateway e invalidación inmediata al cerrar sesión.',
    layerMapping: {
      presentation: 'Componente Header, Modal Login y AuthContext (React)',
      controllerGateway: 'AuthController.login() en /api/v1/auth/login, JwtAuthFilter',
      businessService: 'AuthService.authenticate() con validación de credenciales y generación de claims',
      persistenceDb: 'UsuarioRepository.findByEmail(), tabla usuario con índice en email'
    },
    springHibernatePattern: 'Spring Security + JwtAuthenticationFilter + UserDetailsService + AuthenticationManager',
    validationEvidence: 'Prueba de inicio con usuarios predeterminados (Admin, Coordinador, Docente, Estudiante) y emisión de token JWT con tiempo de expiración y claims de rol.'
  },
  {
    id: 'rf-02',
    code: 'RF-02',
    name: 'Roles y Permisos (RBAC)',
    category: 'RF',
    description: 'Manejo de roles Administrador, Coordinador Académico, Docente y Estudiante con restricción de funciones y rechazo 403 Forbidden ante accesos no autorizados.',
    layerMapping: {
      presentation: 'Barra de navegación dinámica, botones condicionales y guards de interfaz',
      controllerGateway: 'authMiddleware([ROLES]), interceptores HTTP que retornan HTTP 403',
      businessService: 'Validaciones de contexto de usuario en cada servicio de negocio',
      persistenceDb: 'Columna rol (ENUM) en tabla usuario y registros de auditoría de seguridad'
    },
    springHibernatePattern: '@PreAuthorize("hasRole(\'ADMIN\')") / @Secured en métodos de controladores y servicios',
    validationEvidence: 'Selector de rol interactivo que comprueba en tiempo real la denegación de rutas (ej. estudiante intentando registrar notas o desactivar profesores).'
  },
  {
    id: 'rf-03',
    code: 'RF-03',
    name: 'Gestión de Estudiantes',
    category: 'RF',
    description: 'CRUD completo sobre entidad Estudiante, validación estricta de unicidad de documento de identidad y borrado lógico (estado INACTIVO) para integridad histórica.',
    layerMapping: {
      presentation: 'Módulo Estudiantes: Tabla con filtros, modal de creación/edición y confirmación de borrado lógico',
      controllerGateway: 'EstudianteController: endpoints GET, POST, PUT, DELETE en /api/v1/estudiantes',
      businessService: 'EstudianteService: validación de duplicados de documento y proyección DTO',
      persistenceDb: 'EstudianteRepository, tabla estudiante con restricción UNIQUE(documento_identidad) y columna estado'
    },
    springHibernatePattern: '@RestController @RequestMapping("/api/v1/estudiantes") + @SQLDelete(sql = "UPDATE estudiante SET estado = \'INACTIVO\' WHERE id=?")',
    validationEvidence: 'Formulario con detección de duplicado de documento y cambio de estado a Inactivo sin destrucción física del registro.'
  },
  {
    id: 'rf-04',
    code: 'RF-04',
    name: 'Gestión de Docentes',
    category: 'RF',
    description: 'Administración de información general y laboral del cuerpo docente, asociación a facultad/departamento y desactivación lógica.',
    layerMapping: {
      presentation: 'Módulo Docentes: Directorio con tarjetas, filtros por departamento y estado',
      controllerGateway: 'DocenteController: endpoints /api/v1/docentes',
      businessService: 'DocenteService: verificación de departamento y unicidad',
      persistenceDb: 'DocenteRepository, tabla docente con flag activo = false'
    },
    springHibernatePattern: '@Entity @Table(name = "docente") + JpaRepository<Docente, String>',
    validationEvidence: 'Creación de docente con departamento y posterior desactivación lógica manteniendo el histórico de grupos previamente asignados.'
  },
  {
    id: 'rf-05',
    code: 'RF-05',
    name: 'Programas y Asignaturas',
    category: 'RF',
    description: 'Estructura jerárquica (Programa → Plan de Estudio → Asignatura), validación de código único y créditos mayores a cero.',
    layerMapping: {
      presentation: 'Módulo Curricular: Visualizador jerárquico y formulario de materias con validadores',
      controllerGateway: 'CurricularController: /api/v1/curricular/programas y /asignaturas',
      businessService: 'CurricularService: regla de negocio creditos > 0 y validación de código único',
      persistenceDb: 'CurricularRepository, tablas programa y asignatura con FK y UNIQUE(codigo)'
    },
    springHibernatePattern: '@OneToMany(mappedBy = "programa", cascade = CascadeType.ALL) + Bean Validation @Min(1) @NotBlank',
    validationEvidence: 'Intentar registrar una asignatura con 0 créditos dispara un error de validación 400 antes de llegar a la base de datos.'
  },
  {
    id: 'rf-06',
    code: 'RF-06',
    name: 'Grupos y Periodos',
    category: 'RF',
    description: 'Apertura de periodos (ej. 2026-1), grupos, cupos, horarios, y algoritmo de prevención de cruces de docente o aula física.',
    layerMapping: {
      presentation: 'Módulo Programación: Panel de grupos, matriz de horarios y detector de cruces en vivo',
      controllerGateway: 'ProgramacionController: /api/v1/programacion/grupos y /periodos',
      businessService: 'ProgramacionService: algoritmo verificarCruceHorarios() para docente y aula simultánea',
      persistenceDb: 'ProgramacionRepository, tablas periodo, grupo y horario_sesion'
    },
    springHibernatePattern: 'Spring Service con algoritmo de detección de solapamiento de intervalos temporales',
    validationEvidence: 'Al crear un grupo en el mismo horario y aula que otro existente, el sistema bloquea la operación indicando el conflicto específico.'
  },
  {
    id: 'rf-07',
    code: 'RF-07',
    name: 'Matrícula Académica Transaccional',
    category: 'RF',
    description: 'Inscripción de estudiantes con verificación síncrona de cupo (>0), bloqueo de doble inscripción y aislamiento ACID con bloqueo pesimista.',
    layerMapping: {
      presentation: 'Módulo Matrícula: Catálogo de asignaturas disponibles con semáforo de cupos',
      controllerGateway: 'MatriculaController.matricular() en POST /api/v1/matriculas',
      businessService: 'MatriculaService: validación de cupo disponible, no duplicidad en el periodo y cruce con otras materias',
      persistenceDb: 'db.executeTransaction() con bloqueo pesimista SELECT FOR UPDATE sobre el grupo y rollback atómico'
    },
    springHibernatePattern: '@Transactional(isolation = Isolation.READ_COMMITTED) + @Lock(LockModeType.PESSIMISTIC_WRITE)',
    validationEvidence: 'Prueba de cupo cero y prueba de doble inscripción con reversión de transacción automática y log de auditoría.'
  },
  {
    id: 'rf-08',
    code: 'RF-08',
    name: 'Registro de Calificaciones',
    category: 'RF',
    description: 'El docente registra notas únicamente en los grupos donde es titular y dentro de la ventana de fechas habilitada por la coordinación.',
    layerMapping: {
      presentation: 'Módulo Calificaciones: Sábana de notas por cortes (30%, 35%, 35%) con recálculo automático',
      controllerGateway: 'CalificacionController: POST /api/v1/calificaciones',
      businessService: 'CalificacionService: validación de titularidad de docente y flag de periodo permiteCalificaciones',
      persistenceDb: 'CalificacionRepository, tabla calificacion_item con cálculo ponderado persistido'
    },
    springHibernatePattern: 'Security Expression @PreAuthorize("@securityService.esDocenteTitular(#grupoId, principal)")',
    validationEvidence: 'Interruptor de ventana de fechas en coordinación: al cerrarse, los docentes no pueden editar notas y reciben mensaje explicativo.'
  },
  {
    id: 'rf-09',
    code: 'RF-09',
    name: 'Consulta de Resultados (Kardex)',
    category: 'RF',
    description: 'Vista consolidada para el estudiante con asignaturas matriculadas, horarios, cortes parciales, nota final y promedio ponderado.',
    layerMapping: {
      presentation: 'Vista Estudiante: Tarjeta de resumen de promedio, créditos aprobados y tabla de notas con estado',
      controllerGateway: 'CalificacionController.kardex(): GET /api/v1/calificaciones/kardex/:id',
      businessService: 'CalificacionService.obtenerKardexEstudiante(): proyecciones y sumatorias ponderadas',
      persistenceDb: 'Consultas directas optimizadas sin bloqueos transaccionales (read-only)'
    },
    springHibernatePattern: '@Transactional(readOnly = true) + DTO Projection con Spring Data JPA',
    validationEvidence: 'Acceso como estudiante Mateo Gómez visualiza de inmediato su promedio de 4.35 y el desglose de sus materias matriculadas.'
  },
  {
    id: 'rf-10',
    code: 'RF-10',
    name: 'Reportes Académicos',
    category: 'RF',
    description: 'Reportes consolidados filtrados por periodo, facultad y programa, estadísticas institucionales y exportación a formatos estándar.',
    layerMapping: {
      presentation: 'Módulo Reportes: Gráficas de distribución, métricas clave (KPIs) y exportación a CSV/Impresión',
      controllerGateway: 'ReporteController: GET /api/v1/reportes/consolidado',
      businessService: 'ReporteService: agregación analítica desacoplada de tablas transaccionales',
      persistenceDb: 'Vistas de base de datos relacional para analítica sin penalizar escrituras'
    },
    springHibernatePattern: 'Vistas SQL indexadas o proyecciones nativas @Subselect con Hibernate',
    validationEvidence: 'Generación instantánea del informe consolidado de estudiantes activos, docentes y distribución de cupos con opción de descarga CSV.'
  },
  {
    id: 'rf-11',
    code: 'RF-11',
    name: 'Búsqueda y Filtros Optimizados',
    category: 'RF',
    description: 'Búsqueda ágil y filtros combinados por documento, nombres, programa y estado con paginación optimizada mediante índices.',
    layerMapping: {
      presentation: 'Barras de búsqueda con debounce en cada módulo y filtros desplegables',
      controllerGateway: 'Controladores con query params (?q=, ?programaId=, ?soloActivos=)',
      businessService: 'Servicios con predicados dinámicos',
      persistenceDb: 'Índices B-Tree en PostgreSQL (documento_identidad, codigo, estado)'
    },
    springHibernatePattern: 'Spring Data JPA Specifications (CriteriaBuilder) + Pageable / Sort',
    validationEvidence: 'Filtro en tiempo real en la lista de estudiantes y grupos con respuesta inmediata (<50ms).'
  },
  {
    id: 'rf-12',
    code: 'RF-12',
    name: 'Auditoría Inmutable',
    category: 'RF',
    description: 'Bitácora automática e inmutable de eventos críticos (logins, matrículas, notas, desactivaciones) con usuario, fecha, acción y datos modificados.',
    layerMapping: {
      presentation: 'Módulo Auditoría: Tabla cronológica de eventos con badges de módulo y modal de detalle JSON',
      controllerGateway: 'AuditoriaController: GET /api/v1/auditoria y Logging Interceptors',
      businessService: 'AuditoriaService.registrarEvento(): captura transparente de acciones en cada servicio',
      persistenceDb: 'AuditoriaRepository, tabla auditoria_log append-only (sin permisos de UPDATE/DELETE)'
    },
    springHibernatePattern: 'Hibernate Envers / Spring Data JPA Auditing (@EntityListeners(AuditingEntityListener.class)) + AOP @Aspect',
    validationEvidence: 'Cada acción en la plataforma añade inmediatamente una fila en la bitácora con IP, rol y descripción técnica del evento.'
  },
  {
    id: 'rnf-01',
    code: 'RNF-01',
    name: 'Seguridad (TLS, Hash & RBAC)',
    category: 'RNF',
    description: 'Comunicaciones protegidas, contraseñas hasheadas con algoritmo fuerte (Argon2id/bcrypt) y autorización estricta en controladores.',
    layerMapping: {
      presentation: 'Almacenamiento seguro de tokens y headers Authorization en peticiones',
      controllerGateway: 'Terminación TLS/HTTPS y middleware RBAC con rechazo 403',
      businessService: 'PasswordEncoder y hashing salteado en entidad usuario',
      persistenceDb: 'Columna password_hash que nunca almacena texto plano y DTOs que excluyen el hash'
    },
    springHibernatePattern: 'BCryptPasswordEncoder / Argon2PasswordEncoder + WebSecurityConfigurerAdapter',
    validationEvidence: 'Verificación en DTOs de usuario donde el passwordHash nunca es enviado a la capa de presentación.'
  },
  {
    id: 'rnf-02',
    code: 'RNF-02',
    name: 'Rendimiento (<3s para 95% consultas)',
    category: 'RNF',
    description: 'Tiempo de respuesta menor a 3 segundos con 300 usuarios concurrentes, llamadas directas en memoria y pool de conexiones HikariCP.',
    layerMapping: {
      presentation: 'Monitor de latencia en la barra superior con medición precisa en ms',
      controllerGateway: 'Header X-Response-Time-Ms medido con performance.now()',
      businessService: 'Lógica optimizada sin bloqueo innecesario de hilos',
      persistenceDb: 'Índices relacionales y simulación de pool de conexiones (HikariCP 10/20)'
    },
    springHibernatePattern: 'HikariCP Pool + Second-Level Cache (Ehcache/Redis) + Spring Boot Actuator metrics',
    validationEvidence: 'Las peticiones se ejecutan en 5 a 25ms (muy por debajo del umbral de 3000ms).'
  },
  {
    id: 'rnf-03',
    code: 'RNF-03',
    name: 'Disponibilidad (99.5% SLA)',
    category: 'RNF',
    description: 'Diseño para disponibilidad mensual del 99.5% (<3.6 horas fuera de servicio al mes) mediante contenedores Docker, health checks y auto-reinicio.',
    layerMapping: {
      presentation: 'Manejo elegante de estados offline y reconexión automática',
      controllerGateway: 'Endpoints de salud /actuator/health y sondas liveness/readiness',
      businessService: 'Diseño resiliente a fallos transitorios',
      persistenceDb: 'Clúster PostgreSQL con réplicas de lectura y conmutación automática'
    },
    springHibernatePattern: 'Spring Boot Actuator HealthIndicator + Docker Compose / Kubernetes Deployment',
    validationEvidence: 'Indicador de disponibilidad SLA visible en el encabezado con especificación de tolerancia a fallos.'
  },
  {
    id: 'rnf-04',
    code: 'RNF-04',
    name: 'Escalabilidad Horizontal & Vertical',
    category: 'RNF',
    description: 'Capas de presentación y servicios stateless sin sesión en memoria del servidor, permitiendo balanceo Nginx y escalado sin cambios de código.',
    layerMapping: {
      presentation: 'SPA React estática distribuible vía CDN o Nginx',
      controllerGateway: 'Backend stateless: cualquier instancia puede atender cualquier petición con el token JWT',
      businessService: 'Servicios sin estado mutable compartido entre hilos',
      persistenceDb: 'PostgreSQL con particionamiento por periodo académico y réplicas'
    },
    springHibernatePattern: 'Stateless Session Management (SessionCreationPolicy.STATELESS) + Spring Cloud Gateway',
    validationEvidence: 'Demostración de tokens JWT autofirmados que permiten réplicas del servidor sin necesidad de sticky sessions.'
  },
  {
    id: 'rnf-05',
    code: 'RNF-05',
    name: 'Mantenibilidad y Arquitectura en 4 Capas',
    category: 'RNF',
    description: 'Separación estricta de responsabilidades: Presentación → Controladores/API → Lógica de Negocio/Servicios → Persistencia/JPA con bajo acoplamiento.',
    layerMapping: {
      presentation: 'Capa 1: React SPA, Hooks y componentes UI reutilizables',
      controllerGateway: 'Capa 2: Express / Spring RestControllers y DTO mapping',
      businessService: 'Capa 3: Reglas de dominio, validaciones e interceptores',
      persistenceDb: 'Capa 4: Repositorios, entidades y transacciones ACID'
    },
    springHibernatePattern: 'Patrón Controller-Service-Repository de Spring Boot con inyección de dependencias (@Autowired / Constructor DI)',
    validationEvidence: 'Inspector interactivo de capas en la interfaz que traza cada solicitud a través de las 4 capas del sistema.'
  },
  {
    id: 'rnf-06',
    code: 'RNF-06',
    name: 'Usabilidad y Accesibilidad (WCAG 2.1 AA)',
    category: 'RNF',
    description: 'Diseño responsivo adaptable a móviles y escritorios, contraste de color verificado, navegación por teclado y etiquetas semánticas.',
    layerMapping: {
      presentation: 'HTML5 semántico, atributos aria, foco visible, contraste suficiente en Tailwind CSS',
      controllerGateway: 'N/A',
      businessService: 'N/A',
      persistenceDb: 'N/A'
    },
    springHibernatePattern: 'React con componentes accesibles, soporte para lectores de pantalla y RWD',
    validationEvidence: 'Interfaz 100% responsiva probada en anchos de escritorio y móvil, con tooltips y contrastes acordes a normas AA.'
  },
  {
    id: 'rnf-07',
    code: 'RNF-07',
    name: 'Integridad y Consistencia Transaccional (ACID)',
    category: 'RNF',
    description: 'Operaciones atómicas (all-or-nothing), prevención de sobrecupo y condiciones de carrera mediante transacciones y bloqueos a nivel de fila.',
    layerMapping: {
      presentation: 'Manejo de estados de carga y retroalimentación clara de transacciones exitosas o revertidas',
      controllerGateway: 'Mapeo de errores de concurrencia y rollback a códigos HTTP limpios',
      businessService: 'Coordinación transaccional en MatriculaService y CalificacionService',
      persistenceDb: 'db.executeTransaction() con snapshot y rollback ante cualquier fallo o colisión de concurrencia'
    },
    springHibernatePattern: '@Transactional(rollbackFor = Exception.class, isolation = Isolation.SERIALIZABLE / READ_COMMITTED)',
    validationEvidence: 'Botón de simulación transaccional que demuestra la reversión completa en caso de fallo simulado sin dejar datos huérfanos.'
  },
  {
    id: 'rnf-08',
    code: 'RNF-08',
    name: 'Interoperabilidad (OpenAPI 3.0)',
    category: 'RNF',
    description: 'Contrato de API REST público documentado bajo OpenAPI 3.0 / Swagger en JSON para integración con sistemas institucionales.',
    layerMapping: {
      presentation: 'Visor integrado interactivo de la especificación Swagger / OpenAPI',
      controllerGateway: 'Endpoint /api/v1/openapi.json que expone schemas, endpoints y códigos de respuesta',
      businessService: 'Contratos estables basados en DTOs',
      persistenceDb: 'N/A'
    },
    springHibernatePattern: 'SpringDoc OpenAPI (springdoc-openapi-starter-webmvc-ui) + Swagger UI',
    validationEvidence: 'Pestaña OpenAPI en la interfaz que permite inspeccionar la documentación interactiva y copiar el esquema JSON oficial.'
  },
  {
    id: 'rnf-09',
    code: 'RNF-09',
    name: 'Respaldo y Recuperación (RPO <24h, RTO <2h)',
    category: 'RNF',
    description: 'Copias de seguridad automáticas diarias, procedimientos de restauración y aislamiento del nodo de almacenamiento.',
    layerMapping: {
      presentation: 'Panel de administración con estado del último snapshot y botón de restablecimiento a valores de fábrica',
      controllerGateway: 'Endpoint /api/v1/sistema/reset para restaurar el estado inicial',
      businessService: 'Estrategia de respaldo y aislamiento de datos de prueba',
      persistenceDb: 'pg_dump diario cifrado en almacenamiento redundante (GCS/S3 con versionado)'
    },
    springHibernatePattern: 'Scripts automatizados de pg_dump + WAL archiving (Continuous Archiving and Point-in-Time Recovery)',
    validationEvidence: 'Función de restablecimiento a valores predeterminados con re-siembra de tablas y registro en bitácora.'
  },
  {
    id: 'rnf-10',
    code: 'RNF-10',
    name: 'Trazabilidad Arquitectónica',
    category: 'RNF',
    description: 'Asociación explícita de cada requerimiento con componentes de las cuatro capas, patrones arquitectónicos y evidencias de validación.',
    layerMapping: {
      presentation: 'Matriz de trazabilidad interactiva con filtros por RF/RNF y desglose por capas',
      controllerGateway: 'Trazabilidad de rutas REST y middlewares documentados',
      businessService: 'Clases de servicio asociadas directamente a cada requerimiento',
      persistenceDb: 'Entidades y repositorios mapeados'
    },
    springHibernatePattern: 'Documentación de arquitectura basada en vistas C4 (Contexto, Contenedores, Componentes, Código)',
    validationEvidence: 'Pestaña dedicada "Matriz de Trazabilidad" donde cada uno de los 24 requerimientos (12 RF + 12 RNF) está detallado.'
  },
  {
    id: 'rnf-11',
    code: 'RNF-11',
    name: 'Privacidad y Aislamiento con DTOs',
    category: 'RNF',
    description: 'Filtrado de datos sensibles en la capa de negocio mediante DTOs para que contraseñas hasheadas y datos confidenciales nunca salgan a la capa web.',
    layerMapping: {
      presentation: 'Vistas que solo reciben campos autorizados según el rol del usuario',
      controllerGateway: 'Retorno estricto de DTOs (EstudianteDto, DocenteDto, UsuarioDto) nunca entidades JPA crudas',
      businessService: 'Mapeadores de entidad a DTO que sanitizan campos sensibles',
      persistenceDb: 'Entidades con campos privados'
    },
    springHibernatePattern: 'MapStruct / ModelMapper + @JsonIgnoreProperties + Java Records como DTOs',
    validationEvidence: 'Verificación en la consola de red: el campo passwordHash nunca se serializa en las respuestas de la API.'
  },
  {
    id: 'rnf-12',
    code: 'RNF-12',
    name: 'Compatibilidad Multiplataforma',
    category: 'RNF',
    description: 'Compatibilidad con navegadores modernos (Chrome, Firefox, Safari, Edge) y estándares ECMAScript 6+ y CSS3 modular.',
    layerMapping: {
      presentation: 'Compilación Vite ES2022, Tailwind CSS 4 con prefijos automáticos y diseño elástico',
      controllerGateway: 'Cabeceras CORS y Content-Type estándar application/json',
      businessService: 'N/A',
      persistenceDb: 'N/A'
    },
    springHibernatePattern: 'Vite Bundler + PostCSS/Autoprefixer para soporte cross-browser',
    validationEvidence: 'Ejecución validada en navegadores basados en Chromium, Gecko y WebKit sin librerías propietarias.'
  }
];
