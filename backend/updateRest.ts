import prisma from './src/lib/prisma.js';
async function run() {
  await prisma.restaurant.updateMany({
    data: {
      name: 'Spice Route Express',
      address: 'Shop 14, MG Road, Mumbai 400001',
      mobile: '+91 9876543210'
    }
  });
  console.log('Rest updated');
}
run();
