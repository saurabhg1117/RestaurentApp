import { Router, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/bills  — Create a new bill
// Body: { items: [{ menuItemId, quantity }], gstRate: 0 | 5 | 18, gstNumber?: string }
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, gstRate = 0, gstNumber } = req.body as {
      items: { menuItemId: string; quantity: number }[];
      gstRate: number;
      gstNumber?: string;
    };

    if (!items || items.length === 0) {
      res.status(400).json({ error: 'Bill must have at least one item.' });
      return;
    }

    if (gstRate > 0 && !gstNumber) {
      res.status(400).json({ error: 'GST Number is required for 5% or 18% GST bills.' });
      return;
    }

    // Fetch all menu items to validate and get prices
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId: req.restaurantId },
    });

    if (menuItems.length !== menuItemIds.length) {
      res.status(400).json({ error: 'One or more menu items not found.' });
      return;
    }

    // Calculate subTotal
    let subTotal = 0;
    const billItemsData = items.map((i) => {
      const menuItem = menuItems.find((m) => m.id === i.menuItemId)!;
      const lineTotal = menuItem.price * i.quantity;
      subTotal += lineTotal;
      return {
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        price: menuItem.price,
      };
    });

    // Calculate GST Amounts
    const gstAmount = (subTotal * gstRate) / 100;
    const totalAmount = subTotal + gstAmount;

    const bill = await prisma.bill.create({
      data: {
        subTotal,
        gstRate,
        gstAmount,
        totalAmount,
        gstNumber: gstRate > 0 ? gstNumber : null,
        restaurantId: req.restaurantId!,
        items: { create: billItemsData },
      },
      include: {
        restaurant: true,
        items: { include: { menuItem: true } },
      },
    });

    res.status(201).json(bill);
  } catch (err) {
    console.error('Error creating bill:', err);
    res.status(500).json({ error: 'Error creating bill.' });
  }
});

// GET /api/bills  — Get all bills for a restaurant
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const bills = await prisma.bill.findMany({
    where: { restaurantId: req.restaurantId },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(bills);
});

// GET /api/bills/:id  — Get a single bill (for duplicate print)
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const bill = await prisma.bill.findFirst({
    where: { id: req.params['id'] as string, restaurantId: req.restaurantId },
    include: { items: { include: { menuItem: true } } },
  });
  if (!bill) { res.status(404).json({ error: 'Bill not found.' }); return; }
  res.json(bill);
});

// GET /api/bills/analytics/summary  — Revenue analytics
router.get('/analytics/summary', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { from, to } = req.query as { from?: string; to?: string };

  const where: { restaurantId: string; createdAt?: { gte?: Date; lte?: Date } } = {
    restaurantId: req.restaurantId!,
  };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const bills = await prisma.bill.findMany({ where });

  const totalRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalBills = bills.length;
  const avgBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;

  // Group by date for daily chart data
  const dailyMap: Record<string, number> = {};
  for (const bill of bills) {
    const day = bill.createdAt.toISOString().split('T')[0]!;
    dailyMap[day] = (dailyMap[day] ?? 0) + bill.totalAmount;
  }
  const dailyRevenue = Object.entries(dailyMap)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({ totalRevenue, totalBills, avgBillValue, dailyRevenue });
});

export default router;
