import { db } from '../src/server/db.ts';
import { normalizeCanonicalUrl } from '../src/server/newsProviders.ts';

async function sanitizeStoredUrls() {
  console.log('--- Sanitizing existing articles URLs in storage ---');
  await db.initialize();
  const pool = (db as any).pool;

  if (pool) {
    const res = await pool.query('SELECT id, url, canonical_url FROM news_articles');
    let updatedCount = 0;
    for (const row of res.rows) {
      const cleanUrl = normalizeCanonicalUrl(row.url);
      const cleanCanon = normalizeCanonicalUrl(row.canonical_url);
      if (cleanUrl !== row.url || cleanCanon !== row.canonical_url) {
        await pool.query(
          'UPDATE news_articles SET url = $1, canonical_url = $2 WHERE id = $3',
          [cleanUrl, cleanCanon, row.id]
        );
        updatedCount++;
      }
    }
    console.log(`Updated ${updatedCount} articles in PostgreSQL database.`);
  } else {
    const jdata = (db as any).getJsonData();
    const articles = jdata.newsArticles || [];
    let updatedCount = 0;
    for (const art of articles) {
      const cleanUrl = normalizeCanonicalUrl(art.url || '');
      const cleanCanon = normalizeCanonicalUrl(art.canonicalUrl || '');
      if (cleanUrl !== art.url || cleanCanon !== art.canonicalUrl) {
        art.url = cleanUrl;
        art.canonicalUrl = cleanCanon;
        updatedCount++;
      }
    }
    (db as any).saveJson(jdata);
    console.log(`Updated ${updatedCount} articles in local JSON store.`);
  }
}

sanitizeStoredUrls().catch(console.error);
