import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET  = process.env.JWT_SECRET || 'iotec-secret-dev-only';
const JWT_EXPIRES = '24h';

// ── POST /api/auth/register ────────────────────────────
export async function register(req, res) {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { nombre, email, password: hash }
    });

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    console.log(`✅ Nuevo agente registrado: ${user.nombre} <${user.email}>`);
    res.status(201).json({ token, user: { id: user.id, nombre: user.nombre, email: user.email } });
  } catch (error) {
    console.error('Error en register:', error.message);
    res.status(500).json({ error: 'Error interno.' });
  }
}

// ── POST /api/auth/login ───────────────────────────────
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    console.log(`🔐 Login: ${user.nombre} <${user.email}>`);
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email } });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Error interno.' });
  }
}

// ── GET /api/auth/me ───────────────────────────────────
export async function me(req, res) {
  // req.user se inyecta por el middleware
  res.json({ user: req.user });
}
