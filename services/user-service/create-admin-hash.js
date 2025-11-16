// Script to generate bcrypt hash for admin password
// Run: node create-admin-hash.js

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('========================================');
  console.log('Bcrypt Hash for password "admin123":');
  console.log('========================================');
  console.log(hash);
  console.log('========================================');
  console.log('\nCopy this hash and use it in create-admin.sql');
  console.log('Replace the placeholder hash in the SQL file with this one.\n');
}

generateHash().catch(console.error);

