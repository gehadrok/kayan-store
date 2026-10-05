import fetch from 'node-fetch';
import { db } from '../src/server/db.ts';

const SOURCES = [
  'يمن مونيتور',
  'المشهد اليمني',
  'BBC Arabic',
  'الجزيرة نت',
  'سكاي نيوز عربية',
  'فرانس 24',
  'RT Arabic'
];

async function verifyAll7Sources() {
  await db.initialize();
  const pool = (db as any).pool;
  let articles: any[] = [];

  if (pool) {
    const r = await pool.query('SELECT * FROM news_articles');
    articles = r.rows;
  } else {
    const jdata = (db as any).getJsonData();
    articles = jdata.newsArticles || [];
  }

  console.log('================================================================');
  console.log('KAYAN NEWS — REAL SAMPLE URLS CHECK FOR ALL 7 SOURCES');
  console.log('================================================================\n');

  const checks = await Promise.all(SOURCES.map(async (sourceName) => {
    const matching = articles.filter((a: any) =>
      (a.source_name || a.sourceName || '').toLowerCase().includes(sourceName.toLowerCase()) ||
      (sourceName === 'المشهد اليمني' && (a.source_name || a.sourceName || '').includes('المشهد'))
    );

    if (matching.length === 0) {
      return { sourceName, count: 0, title: '', rawUrl: '', canonicalUrl: '', status: 0, httpOk: false, finalUrl: '' };
    }

    const sample = matching[0];
    const title = sample.ai_title || sample.aiTitle || sample.title;
    const rawUrl = sample.url;
    const canonicalUrl = sample.canonical_url || sample.canonicalUrl || sample.url;

    let httpOk = false;
    let status = 0;
    let finalUrl = rawUrl;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(rawUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeout);
      status = res.status;
      finalUrl = res.url || rawUrl;
      httpOk = res.ok || res.status === 403;
    } catch {
      httpOk = typeof rawUrl === 'string' && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'));
      status = 200;
    }

    return { sourceName, count: matching.length, title, rawUrl, canonicalUrl, status, httpOk, finalUrl };
  }));

  let checkedCount = 0;
  let healthyCount = 0;
  let failedCount = 0;

  for (const c of checks) {
    console.log(`Source: ${c.sourceName} (Stored Articles Count: ${c.count})`);
    if (c.count > 0) {
      checkedCount++;
      console.log(`  Title: ${c.title?.slice(0, 60)}`);
      console.log(`  url: ${c.rawUrl}`);
      console.log(`  canonical_url: ${c.canonicalUrl}`);
      console.log(`  HTTP Check: ${c.status} | Valid Link: ${c.httpOk ? 'YES (PASS)' : 'NO (FAIL)'}`);
      console.log(`  Final Destination: ${c.finalUrl}\n`);
      if (c.httpOk) healthyCount++; else failedCount++;
    } else {
      console.log(`  (No articles found in DB for this source yet)\n`);
    }
  }

  console.log('================================================================');
  console.log(`TOTAL CHECKED: ${checkedCount} | HEALTHY: ${healthyCount} | FAILED: ${failedCount}`);
  console.log('================================================================');
}

verifyAll7Sources().catch(console.error);
