import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'iotec-secret-dev-only';

/**
 * Middleware que verifica el JWT en Authorization: Bearer <token>
 * Si el token es válido, adjunta req.user = { id, nombre, email }
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Autenticación requerida.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, nombre: payload.nombre, email: payload.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Ingresá de nuevo.', expired: true });
    }
    return res.status(401).json({ error: 'Token inválido.' });
  }
}
