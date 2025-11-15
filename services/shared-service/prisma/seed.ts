import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding shared service data...');

  // Create Somalia country
  const somalia = await prisma.country.upsert({
    where: { code: 'SO' },
    update: {},
    create: {
      name: 'Somalia',
      code: 'SO',
    },
  });

  // Create major cities directly
  const cities = [
    { name: 'Mogadishu', countryId: somalia.id },
    { name: 'Hargeisa', countryId: somalia.id },
    { name: 'Kismayo', countryId: somalia.id },
    { name: 'Berbera', countryId: somalia.id },
    { name: 'Baidoa', countryId: somalia.id },
    { name: 'Beledweyne', countryId: somalia.id },
    { name: 'Burao', countryId: somalia.id },
    { name: 'Galkayo', countryId: somalia.id },
    { name: 'Garowe', countryId: somalia.id },
    { name: 'Jowhar', countryId: somalia.id },
  ];

  for (const cityData of cities) {
    await prisma.city.upsert({
      where: { 
        name_countryId: {
          name: cityData.name,
          countryId: cityData.countryId
        }
      },
      update: {},
      create: cityData,
    });
  }

  // Create specialties (without categories)
  const specialties = [
    // Internal Medicine
    { name: 'Cardiology', description: 'Heart and cardiovascular system' },
    { name: 'Neurology', description: 'Nervous system disorders' },
    { name: 'Gastroenterology', description: 'Digestive system disorders' },
    { name: 'Endocrinology', description: 'Hormone and metabolic disorders' },
    { name: 'Pulmonology', description: 'Respiratory system disorders' },
    { name: 'Nephrology', description: 'Kidney and urinary system' },
    { name: 'Rheumatology', description: 'Joint and autoimmune disorders' },
    { name: 'Hematology', description: 'Blood and blood-forming organs' },
    { name: 'Oncology', description: 'Cancer treatment and care' },
    { name: 'Infectious Diseases', description: 'Infectious and communicable diseases' },

    // Surgery
    { name: 'General Surgery', description: 'General surgical procedures' },
    { name: 'Cardiothoracic Surgery', description: 'Heart and chest surgery' },
    { name: 'Neurosurgery', description: 'Brain and nervous system surgery' },
    { name: 'Orthopedic Surgery', description: 'Bone and joint surgery' },
    { name: 'Plastic Surgery', description: 'Reconstructive and cosmetic surgery' },
    { name: 'Pediatric Surgery', description: 'Surgery for children' },
    { name: 'Vascular Surgery', description: 'Blood vessel surgery' },
    { name: 'Urological Surgery', description: 'Urinary and reproductive system surgery' },
    { name: 'Gynecological Surgery', description: 'Female reproductive system surgery' },
    { name: 'Ophthalmological Surgery', description: 'Eye surgery' },

    // Pediatrics
    { name: 'Pediatric Cardiology', description: 'Heart conditions in children' },
    { name: 'Pediatric Neurology', description: 'Neurological conditions in children' },
    { name: 'Neonatology', description: 'Newborn and premature infant care' },
    { name: 'Pediatric Endocrinology', description: 'Hormone disorders in children' },
    { name: 'Pediatric Gastroenterology', description: 'Digestive disorders in children' },
    { name: 'Pediatric Oncology', description: 'Cancer treatment in children' },
    { name: 'Pediatric Pulmonology', description: 'Respiratory conditions in children' },
    { name: 'Adolescent Medicine', description: 'Healthcare for teenagers' },

    // Emergency Medicine
    { name: 'Emergency Medicine', description: 'Emergency and trauma care' },
    { name: 'Critical Care Medicine', description: 'Intensive care unit management' },
    { name: 'Trauma Surgery', description: 'Trauma and injury surgery' },
    { name: 'Anesthesiology', description: 'Anesthesia and pain management' },

    // Mental Health
    { name: 'Psychiatry', description: 'Mental health disorders' },
    { name: 'Child Psychiatry', description: 'Mental health in children' },
    { name: 'Geriatric Psychiatry', description: 'Mental health in elderly' },

    // Diagnostic
    { name: 'Radiology', description: 'Medical imaging and diagnosis' },
    { name: 'Pathology', description: 'Disease diagnosis through tissue analysis' },
    { name: 'Laboratory Medicine', description: 'Laboratory testing and analysis' },

    // Other Specialties
    { name: 'Dermatology', description: 'Skin, hair, and nail disorders' },
    { name: 'Ophthalmology', description: 'Eye and vision care' },
    { name: 'Otolaryngology', description: 'Ear, nose, and throat disorders' },
    { name: 'Obstetrics and Gynecology', description: 'Women\'s health and childbirth' },
    { name: 'Urology', description: 'Urinary and male reproductive system' },
    { name: 'Physical Medicine and Rehabilitation', description: 'Physical therapy and rehabilitation' },
    { name: 'Family Medicine', description: 'Comprehensive primary care' },
    { name: 'Internal Medicine', description: 'Adult internal medicine' },
  ];

  for (const specialtyData of specialties) {
    await prisma.specialty.upsert({
      where: { name: specialtyData.name },
      update: specialtyData,
      create: specialtyData,
    });
  }


  // Create services (without categories)
  const services = [
    { name: 'Emergency Care', description: '24/7 emergency medical services' },
    { name: 'Surgery', description: 'Surgical procedures and operations' },
    { name: 'Consultation', description: 'General medical consultations' },
    { name: 'Diagnostic Imaging', description: 'X-ray, MRI, CT scan services' },
    { name: 'Laboratory Testing', description: 'Blood tests and diagnostic procedures' },
    { name: 'Physical Therapy', description: 'Rehabilitation and physical therapy' },
    { name: 'Mental Health Counseling', description: 'Mental health support and counseling' },
    { name: 'Maternity Care', description: 'Prenatal and postnatal care services' },
    { name: 'Pediatric Care', description: 'Specialized care for children' },
    { name: 'Cardiac Care', description: 'Heart and cardiovascular services' },
  ];

  for (const serviceData of services) {
    await prisma.service.upsert({
      where: { name: serviceData.name },
      update: serviceData,
      create: serviceData,
    });
  }

  // Create settings
  const settings = [
    { key: 'app_name', value: 'FAYO AI Healthcare', type: 'string' },
    { key: 'app_version', value: '1.0.0', type: 'string' },
    { key: 'max_file_size', value: '10485760', type: 'number' }, // 10MB
    { key: 'maintenance_mode', value: 'false', type: 'boolean' },
    { key: 'default_language', value: 'en', type: 'string' },
    { key: 'timezone', value: 'Africa/Mogadishu', type: 'string' },
  ];

  for (const settingData of settings) {
    await prisma.setting.upsert({
      where: { key: settingData.key },
      update: settingData,
      create: settingData,
    });
  }

  console.log('✅ Shared service data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });