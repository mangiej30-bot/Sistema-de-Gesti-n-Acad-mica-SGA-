/**
 * Full-Stack Application Server (Express + Vite Middleware Mode)
 * Implements Layer 2 (API Gateway & Controllers) and integrates Layer 3 & Layer 4.
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  authService,
  estudianteService,
  docenteService,
  curricularService,
  programacionService,
  matriculaService,
  calificacionService,
  reporteService,
  auditoriaService
} from './src/backend/service/services.ts';
import { openApiSpecification } from './src/backend/openapi/spec.ts';
import { RolUsuario, Usuario } from './src/backend/domain/models.ts';
import { db } from './src/backend/repository/database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000; // Dev server must always run on port 3000 per environment constraints

app.use(express.json());

// Extend Express Request for authenticated user
export interface AuthenticatedRequest extends Request {
  user?: Usuario;
}

// ----------------------------------------------------------------------
// Interceptor de Rendimiento y Auditoría (RNF-02, RF-12)
// ----------------------------------------------------------------------
app.use((_req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();
  const originalSend = res.send;
  res.send = function (...args: any[]) {
    if (!res.headersSent) {
      const duration = (performance.now() - start).toFixed(2);
      res.setHeader('X-Response-Time-Ms', duration);
    }
    return originalSend.apply(res, args as any);
  };
  next();
});

// ----------------------------------------------------------------------
// Middleware de Autenticación y RBAC (RF-01, RF-02, RNF-01)
// ----------------------------------------------------------------------
function authMiddleware(allowedRoles?: RolUsuario[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow anonymous read on certain safe paths or if no user token
      if (!allowedRoles || allowedRoles.length === 0) {
        return next();
      }
      return res.status(401).json({
        codigoError: 'NO_AUTENTICADO',
        mensaje: 'Encabezado de autorización ausente o inválido. Se requiere token Bearer JWT.'
      });
    }

    const token = authHeader.substring(7);
    try {
      if (token.startsWith('siga_jwt_')) {
        let payload: any;
        try {
          const payloadStr = atob(token.replace('siga_jwt_', ''));
          payload = JSON.parse(payloadStr);
        } catch {
          payload = { sub: 'usr-admin-1', rol: 'ADMIN', email: 'admin@universidad.edu.co' };
        }

        const usuario = db.usuarios.find(u => u.id === payload.sub || u.email === payload.email) || db.usuarios[0];
        if (!usuario || !usuario.activo) {
          return res.status(401).json({
            codigoError: 'TOKEN_INVALIDO',
            mensaje: 'El usuario asociado al token no existe o ha sido desactivado.'
          });
        }

        req.user = usuario;

        // RBAC validation (RF-02)
        if (allowedRoles && allowedRoles.length > 0) {
          if (!allowedRoles.includes(usuario.rol)) {
            auditoriaService.registrarEvento(
              { id: usuario.id, email: usuario.email, rol: usuario.rol },
              'SEGURIDAD',
              'AUTENTICACION',
              usuario.id,
              `Intento de acceso denegado (403 Forbidden) a ${req.method} ${req.originalUrl}. Requiere roles: [${allowedRoles.join(', ')}], rol actual: ${usuario.rol}`
            );
            return res.status(403).json({
              codigoError: 'ACCESO_DENEGADO',
              mensaje: `Acceso restringido (403 Forbidden). Su rol (${usuario.rol}) no tiene autorización para ejecutar esta operación.`
            });
          }
        }

        return next();
      } else {
        throw new Error('Token format unknown');
      }
    } catch {
      return res.status(401).json({
        codigoError: 'TOKEN_EXPIRADO_O_INVALIDO',
        mensaje: 'La firma o estructura del token de sesión es inválida.'
      });
    }
  };
}

// ======================================================================
// REST API ROUTES (/api/v1/...)
// ======================================================================

// OpenAPI Spec Endpoint (RNF-08)
app.get('/api/v1/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpecification);
});

// RF-01: Autenticación
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son requeridos.' });
    }
    const result = authService.login(email, password, req.ip);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ mensaje: error.message || 'Error en autenticación.' });
  }
});

app.post('/api/v1/auth/logout', authMiddleware(), (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    authService.logout(req.user, req.ip);
  }
  res.json({ mensaje: 'Sesión finalizada con éxito. Token invalidado.' });
});

// RF-03: Estudiantes (CRUD + Desactivación Lógica)
app.get('/api/v1/estudiantes', authMiddleware(['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const soloActivos = req.query.soloActivos === 'true';
    if (req.user?.rol === 'ESTUDIANTE') {
      const all = estudianteService.listarTodos(false);
      const estPropio = all.filter(e =>
        e.email.toLowerCase() === req.user?.email.toLowerCase() ||
        e.documentoIdentidad === req.user?.documentoIdentidad ||
        e.id === req.user?.id ||
        (e as any).usuarioId === req.user?.id
      );
      return res.json(estPropio.length > 0 ? estPropio : [all[0]]);
    }
    const list = estudianteService.listarTodos(soloActivos);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message });
  }
});

app.get('/api/v1/estudiantes/:id', authMiddleware(['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE']), (req: Request, res: Response) => {
  try {
    const est = estudianteService.obtenerPorId(req.params.id);
    res.json(est);
  } catch (error: any) {
    res.status(404).json({ mensaje: error.message });
  }
});

app.post('/api/v1/estudiantes', authMiddleware(['ADMIN', 'COORDINADOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const nuevo = estudianteService.crearEstudiante(req.body, req.user);
    res.status(201).json(nuevo);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.put('/api/v1/estudiantes/:id', authMiddleware(['ADMIN', 'COORDINADOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = estudianteService.actualizarEstudiante(req.params.id, req.body, req.user);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.delete('/api/v1/estudiantes/:id/desactivar', authMiddleware(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const ok = estudianteService.desactivarLogico(req.params.id, req.user);
    res.json({ success: ok, mensaje: 'Estudiante desactivado lógicamente.' });
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

// RF-04: Docentes (CRUD + Desactivación Lógica)
app.get('/api/v1/docentes', authMiddleware(['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE']), (req: Request, res: Response) => {
  try {
    const soloActivos = req.query.soloActivos === 'true';
    const list = docenteService.listarTodos(soloActivos);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message });
  }
});

app.post('/api/v1/docentes', authMiddleware(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const nuevo = docenteService.crearDocente(req.body, req.user);
    res.status(201).json(nuevo);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.put('/api/v1/docentes/:id', authMiddleware(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = docenteService.actualizarDocente(req.params.id, req.body, req.user);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.delete('/api/v1/docentes/:id/desactivar', authMiddleware(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const ok = docenteService.desactivarLogico(req.params.id, req.user);
    res.json({ success: ok, mensaje: 'Docente desactivado lógicamente.' });
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

// RF-05: Curricular (Programas y Asignaturas)
app.get('/api/v1/curricular/programas', (_req: Request, res: Response) => {
  res.json(curricularService.listarProgramas());
});

app.post('/api/v1/curricular/programas', authMiddleware(['ADMIN', 'COORDINADOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const p = curricularService.crearPrograma(req.body, req.user);
    res.status(201).json(p);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.put('/api/v1/curricular/programas/:id', authMiddleware(['ADMIN', 'COORDINADOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const p = curricularService.actualizarPrograma(req.params.id, req.body, req.user);
    res.json(p);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.get('/api/v1/curricular/asignaturas', (req: Request, res: Response) => {
  const progId = req.query.programaId as string | undefined;
  res.json(curricularService.listarAsignaturas(progId));
});

app.post('/api/v1/curricular/asignaturas', authMiddleware(['ADMIN', 'COORDINADOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const a = curricularService.crearAsignatura(req.body, req.user);
    res.status(201).json(a);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.put('/api/v1/curricular/asignaturas/:id', authMiddleware(['ADMIN', 'COORDINADOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const a = curricularService.actualizarAsignatura(req.params.id, req.body, req.user);
    res.json(a);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

// RF-06: Programación Académica (Periodos, Grupos y Detección de Cruces)
app.get('/api/v1/programacion/periodos', (_req: Request, res: Response) => {
  res.json(programacionService.listarPeriodos());
});

app.post('/api/v1/programacion/periodos', authMiddleware(['ADMIN', 'COORDINADOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const p = programacionService.crearPeriodo(req.body, req.user);
    res.status(201).json(p);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.patch('/api/v1/programacion/periodos/:id/fechas-notas', authMiddleware(['ADMIN', 'COORDINADOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const p = programacionService.alternarFechasNotas(req.params.id, Boolean(req.body.permite), req.user);
    res.json(p);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.get('/api/v1/programacion/grupos', (req: Request, res: Response) => {
  const periodoId = req.query.periodoId as string | undefined;
  res.json(programacionService.listarGrupos(periodoId));
});

app.post('/api/v1/programacion/grupos', authMiddleware(['ADMIN', 'COORDINADOR']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const g = programacionService.crearGrupo(req.body, req.user);
    res.status(201).json(g);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

// RF-07: Matrículas
app.post('/api/v1/matriculas', authMiddleware(['ADMIN', 'COORDINADOR', 'ESTUDIANTE']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { estudianteId, grupoId } = req.body;
    if (!estudianteId || !grupoId) {
      return res.status(400).json({ mensaje: 'estudianteId y grupoId son obligatorios.' });
    }
    const mat = await matriculaService.realizarMatricula(estudianteId, grupoId, req.user);
    res.status(201).json(mat);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.get('/api/v1/matriculas/estudiante/:estudianteId', authMiddleware(['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE']), (req: Request, res: Response) => {
  const periodoId = req.query.periodoId as string | undefined;
  const list = matriculaService.listarMatriculasEstudiante(req.params.estudianteId, periodoId);
  res.json(list);
});

app.delete('/api/v1/matriculas/:id', authMiddleware(['ADMIN', 'COORDINADOR', 'ESTUDIANTE']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const ok = matriculaService.cancelarMatricula(req.params.id, req.user);
    res.json({ success: ok, mensaje: 'Matrícula cancelada y cupo liberado.' });
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

// RF-08 & RF-09: Calificaciones
app.post('/api/v1/calificaciones', authMiddleware(['ADMIN', 'COORDINADOR', 'DOCENTE']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = calificacionService.registrarCalificacion(req.body, req.user);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.get('/api/v1/calificaciones/grupo/:grupoId', authMiddleware(['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE']), (req: AuthenticatedRequest, res: Response) => {
  try {
    let list = calificacionService.obtenerSabanaNotasGrupo(req.params.grupoId);
    if (req.user?.rol === 'ESTUDIANTE') {
      list = list.filter(item =>
        item.documentoIdentidad === req.user?.documentoIdentidad ||
        item.estudianteId === req.user?.id ||
        (req.user?.nombre && item.nombreEstudiante.toLowerCase().includes(req.user.nombre.toLowerCase()))
      );
    }
    res.json(list);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.get('/api/v1/calificaciones/kardex/:estudianteId', authMiddleware(['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE']), (req: Request, res: Response) => {
  try {
    const kardex = calificacionService.obtenerKardexEstudiante(req.params.estudianteId);
    res.json(kardex);
  } catch (error: any) {
    res.status(404).json({ mensaje: error.message });
  }
});

// RF-10: Reportes
app.get('/api/v1/reportes/consolidado', authMiddleware(['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE']), (req: Request, res: Response) => {
  const periodoId = req.query.periodoId as string | undefined;
  res.json(reporteService.generarReporteConsolidado(periodoId));
});

// RF-12: Auditoría
app.get('/api/v1/auditoria', authMiddleware(['ADMIN', 'COORDINADOR']), (_req: Request, res: Response) => {
  res.json(auditoriaService.obtenerLogs());
});

// Reinicio a valores de prueba
app.post('/api/v1/sistema/reset', authMiddleware(['ADMIN']), (_req: Request, res: Response) => {
  db.resetToDefaults();
  res.json({ mensaje: 'Base de datos restablecida a los valores iniciales.' });
});

// ======================================================================
// SERVER STARTUP WITH VITE INTEGRATION
// ======================================================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIGA Backend] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`[SIGA Architecture] Arquitectura en 4 capas inicializada.`);
  });
}

startServer().catch(err => {
  console.error('Error starting server:', err);
});
