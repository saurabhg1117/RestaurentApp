import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function createRestaurant(name: string, email: string, pass: string, owner: string, address?: string, mobile?: string) {
  const hashedPassword = await bcrypt.hash(pass, 10);
  try {
    const res = await prisma.restaurant.create({
      data: {
        name,
        email,
        password: hashedPassword,
        ownerName: owner,
        address,
        mobile
      }
    });
    console.log(`✅ Success! Restaurant Created:`);
    console.log(`ID: ${res.id}`);
    console.log(`Email: ${email}`);
    console.log(`Pass: ${pass}`);
  } catch (err: any) {
    console.error(`❌ Error creating restaurant: ${err.message}`);
  }
}

// Example usage: 
// createRestaurant("Green Leaf Cafe", "owner@greenleaf.com", "pass123", "Amit Sharma", "Sec 12, Noida", "+91 9988776655");

const args = process.argv.slice(2);
if (args.length < 4) {
  console.log('Usage: npx tsx createAccount.ts "Name" "Email" "Password" "OwnerName" ["Address"] ["Mobile"]');
} else {
  createRestaurant(args[0]!, args[1]!, args[2]!, args[3]!, args[4], args[5]);
}
