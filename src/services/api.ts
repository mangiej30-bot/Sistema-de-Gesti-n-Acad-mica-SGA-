/**
 * Client-Side API Bridge & Layer Call Tracer
 * Connects the React application with the backend Layer 2 (REST Controllers),
 * measuring real response times for RNF-02 (< 3s SLA) and providing live trace logs.
 */

import {
  UsuarioDto,
  EstudianteDto,
  DocenteDto,
  GrupoDetalladoDto,
  MatriculaResponseDto,
  CalificacionConsolidadaDto,
  ReporteConsolidadoDto
} from '../backend/dto/dtos.ts';
import {
  ProgramaAcademico,
  Asignatura,
  PeriodoAcademico,
  AuditoriaLog
} from '../backend/domain/models.ts';

export interface LayerTrace {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  durationMs: number;
  layers: {
    presentation: string;
    controller: string;
    service: string;
    persistence: string;
  };
}

export const DEFAULT_ADMIN_USER: UsuarioDto = {
  id: 'usr-admin-1',
  email: 'admin@universidad.edu.co',
  nombreCompleto: 'Carlos Mendoza',
  rol: 'ADMIN',
  documentoIdentidad: '1098765432'
};

export function generateJwtToken(user: UsuarioDto): string {
  const payload = {
    sub: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombreCompleto,
    perfilId: user.perfilId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 // 7 days
  };
  return `siga_jwt_${btoa(JSON.stringify(payload))}`;
}

class ApiService {
  private token: string | null = null;
  private currentUser: UsuarioDto | null = null;
  private traces: LayerTrace[] = [];
  private traceListeners: ((traces: LayerTrace[]) => void)[] = [];

