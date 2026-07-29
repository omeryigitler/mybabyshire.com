import { ensureCuratedCatalog } from '../lib/curatedCatalog.js';
import { prisma } from '../lib/prisma.js';

try {
  const result = await ensureCuratedCatalog();
  console.info('Curated catalog build synchronization complete', result);
} catch (error) {
  console.error('Curated catalog build synchronization failed', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
