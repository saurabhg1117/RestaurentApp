import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function reset() {
  const hp = await bcrypt.hash('123456', 10);
  await prisma.restaurant.upsert({
    where: { userId: 'admin1' },
    update: { password: hp, isSuperAdmin: true },
    create: { 
      name: 'Spice Route Express', 
      userId: 'admin1', 
      password: hp, 
      ownerName: 'Admin',
      address: 'Shop 14, MG Road, Mumbai',
      mobile: '+91 9876543210',
      isSuperAdmin: true
    }
  });
  console.log('Admin account Reset (userId: admin1)');
}
reset();
