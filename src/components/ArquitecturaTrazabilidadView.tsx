/**
 * Arquitectura & Matriz de Trazabilidad View
 * Implements RNF-05 (Arquitectura en 4 Capas), RNF-10 (Matriz de Trazabilidad),
 * RNF-08 (OpenAPI 3.0), and Spring Boot / Hibernate Technical Reference.
 */

import React, { useState } from 'react';
import {
  Layers,
  Shield,
  Cpu,
  Database,
  Globe,
  CheckCircle2,
  FileCode2,
  Search,
  ExternalLink,
  Code,
  Copy,
  Check,
  Server,
  Zap,
  Lock
} from 'lucide-react';
import { TRACEABILITY_MATRIX, RequirementTrace } from '../data/traceabilityData.ts';
import { openApiSpecification } from '../backend/openapi/spec.ts';

export const ArquitecturaTrazabilidadView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MATRIZ' | 'DIAGRAMA' | 'SPRING_CODE' | 'OPENAPI'>('DIAGRAMA');
  const [filterType, setFilterType] = useState<'ALL' | 'RF' | 'RNF'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedOpenApi, setCopiedOpenApi] = useState(false);

  // Filtered requirements
  const matrixFiltrada = TRACEABILITY_MATRIX.filter(item => {
    const matchType = filterType === 'ALL' || item.category === filterType;
    const matchSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.springHibernatePattern.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const handleCopyOpenApi = () => {
    navigator.clipboard.writeText(JSON.stringify(openApiSpecification, null, 2));
    setCopiedOpenApi(true);
    setTimeout(() => setCopiedOpenApi(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Arquitectura en Capas & Matriz de Trazabilidad
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-mono font-medium">
              RNF-05 & RNF-10
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Diseño arquitectónico desacoplado, mapeo integral de los 24 requerimientos (RF-01..12 y RNF-01..12) y especificación OpenAPI 3.0.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 flex-wrap">
        <button
          onClick={() => setActiveTab('DIAGRAMA')}
          className={`py-3 px-5 font-semibold text-sm transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'DIAGRAMA'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Diagrama de 4 Capas (RNF-05)</span>
        </button>

        <button
          onClick={() => setActiveTab('MATRIZ')}
          className={`py-3 px-5 font-semibold text-sm transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'MATRIZ'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Matriz de Trazabilidad (RNF-10)</span>
        </button>

        <button
          onClick={() => setActiveTab('SPRING_CODE')}
          className={`py-3 px-5 font-semibold text-sm transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'SPRING_CODE'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>Patrones Spring Boot & Hibernate</span>
        </button>

        <button
          onClick={() => setActiveTab('OPENAPI')}
          className={`py-3 px-5 font-semibold text-sm transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'OPENAPI'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Contrato OpenAPI 3.0 (RNF-08)</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: DIAGRAMA DE 4 CAPAS */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'DIAGRAMA' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Capa 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-sky-400 dark:border-sky-500/80 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center mb-3">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold tracking-wider text-sky-600 dark:text-sky-400 uppercase">
                  Capa 1
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Capa de Presentación
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Desarrollada en React 19 + TypeScript + Tailwind CSS modular. Desacoplada de la base de datos, 100% responsiva (RNF-06, RNF-12) y accesible WCAG 2.1 AA.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] space-y-1 font-mono text-slate-600 dark:text-slate-300">
                <div>• EstudiantesView, DocentesView</div>
                <div>• ProgramacionView, MatriculasView</div>
                <div>• CalificacionesView & Kardex</div>
                <div>• Token Storage (Stateless JWT)</div>
              </div>
            </div>

            {/* Capa 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-purple-400 dark:border-purple-500/80 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold tracking-wider text-purple-600 dark:text-purple-400 uppercase">
                  Capa 2
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  API Gateway & Controladores
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Intermediario REST (Spring @RestController / Express). Gestiona la seguridad stateless, validación RBAC (RF-02) con rechazo 403 y contratos OpenAPI 3.0 (RNF-08).
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] space-y-1 font-mono text-slate-600 dark:text-slate-300">
                <div>• /api/v1/auth/login (JWT)</div>
                <div>• authMiddleware(RBAC)</div>
                <div>• /api/v1/estudiantes, /docentes</div>
                <div>• /api/v1/matriculas, /calificaciones</div>
              </div>
            </div>

            {/* Capa 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-amber-400 dark:border-amber-500/80 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center mb-3">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                  Capa 3
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Lógica de Negocio & Servicios
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Núcleo de dominio (Spring @Service). Ejecuta el algoritmo de detección de cruces de docente y aula (RF-06), unicidad de matrículas (RF-07) y sanitización DTO (RNF-11).
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] space-y-1 font-mono text-slate-600 dark:text-slate-300">
                <div>• ProgramacionService (Cruces)</div>
                <div>• MatriculaService (@Transactional)</div>
                <div>• CalificacionService (Fechas)</div>
                <div>• AuditoriaService (Event Logger)</div>
              </div>
            </div>

            {/* Capa 4 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-emerald-400 dark:border-emerald-500/80 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mb-3">
                  <Database className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                  Capa 4
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Acceso a Datos & Hibernate
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Persistencia relacional (Spring Data JPA / Hibernate ORM). Maneja transacciones ACID con bloqueos pesimistas (SELECT FOR UPDATE) y borrado lógico (RF-03, RF-04).
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] space-y-1 font-mono text-slate-600 dark:text-slate-300">
                <div>• JpaRepository&lt;T, ID&gt;</div>
                <div>• Bloqueo Pesimista (Cupos)</div>
                <div>• B-Tree Indexes (documento, id)</div>
                <div>• HikariCP Pool (RNF-02)</div>
              </div>
            </div>
          </div>

          {/* Architectural Benefits Summary */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              <span>Garantías de la Arquitectura en Capas Implementada</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <span className="font-semibold text-white block mb-1">Bajo Acoplamiento (RNF-05)</span>
                La capa web desconoce el motor de persistencia relacional. Se puede migrar la base de datos o la interfaz sin modificar las reglas de negocio de matrículas ni los algoritmos de programación.
              </div>
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <span className="font-semibold text-white block mb-1">Aislamiento Transaccional ACID (RNF-07)</span>
                Las inscripciones usan bloqueo pesimista a nivel de fila durante la verificación y reserva del cupo, garantizando el principio de todo-o-nada (all-or-nothing) sin condiciones de carrera.
              </div>
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <span className="font-semibold text-white block mb-1">Privacidad con DTOs (RNF-11)</span>
                Las contraseñas hasheadas y las estructuras internas de base de datos nunca viajan al cliente web. Todos los controladores responden exclusivamente con objetos de transferencia de datos proyectados.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 2: MATRIZ DE TRAZABILIDAD (RNF-10) */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'MATRIZ' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar requerimiento por código, nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Todos (24)
              </button>
              <button
                onClick={() => setFilterType('RF')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterType === 'RF'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Funcionales RF (12)
              </button>
              <button
                onClick={() => setFilterType('RNF')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterType === 'RNF'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                No Funcionales RNF (12)
              </button>
            </div>
          </div>

          {/* Matrix Cards List */}
          <div className="space-y-4">
            {matrixFiltrada.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-mono font-bold px-2.5 py-0.5 rounded text-xs ${
                        item.category === 'RF'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                    >
                      {item.code}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {item.name}
                    </h3>
                  </div>

                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    VALIDADO
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                {/* 4 Layers Mapping */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900/60 text-xs">
                    <span className="font-semibold text-sky-600 dark:text-sky-400 block mb-0.5">
                      Capa 1: Presentación
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">{item.layerMapping.presentation}</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900/60 text-xs">
                    <span className="font-semibold text-purple-600 dark:text-purple-400 block mb-0.5">
                      Capa 2: Controladores / API
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">{item.layerMapping.controllerGateway}</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900/60 text-xs">
                    <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-0.5">
                      Capa 3: Lógica de Negocio
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">{item.layerMapping.businessService}</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900/60 text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                      Capa 4: Persistencia & BD
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">{item.layerMapping.persistenceDb}</span>
                  </div>
                </div>

                {/* Technical Pattern & Verification Evidence */}
                <div className="space-y-1.5 text-xs bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                  <div>
                    <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                      Patrón Spring Boot / Hibernate:{' '}
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                      {item.springHibernatePattern}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                      Evidencia de Validación:{' '}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                      {item.validationEvidence}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 3: PATRONES SPRING BOOT & HIBERNATE */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'SPRING_CODE' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-400" />
              <span>Implementación Canónica con Spring Boot 3.x, Spring Data JPA & Hibernate</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              La arquitectura del sistema modela formalmente la correspondencia entre los estándares de la plataforma corporativa Java Spring Boot y la solución full-stack ejecutada. A continuación se presentan los fragmentos equivalentes de producción para cada capa:
            </p>

            {/* Code Block 1: Service con Transacción ACID y Algoritmo de Cruces */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-amber-300 flex items-center gap-1 font-mono">
                <span>[Capa 3 - Servicio Transaccional] MatriculaService.java</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
{`@Service
@Transactional(readOnly = true)
public class MatriculaServiceImpl implements MatriculaService {

    private final GrupoRepository grupoRepository;
    private final MatriculaRepository matriculaRepository;
    private final AuditoriaService auditoriaService;

    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public MatriculaResponseDto matricularEstudiante(String estudianteId, String grupoId) {
        // 1. Bloqueo pesimista a nivel de fila (RNF-07)
        Grupo grupo = grupoRepository.findByIdWithPessimisticLock(grupoId)
            .orElseThrow(() -> new EntityNotFoundException("Grupo no existe"));

        // 2. Validación de cupos síncrona (RF-07)
        if (grupo.getCupoOcupado() >= grupo.getCupoMaximo()) {
            throw new CupoAgotadoException("El grupo ha alcanzado su capacidad máxima");
        }

        // 3. Bloqueo de duplicidad en la misma asignatura en el periodo (RF-07)
        if (matriculaRepository.existsByEstudianteAndAsignaturaAndPeriodo(
                estudianteId, grupo.getAsignatura().getId(), grupo.getPeriodo().getId())) {
            throw new MatriculaDuplicadaException("Estudiante ya matriculado en esta materia");
        }

        // 4. Incremento atómico y persistencia
        grupo.setCupoOcupado(grupo.getCupoOcupado() + 1);
        Matricula matricula = new Matricula(estudianteId, grupo);
        matriculaRepository.save(matricula);

        // 5. Bitácora inmutable de auditoría (RF-12)
        auditoriaService.registrarEvento("MATRICULA", "MATRICULAS", matricula.getId());

        return MatriculaMapper.toDto(matricula);
    }
}`}
              </pre>
            </div>

            {/* Code Block 2: Controlador REST con RBAC */}
            <div className="space-y-1 pt-4">
              <div className="text-xs font-semibold text-purple-300 flex items-center gap-1 font-mono">
                <span>[Capa 2 - Controlador REST & RBAC] MatriculaController.java</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
{`@RestController
@RequestMapping("/api/v1/matriculas")
@Tag(name = "Matrículas", description = "Servicio transaccional de matrículas académicas (RF-07)")
public class MatriculaController {

    private final MatriculaService matriculaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINADOR', 'ESTUDIANTE')")
    @Operation(summary = "Realizar matrícula transaccional (RF-07)")
    @ApiResponse(responseCode = "201", description = "Matrícula confirmada con éxito")
    @ApiResponse(responseCode = "400", description = "Cupo agotado o cruce de horarios detectado")
    public ResponseEntity<MatriculaResponseDto> matricular(
            @Valid @RequestBody MatriculaRequestDto dto,
            @AuthenticationPrincipal UserDetails principal) {
        
        MatriculaResponseDto response = matriculaService.matricularEstudiante(
            dto.getEstudianteId(), dto.getGrupoId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}`}
              </pre>
            </div>

            {/* Code Block 3: Entidad Hibernate con Borrado Lógico */}
            <div className="space-y-1 pt-4">
              <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1 font-mono">
                <span>[Capa 4 - Entidad JPA / Hibernate] Estudiante.java</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
{`@Entity
@Table(name = "estudiante", indexes = {
    @Index(name = "idx_estudiante_doc", columnList = "documento_identidad", unique = true),
    @Index(name = "idx_estudiante_programa", columnList = "programa_id")
})
@SQLDelete(sql = "UPDATE estudiante SET estado = 'INACTIVO' WHERE id = ?") // Borrado lógico RF-03
public class Estudiante extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "documento_identidad", nullable = false, unique = true, length = 20)
    private String documentoIdentidad; // RF-03: Validación unicidad

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoEstudiante estado = EstadoEstudiante.ACTIVO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programa_id", nullable = false)
    private ProgramaAcademico programa;
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 4: CONTRATO OPENAPI 3.0 (RNF-08) */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'OPENAPI' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Especificación Técnica OpenAPI 3.0 (Swagger)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interoperabilidad estandarizada para integración con plataformas institucionales (RNF-08).
              </p>
            </div>
            <button
              onClick={handleCopyOpenApi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              {copiedOpenApi ? (
                <>
                  <Check className="w-3.5 h-3.5" /> <span>Copiado al portapapeles</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> <span>Copiar JSON OpenAPI</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 overflow-x-auto text-emerald-400 font-mono text-xs max-h-[500px]">
            <pre>{JSON.stringify(openApiSpecification, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
