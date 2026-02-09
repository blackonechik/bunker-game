import { seedDatabase } from '../src/shared/api/db/seed';

async function main() {
  console.log('🌱 Starting database seeding...');
  try {
    await seedDatabase();
    console.log('✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
