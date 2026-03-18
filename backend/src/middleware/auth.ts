import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env['JWT_SECRET'] || 'supersecretkey_POS_2025';

export interface AuthRequest extends Request {
  restaurantId?: string;
  restaurant?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { restaurantId: string };

    const rest = await prisma.restaurant.findUnique({ where: { id: decoded.restaurantId } });
    if (!rest) {
      res.status(401).json({ error: 'Restaurant does not exist.' });
      return;
    }

    if (!rest.isActive) {
      res.status(403).json({ error: 'Access Revoked. Please contact administrator.' });
      return;
    }

    req.restaurantId = decoded.restaurantId;
    req.restaurant = rest;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
