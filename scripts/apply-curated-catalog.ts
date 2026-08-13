const isDatabaseFreePreview = process.env.VERCEL_ENV === 'preview' && !process.env.DATABASE_URL;

if (isDatabaseFreePreview) {
  console.info('Skipping curated catalog synchronization for Vercel preview without DATABASE_URL.');
} else {
  const [{ ensureCuratedCatalog }, { prisma }] = await Promise.all([
    import('../lib/curatedCatalog.js'),
    import('../lib/prisma.js'),
  ]);

  try {
    const result = await ensureCuratedCatalog();
    console.info('Curated catalog build synchronization complete', result);
  } catch (error) {
    console.error('Curated catalog build synchronization failed', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
