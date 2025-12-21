const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultSpecialties = [
  { name: 'Cardiology', description: 'Heart and cardiovascular system diseases' },
  { name: 'Dermatology', description: 'Skin, hair, and nail conditions' },
  { name: 'Endocrinology', description: 'Hormone-related disorders' },
  { name: 'Gastroenterology', description: 'Digestive system diseases' },
  { name: 'General Practice', description: 'General medical care' },
  { name: 'Neurology', description: 'Nervous system disorders' },
  { name: 'Oncology', description: 'Cancer treatment and care' },
  { name: 'Orthopedics', description: 'Bones, joints, and muscles' },
  { name: 'Pediatrics', description: 'Medical care for children' },
  { name: 'Psychiatry', description: 'Mental health and behavioral disorders' },
  { name: 'Pulmonology', description: 'Lung and respiratory system diseases' },
  { name: 'Urology', description: 'Urinary tract and male reproductive system' },
];

async function seedSpecialties() {
  try {
    console.log('🌱 Seeding specialties...');
    
    // Check existing specialties
    const existing = await prisma.specialty.findMany({
      select: { name: true },
    });
    const existingNames = new Set(existing.map(s => s.name.toLowerCase()));
    
    let created = 0;
    let skipped = 0;
    
    for (const specialty of defaultSpecialties) {
      if (existingNames.has(specialty.name.toLowerCase())) {
        console.log(`⏭️  Skipping "${specialty.name}" - already exists`);
        skipped++;
        continue;
      }
      
      try {
        await prisma.specialty.create({
          data: {
            name: specialty.name,
            description: specialty.description,
            isActive: true,
          },
        });
        console.log(`✅ Created "${specialty.name}"`);
        created++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⏭️  Skipping "${specialty.name}" - duplicate`);
          skipped++;
        } else {
          console.error(`❌ Error creating "${specialty.name}":`, error.message);
        }
      }
    }
    
    console.log('');
    console.log(`📊 Summary: ${created} created, ${skipped} skipped`);
    console.log(`✅ Total specialties: ${await prisma.specialty.count()}`);
    
  } catch (error) {
    console.error('❌ Error seeding specialties:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedSpecialties();

