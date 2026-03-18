import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = Router();
const JWT_SECRET = process.env['JWT_SECRET'] || 'supersecretkey_POS_2025';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, ownerName, userId, password } = req.body as {
      name: string;
      ownerName: string;
      userId: string;
      password: string;
    };

    if (!name || !ownerName || !userId || !password) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    const existing = await prisma.restaurant.findUnique({ where: { userId } });
    if (existing) {
      res.status(409).json({ error: 'User ID already registered.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        ownerName,
        userId,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ restaurantId: restaurant.id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, restaurant: { id: restaurant.id, name: restaurant.name, ownerName: restaurant.ownerName, userId: restaurant.userId, isSuperAdmin: restaurant.isSuperAdmin } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, password } = req.body as { userId: string; password: string };
    console.log('Login attempt for User ID:', userId);

    if (!userId || !password) {
      res.status(400).json({ error: 'User ID and password are required.' });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { userId } });
    if (!restaurant) {
      console.log('User not found:', userId);
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, restaurant.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', userId);
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const token = jwt.sign({ restaurantId: restaurant.id }, JWT_SECRET, { expiresIn: '30d' });
    console.log('Login successful for user:', userId);
    res.json({ token, restaurant: { id: restaurant.id, name: restaurant.name, ownerName: restaurant.ownerName, userId: restaurant.userId, isSuperAdmin: restaurant.isSuperAdmin } });
  } catch (err: any) {
    console.error('CRITICAL LOGIN ERROR:', err);
    res.status(500).json({ error: 'Server error during login. Check logs.' });
  }
});

import { authenticate, AuthRequest } from '../middleware/auth.js';
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const rest = await prisma.restaurant.findUnique({ where: { id: req.restaurantId } });
  if (!rest) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id: rest.id, name: rest.name, ownerName: rest.ownerName, userId: rest.userId, isSuperAdmin: rest.isSuperAdmin, address: rest.address, mobile: rest.mobile, gstNumber: rest.gstNumber, gstRate: rest.gstRate, warmMessage: rest.warmMessage });
});

router.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, ownerName, address, mobile, password, gstNumber, gstRate, warmMessage } = req.body;
    
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (ownerName !== undefined) data.ownerName = ownerName;
    if (address !== undefined) data.address = address;
    if (mobile !== undefined) data.mobile = mobile;
    if (gstNumber !== undefined) data.gstNumber = gstNumber;
    if (gstRate !== undefined) data.gstRate = parseFloat(gstRate) || 0;
    if (warmMessage !== undefined) data.warmMessage = warmMessage;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.restaurant.update({
      where: { id: req.restaurantId },
      data
    });
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
