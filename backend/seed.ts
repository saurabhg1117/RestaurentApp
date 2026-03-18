import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const existing = await prisma.restaurant.findUnique({ where: { email: 'admin@test.com' } });
  if (!existing) {
    const password = await bcrypt.hash('123456', 10);
    await prisma.restaurant.create({
      data: {
        name: 'My Awesome Restaurant',
        ownerName: 'Admin',
        email: 'admin@test.com',
        password
      }
    });
    console.log('Test restaurant created successfully!');
  } else {
    console.log('Test restaurant already exists!');
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
