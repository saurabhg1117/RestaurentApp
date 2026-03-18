import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Middleware to verify Super Admin status
const superAdminOnly = async (req: AuthRequest, res: Response, next: Function) => {
  const admin = await prisma.restaurant.findUnique({ where: { id: req.restaurantId } });
  if (admin?.isSuperAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Super Admin only.' });
  }
};

// GET /api/admin/restaurants  — List all restaurants
router.get('/restaurants', authenticate, superAdminOnly, async (req: AuthRequest, res: Response) => {
  const restaurants = await prisma.restaurant.findMany({
     orderBy: { createdAt: 'desc' }
  });
  res.json(restaurants.map(r => ({ 
    id: r.id, 
    name: r.name, 
    email: r.email, 
    ownerName: r.ownerName, 
    isActive: r.isActive, 
    createdAt: r.createdAt 
  })));
});

// PATCH /api/admin/restaurants/:id/status — Toggle status
router.patch('/restaurants/:id/status', authenticate, superAdminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { isActive } = req.body;
        const updated = await prisma.restaurant.update({
            where: { id: req.params['id'] as string },
            data: { isActive: !!isActive }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

// POST /api/admin/restaurants — Create a new restaurant
router.post('/restaurants', authenticate, superAdminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, name, ownerName, password, address, mobile } = req.body;
    
    if (!userId || !password) {
       res.status(400).json({ error: 'User ID and Password are required.' });
       return;
    }

    const existing = await prisma.restaurant.findUnique({ where: { userId } });
    if (existing) {
       res.status(400).json({ error: 'User ID already exists' });
       return;
    }

    const hp = await bcrypt.hash(password, 10);
    const restaurant = await prisma.restaurant.create({
      data: { 
        userId, 
        password: hp, 
        name: name || 'My Restaurant', 
        ownerName: ownerName || 'Owner', 
        address: address || '', 
        mobile: mobile || '' 
      }
    });
    
    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// DELETE /api/admin/restaurants/:id — Remove a restaurant
router.delete('/restaurants/:id', authenticate, superAdminOnly, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.restaurant.delete({ where: { id: req.params['id'] as string } });
        res.json({ message: 'Restaurant deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete account.' });
    }
});

export default router;
