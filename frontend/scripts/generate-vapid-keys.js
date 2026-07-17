// Run: node scripts/generate-vapid-keys.js
// Then paste the output into your backend .env file

const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Add these to your backend-node/.env file:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@yourcompany.com`);
console.log('\nAlso add the public key to your frontend/.env file:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log('\n============================\n');
