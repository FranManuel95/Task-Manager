// backend/src/routes/proyectos.ts
import { Router } from 'express';
import { prisma } from '../db';
import { EstadoMap, mapProyecto, mapTarea } from '../mappers';

const r = Router();

/** GET /api/proyectos/:id */
r.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      include: {
        tareas: { orderBy: { createdAt: 'asc' } },
        usuarios: true,
      },
    });

    if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
    return res.json(mapProyecto(proyecto));
  } catch (e) { next(e); }
});

/** POST /api/proyectos */
r.post('/', async (req, res, next) => {
  try {
    const { nombre, descripcion, color, deadline, usuarios = [] } = req.body as {
      nombre: string; descripcion?: string; color?: string; deadline?: string | null; usuarios?: string[];
    };

    // por simplicidad, creadoPor = primer usuario si llega, si no "anon"
    const creador = (usuarios[0] ?? 'anon').toLowerCase();

    const created = await prisma.proyecto.create({
      data: {
        nombre,
        descripcion: descripcion ?? '',
        color: color ?? '#3B82F6',
        deadline: deadline ? new Date(deadline) : null,
        creadoPor: creador,
        usuarios: {
          create: (usuarios ?? []).map(email => ({ email: email.toLowerCase() })),
        },
      },
      include: {
        tareas: true,
        usuarios: true,
      },
    });

    return res.status(201).json(mapProyecto(created));
  } catch (e) { next(e); }
});

/** PATCH /api/proyectos/:id */
r.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, color, deadline } = req.body as {
      nombre?: string; descripcion?: string; color?: string; deadline?: string | null;
    };

    const updated = await prisma.proyecto.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(descripcion !== undefined ? { descripcion } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
      },
      include: { tareas: true, usuarios: true },
    });

    return res.json(mapProyecto(updated));
  } catch (e) { next(e); }
});

/** DELETE /api/proyectos/:id */
r.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.proyecto.delete({ where: { id } });
    return res.status(204).end();
  } catch (e) { next(e); }
});

/** POST /api/proyectos/:id/usuarios  { usuario } */
r.post('/:id/usuarios', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usuario } = req.body as { usuario: string };
    if (!usuario) return res.status(400).json({ error: 'usuario requerido' });

    // upsert-like: si ya existe, no explota
    await prisma.proyectoUsuario.upsert({
      where: { proyectoId_email: { proyectoId: id, email: usuario.toLowerCase() } },
      create: { proyectoId: id, email: usuario.toLowerCase() },
      update: {},
    });

    const p = await prisma.proyecto.findUnique({
      where: { id },
      include: { tareas: true, usuarios: true },
    });
    if (!p) return res.status(404).json({ error: 'Proyecto no encontrado' });
    return res.json(mapProyecto(p));
  } catch (e) { next(e); }
});

/** DELETE /api/proyectos/:id/usuarios/:email */
r.delete('/:id/usuarios/:email', async (req, res, next) => {
  try {
    const { id, email } = req.params;
    await prisma.proyectoUsuario.delete({
      where: { proyectoId_email: { proyectoId: id, email: email.toLowerCase() } },
    });
    return res.status(204).end();
  } catch (e) { next(e); }
});

/** POST /api/proyectos/:id/tareas */
r.post('/:id/tareas', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, prioridad, deadline, etiquetas, estado } = req.body as {
      titulo: string; descripcion?: string; prioridad: 'baja'|'media'|'alta';
      deadline?: string | null; etiquetas?: string[]; estado?: 'por-hacer'|'en-progreso'|'completado';
    };
    const created = await prisma.tarea.create({
      data: {
        proyectoId: id,
        titulo,
        descripcion: descripcion ?? '',
        prioridad,
        deadline: deadline ? new Date(deadline) : null,
        etiquetas: etiquetas ?? [],
        estado: EstadoMap.fromWire(estado ?? 'por-hacer'),
      },
    });
    return res.status(201).json(mapTarea(created));
  } catch (e) { next(e); }
});

/** PATCH /api/proyectos/:id/tareas/:tareaId */
r.patch('/:id/tareas/:tareaId', async (req, res, next) => {
  try {
    const { tareaId } = req.params;
    const { titulo, descripcion, prioridad, deadline, etiquetas } = req.body as {
      titulo?: string; descripcion?: string; prioridad?: 'baja'|'media'|'alta';
      deadline?: string | null; etiquetas?: string[];
    };
    const updated = await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        ...(titulo !== undefined ? { titulo } : {}),
        ...(descripcion !== undefined ? { descripcion } : {}),
        ...(prioridad !== undefined ? { prioridad } : {}),
        ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
        ...(etiquetas !== undefined ? { etiquetas } : {}),
      },
    });
    return res.json(mapTarea(updated));
  } catch (e) { next(e); }
});

/** DELETE /api/proyectos/:id/tareas/:tareaId */
r.delete('/:id/tareas/:tareaId', async (req, res, next) => {
  try {
    const { tareaId } = req.params;
    await prisma.tarea.delete({ where: { id: tareaId } });
    return res.status(204).end();
  } catch (e) { next(e); }
});

/** POST /api/proyectos/:id/tareas/move  { tareaId, from, to } */
r.post('/:id/tareas/move', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tareaId, from, to } = req.body as {
      tareaId: string; from: 'por-hacer'|'en-progreso'|'completado'; to: 'por-hacer'|'en-progreso'|'completado';
    };
    if (!tareaId || !from || !to) return res.status(400).json({ error: 'payload inválido' });

    await prisma.tarea.update({
      where: { id: tareaId },
      data: { estado: EstadoMap.fromWire(to) },
    });

    const p = await prisma.proyecto.findUnique({
      where: { id },
      include: { tareas: true, usuarios: true },
    });
    if (!p) return res.status(404).json({ error: 'Proyecto no encontrado' });
    return res.json(mapProyecto(p));
  } catch (e) { next(e); }
});

/** GET /api/proyectos/:id/chat */
r.get('/:id/chat', async (req, res, next) => {
  try {
    const { id } = req.params;
    const msgs = await prisma.chatMessage.findMany({
      where: { proyectoId: id },
      orderBy: { ts: 'asc' },
      take: 200, // simple límite
    });
    return res.json(msgs.map(m => ({
      id: m.id,
      proyectoId: m.proyectoId,
      sender: m.sender,
      text: m.text,
      ts: m.ts.toISOString(),
    })));
  } catch (e) { next(e); }
});

/** POST /api/proyectos/:id/chat  { sender, text } */
r.post('/:id/chat', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sender, text } = req.body as { sender: string; text: string };
    if (!sender || !text) return res.status(400).json({ error: 'sender y text son requeridos' });

    const created = await prisma.chatMessage.create({
      data: { proyectoId: id, sender: sender.toLowerCase(), text },
    });

    return res.status(201).json({
      id: created.id,
      proyectoId: created.proyectoId,
      sender: created.sender,
      text: created.text,
      ts: created.ts.toISOString(),
    });
  } catch (e) { next(e); }
});

export default r;