  constructor() {
    // Restore session if available
    const savedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('siga_token') : null;
    const savedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('siga_user') : null;
    if (savedToken && savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.token = savedToken;
      } catch {
        this.currentUser = DEFAULT_ADMIN_USER;
        this.token = generateJwtToken(DEFAULT_ADMIN_USER);
      }
    } else {
      // Synchronous default session for instant access without race condition
      this.currentUser = DEFAULT_ADMIN_USER;
      this.token = generateJwtToken(DEFAULT_ADMIN_USER);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('siga_token', this.token);
        localStorage.setItem('siga_user', JSON.stringify(this.currentUser));
      }
    }
  }

  public subscribeTraces(cb: (traces: LayerTrace[]) => void) {
    this.traceListeners.push(cb);
    cb(this.traces);
    return () => {
      this.traceListeners = this.traceListeners.filter(l => l !== cb);
    };
  }

  private addTrace(trace: LayerTrace) {
    this.traces.unshift(trace);
    if (this.traces.length > 50) this.traces.pop();
    this.traceListeners.forEach(cb => cb(this.traces));
  }

  public getToken(): string | null {
    return this.token;
  }

  public getCurrentUser(): UsuarioDto | null {
    return this.currentUser;
  }

  public setSession(token: string, user: UsuarioDto) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem('siga_token', token);
    localStorage.setItem('siga_user', JSON.stringify(user));
  }

  public clearSession() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('siga_token');
    localStorage.removeItem('siga_user');
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    body?: any,
    layerDetails?: { controller: string; service: string; persistence: string }
  ): Promise<T> {
    const startTime = performance.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (!this.token) {
      this.token = generateJwtToken(this.currentUser || DEFAULT_ADMIN_USER);
    }
    headers['Authorization'] = `Bearer ${this.token}`;

    try {
      const response = await fetch(`/api/v1${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const durationMs = Math.round(performance.now() - startTime);

      let data: any;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      this.addTrace({
        id: `trc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        endpoint,
        method,
        status: response.status,
        durationMs,
        layers: {
          presentation: 'React Component (State & UI Hook)',
          controller: layerDetails?.controller || 'REST Controller Layer',
          service: layerDetails?.service || 'Domain Service Layer',
          persistence: layerDetails?.persistence || 'Hibernate/JPA Repository'
        }
      });

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          // If token was invalid or expired, heal by renewing session token
          this.token = generateJwtToken(this.currentUser || DEFAULT_ADMIN_USER);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('siga_token', this.token);
          }
        }
        throw new Error(data?.mensaje || `Error en la solicitud HTTP ${response.status}`);
      }

      return data as T;
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      this.addTrace({
        id: `trc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        endpoint,
        method,
        status: 500,
        durationMs,
        layers: {
          presentation: 'React Component (Error Handler)',
          controller: layerDetails?.controller || 'REST Controller Layer',
          service: layerDetails?.service || 'Domain Service Layer',
          persistence: layerDetails?.persistence || 'Hibernate/JPA Repository'
        }
      });
      throw err;
    }
  }

  // Auth (RF-01)
  public async login(email: string, passwordPlain: string) {
    const res = await this.request<{ token: string; usuario: UsuarioDto }>(
      '/auth/login',
      'POST',
      { email, password: passwordPlain },
      {
        controller: 'AuthController.login() [HTTP POST]',
        service: 'AuthService.authenticate() & Argon2/Bcrypt validation',
        persistence: 'UsuarioRepository.findByEmail()'
      }
    );
    this.setSession(res.token, res.usuario);
    return res;
  }

  public async logout() {
    try {
      await this.request('/auth/logout', 'POST', {}, {
        controller: 'AuthController.logout()',
        service: 'AuthService.logout() & Token Invalidation',
        persistence: 'AuditoriaRepository.save()'
      });
    } finally {
      this.clearSession();
    }
  }

  // Estudiantes (RF-03)
  public async getEstudiantes(soloActivos = false) {
    return this.request<EstudianteDto[]>(
      `/estudiantes?soloActivos=${soloActivos}`,
      'GET',
      undefined,
      {
        controller: 'EstudianteController.listarEstudiantes()',
        service: 'EstudianteService.listarTodos() [DTO Projection]',
        persistence: 'EstudianteRepository.findAll() / PostgreSQL Index on documento'
      }
    );
  }

  public async createEstudiante(data: any) {
    return this.request<EstudianteDto>(
      '/estudiantes',
      'POST',
      data,
      {
        controller: 'EstudianteController.crearEstudiante()',
        service: 'EstudianteService.crear() [Unicidad de documento RF-03]',
        persistence: 'EstudianteRepository.save() & UsuarioRepository.save()'
      }
    );
  }

  public async updateEstudiante(id: string, data: any) {
    return this.request<EstudianteDto>(
      `/estudiantes/${id}`,
      'PUT',
      data,
      {
        controller: 'EstudianteController.actualizarEstudiante()',
        service: 'EstudianteService.actualizar()',
        persistence: 'EstudianteRepository.save()'
      }
    );
  }

  public async desactivarEstudiante(id: string) {
    return this.request<{ success: boolean; mensaje: string }>(
      `/estudiantes/${id}/desactivar`,
      'DELETE',
      undefined,
      {
        controller: 'EstudianteController.desactivar()',
        service: 'EstudianteService.desactivarLogico() [Soft Delete RF-03]',
        persistence: 'EstudianteRepository.desactivarLogico()'
      }
    );
  }

  // Docentes (RF-04)
  public async getDocentes(soloActivos = false) {
    return this.request<DocenteDto[]>(
      `/docentes?soloActivos=${soloActivos}`,
      'GET',
      undefined,
      {
        controller: 'DocenteController.listarDocentes()',
        service: 'DocenteService.listarTodos()',
        persistence: 'DocenteRepository.findAll()'
      }
    );
  }

  public async createDocente(data: any) {
    return this.request<DocenteDto>(
      '/docentes',
      'POST',
      data,
      {
        controller: 'DocenteController.crearDocente()',
        service: 'DocenteService.crear() [Validación Departamento]',
        persistence: 'DocenteRepository.save()'
      }
    );
  }

  public async desactivarDocente(id: string) {
    return this.request<{ success: boolean; mensaje: string }>(
      `/docentes/${id}/desactivar`,
      'DELETE',
      undefined,
      {
        controller: 'DocenteController.desactivar()',
        service: 'DocenteService.desactivarLogico() [Soft Delete RF-04]',
        persistence: 'DocenteRepository.desactivarLogico()'
      }
    );
  }

  // Curricular (RF-05)
  public async getProgramas() {
    return this.request<ProgramaAcademico[]>(
      '/curricular/programas',
      'GET',
      undefined,
      {
        controller: 'CurricularController.listarProgramas()',
        service: 'CurricularService.listarProgramas()',
        persistence: 'CurricularRepository.findAllProgramas()'
      }
    );
  }

  public async createPrograma(data: any) {
    return this.request<ProgramaAcademico>(
      '/curricular/programas',
      'POST',
      data,
      {
        controller: 'CurricularController.crearPrograma()',
        service: 'CurricularService.crearPrograma() [Código único]',
        persistence: 'CurricularRepository.savePrograma()'
      }
    );
  }

  public async updatePrograma(id: string, data: any) {
    return this.request<ProgramaAcademico>(
      `/curricular/programas/${id}`,
      'PUT',
      data,
      {
        controller: 'CurricularController.actualizarPrograma()',
        service: 'CurricularService.actualizarPrograma() [Validación código y créditos]',
        persistence: 'CurricularRepository.savePrograma()'
      }
    );
  }

  public async getAsignaturas(programaId?: string) {
    const q = programaId ? `?programaId=${programaId}` : '';
    return this.request<(Asignatura & { programaNombre?: string })[]>(
      `/curricular/asignaturas${q}`,
      'GET',
      undefined,
      {
        controller: 'CurricularController.listarAsignaturas()',
        service: 'CurricularService.listarAsignaturas()',
        persistence: 'CurricularRepository.findAllAsignaturas()'
      }
    );
  }

  public async createAsignatura(data: any) {
    return this.request<Asignatura>(
      '/curricular/asignaturas',
      'POST',
      data,
      {
        controller: 'CurricularController.crearAsignatura()',
        service: 'CurricularService.crearAsignatura() [Créditos > 0 y Código Único RF-05]',
        persistence: 'CurricularRepository.saveAsignatura()'
      }
    );
  }

  public async updateAsignatura(id: string, data: any) {
    return this.request<Asignatura>(
      `/curricular/asignaturas/${id}`,
      'PUT',
      data,
      {
        controller: 'CurricularController.actualizarAsignatura()',
        service: 'CurricularService.actualizarAsignatura() [Créditos > 0 y Código Único RF-05]',
        persistence: 'CurricularRepository.saveAsignatura()'
      }
    );
  }

  // Programación & Cruces (RF-06)
  public async getPeriodos() {
    return this.request<PeriodoAcademico[]>(
      '/programacion/periodos',
      'GET',
      undefined,
      {
        controller: 'ProgramacionController.listarPeriodos()',
        service: 'ProgramacionService.listarPeriodos()',
        persistence: 'ProgramacionRepository.findAllPeriodos()'
      }
    );
  }

  public async toggleVentanaNotas(periodoId: string, permite: boolean) {
    return this.request<PeriodoAcademico>(
      `/programacion/periodos/${periodoId}/fechas-notas`,
      'PATCH',
      { permite },
      {
        controller: 'ProgramacionController.alternarFechasNotas()',
        service: 'ProgramacionService.alternarFechasNotas() [Control de Calendario RF-08]',
        persistence: 'ProgramacionRepository.savePeriodo()'
      }
    );
  }

  public async getGrupos(periodoId?: string) {
    const q = periodoId ? `?periodoId=${periodoId}` : '';
    return this.request<GrupoDetalladoDto[]>(
      `/programacion/grupos${q}`,
      'GET',
      undefined,
      {
        controller: 'ProgramacionController.listarGrupos()',
        service: 'ProgramacionService.listarGrupos() [Join Asignatura, Docente, Cupos]',
        persistence: 'ProgramacionRepository.findAllGrupos()'
      }
    );
  }

  public async createGrupo(data: any) {
    return this.request<GrupoDetalladoDto>(
      '/programacion/grupos',
      'POST',
      data,
      {
        controller: 'ProgramacionController.crearGrupo()',
        service: 'ProgramacionService.validarCrucesHorarios() [Algoritmo de Colisión RF-06]',
        persistence: 'ProgramacionRepository.saveGrupo()'
      }
    );
  }

  // Matrícula (RF-07)
  public async matricular(estudianteId: string, grupoId: string) {
    return this.request<MatriculaResponseDto>(
      '/matriculas',
      'POST',
      { estudianteId, grupoId },
      {
        controller: 'MatriculaController.matricular()',
        service: 'MatriculaService.realizarMatricula() [@Transactional & Cupo > 0 & No Duplicidad RF-07]',
        persistence: 'Pessimistic Lock (SELECT FOR UPDATE) & MatriculaRepository.save()'
      }
    );
  }

  public async getMatriculasEstudiante(estudianteId: string, periodoId?: string) {
    const q = periodoId ? `?periodoId=${periodoId}` : '';
    return this.request<MatriculaResponseDto[]>(
      `/matriculas/estudiante/${estudianteId}${q}`,
      'GET',
      undefined,
      {
        controller: 'MatriculaController.listarPorEstudiante()',
        service: 'MatriculaService.listarMatriculasEstudiante()',
        persistence: 'MatriculaRepository.findByEstudianteAndPeriodo()'
      }
    );
  }

  public async cancelarMatricula(matriculaId: string) {
    return this.request<{ success: boolean; mensaje: string }>(
      `/matriculas/${matriculaId}`,
      'DELETE',
      undefined,
      {
        controller: 'MatriculaController.cancelar()',
        service: 'MatriculaService.cancelarMatricula() [Liberación de cupo]',
        persistence: 'MatriculaRepository.save() & GrupoRepository.save()'
      }
    );
  }

  // Calificaciones (RF-08 & RF-09)
  public async registrarNota(data: { docenteId: string; matriculaId: string; corte: 1 | 2 | 3; nota: number; observaciones?: string }) {
    return this.request<any>(
      '/calificaciones',
      'POST',
      data,
      {
        controller: 'CalificacionController.registrarNota()',
        service: 'CalificacionService.registrarCalificacion() [Validación Titularidad & Fechas RF-08]',
        persistence: 'CalificacionRepository.save() & Recálculo Promedios'
      }
    );
  }

  public async getSabanaNotasGrupo(grupoId: string) {
    return this.request<CalificacionConsolidadaDto[]>(
      `/calificaciones/grupo/${grupoId}`,
      'GET',
      undefined,
      {
        controller: 'CalificacionController.sabanaNotas()',
        service: 'CalificacionService.obtenerSabanaNotasGrupo()',
        persistence: 'CalificacionRepository.findByGrupo()'
      }
    );
  }

  public async getKardexEstudiante(estudianteId: string) {
    return this.request<{
      estudiante: EstudianteDto;
      promedioAcumulado: number;
      totalCreditosAprobados: number;
      asignaturas: any[];
    }>(
      `/calificaciones/kardex/${estudianteId}`,
      'GET',
      undefined,
      {
        controller: 'CalificacionController.kardex()',
        service: 'CalificacionService.obtenerKardexEstudiante() [Cálculo Ponderado RF-09]',
        persistence: 'Direct Index Read (RNF-02 Performance)'
      }
    );
  }

  // Reportes (RF-10)
  public async getReporteConsolidado(periodoId?: string) {
    const q = periodoId ? `?periodoId=${periodoId}` : '';
    return this.request<ReporteConsolidadoDto>(
      `/reportes/consolidado${q}`,
      'GET',
      undefined,
      {
        controller: 'ReporteController.consolidado()',
        service: 'ReporteService.generarReporteConsolidado() [Agregación Analítica RF-10]',
        persistence: 'Read-only Aggregation Views'
      }
    );
  }

  // Auditoría (RF-12)
  public async getAuditoria() {
    return this.request<AuditoriaLog[]>(
      '/auditoria',
      'GET',
      undefined,
      {
        controller: 'AuditoriaController.listar()',
        service: 'AuditoriaService.obtenerLogs() [Bitácora Inmutable RF-12]',
        persistence: 'AuditoriaRepository.findAll() / ORDER BY timestamp DESC'
      }
    );
  }

  // Reset datos
  public async resetDatos() {
    return this.request<any>(
      '/sistema/reset',
      'POST',
      {},
      {
        controller: 'AdminController.reset()',
        service: 'DatabaseContext.resetToDefaults()',
        persistence: 'Re-seed relational tables'
      }
    );
  }
}

export const api = new ApiService();
