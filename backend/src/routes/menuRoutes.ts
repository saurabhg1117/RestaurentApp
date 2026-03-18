import { Router, Request, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

// GET /api/menu/categories
router.get('/categories', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({
    where: { restaurantId: req.restaurantId },
    include: { menuItems: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(categories);
});

// POST /api/menu/categories
router.post('/categories', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body as { name: string };
  if (!name) { res.status(400).json({ error: 'Category name is required.' }); return; }

  const category = await prisma.category.create({
    data: { name, restaurantId: req.restaurantId! },
  });
  res.status(201).json(category);
});

// PUT /api/menu/categories/:id
router.put('/categories/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body as { name: string };
  const category = await prisma.category.updateMany({
    where: { id: req.params['id'], restaurantId: req.restaurantId },
    data: { name },
  });
  res.json(category);
});

// DELETE /api/menu/categories/:id
router.delete('/categories/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.category.deleteMany({
    where: { id: req.params['id'], restaurantId: req.restaurantId },
  });
  res.json({ message: 'Category deleted.' });
});

// ─── MENU ITEMS ─────────────────────────────────────────────────────────────

// GET /api/menu/items
router.get('/items', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const items = await prisma.menuItem.findMany({
    where: { restaurantId: req.restaurantId },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(items);
});

// POST /api/menu/items  (manual add)
router.post('/items', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, price, categoryId } = req.body as { name: string; price: number; categoryId: string };
  if (!name || price === undefined || !categoryId) {
    res.status(400).json({ error: 'name, price and categoryId are required.' });
    return;
  }
  const item = await prisma.menuItem.create({
    data: { name, price: Number(price), categoryId, restaurantId: req.restaurantId! },
  });
  res.status(201).json(item);
});

// PUT /api/menu/items/:id  (edit price / name)
router.put('/items/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, price, categoryId } = req.body as { name?: string; price?: number; categoryId?: string };
  const item = await prisma.menuItem.updateMany({
    where: { id: req.params['id'], restaurantId: req.restaurantId },
    data: {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price: Number(price) }),
      ...(categoryId !== undefined && { categoryId }),
    },
  });
  res.json(item);
});

// DELETE /api/menu/items/:id
router.delete('/items/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.menuItem.deleteMany({
    where: { id: req.params['id'], restaurantId: req.restaurantId },
  });
  res.json({ message: 'Item deleted.' });
});

// ─── CSV BULK IMPORT ─────────────────────────────────────────────────────────
// Expected CSV columns: name, price, category
// POST /api/menu/import
router.post('/import', authenticate, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: 'CSV file is required.' }); return; }

  const results: { name: string; price: string; category: string }[] = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data: { name: string; price: string; category: string }) => results.push(data))
    .on('end', async () => {
      try {
        let imported = 0;
        for (const row of results) {
          const { name, price, category } = row;
          if (!name || !price || !category) continue;

          // Find or create category
          let cat = await prisma.category.findFirst({
            where: { name: category, restaurantId: req.restaurantId },
          });
          if (!cat) {
            cat = await prisma.category.create({
              data: { name: category, restaurantId: req.restaurantId! },
            });
          }

          // Upsert menu item (update if same name+category exists)
          await prisma.menuItem.upsert({
            where: {
              id: (await prisma.menuItem.findFirst({
                where: { name, categoryId: cat.id, restaurantId: req.restaurantId },
              }))?.id ?? 'new',
            },
            update: { price: Number(price) },
            create: { name, price: Number(price), categoryId: cat.id, restaurantId: req.restaurantId! },
          });
          imported++;
        }
        fs.unlinkSync(req.file!.path); // cleanup temp file
        res.json({ message: `${imported} items imported successfully.` });
      } catch (err) {
        res.status(500).json({ error: 'Error processing CSV.' });
      }
    });
});

export default router;
