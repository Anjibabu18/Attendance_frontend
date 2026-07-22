import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating push_subscriptions table if it does not exist...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`push_subscriptions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NOT NULL,
        \`endpoint\` varchar(500) NOT NULL,
        \`p256dh\` varchar(200) NOT NULL,
        \`auth\` varchar(100) NOT NULL,
        \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_push_sub_user_endpoint\` (\`user_id\`,\`endpoint\`),
        CONSTRAINT \`push_subscriptions_user_id_fkey\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Successfully created push_subscriptions table.');
  } catch (error) {
    console.error('Failed to create table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
