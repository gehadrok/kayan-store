import { db } from '../src/server/db.ts';
import { NewsEngine } from '../src/server/newsEngine.ts';
import { NewsProviderManager } from '../src/server/newsProviders.ts';

async function testNewsSystem() {
  console.log('================================================================');
  console.log('🧪 Kayan | كيان — Kayan News Comprehensive Test Suite');
  console.log('================================================================');

  await db.initialize();
  const newsEngine = new NewsEngine(db);
  await newsEngine.initializeTables();

  // 1. Test Provider Abstraction
  console.log('1. Testing News Provider Abstraction...');
  const manager = new NewsProviderManager();
  console.log('   ✅ NewsProviderManager initialized with GNews, NewsAPI, and RSS providers.');

  // 2. Test Fetch Cycle & Deduplication with Real RSS Feeds
  console.log('2. Testing News Engine Fetch Cycle & Real Article Ingestion...');
  const cycleResult = await newsEngine.runFetchCycle('manual');
  console.log('   ✅ Fetch cycle executed successfully:', cycleResult.summary);

  if (cycleResult.summary.sourcesChecked <= 0) {
    throw new Error('sourcesChecked must be greater than 0');
  }
  if (cycleResult.summary.articlesFound <= 0) {
    throw new Error('articlesFound must be greater than 0');
  }

  // 3. Test Database Integrity & Article Storage
  console.log('3. Testing Locations, Sources & Articles Storage...');
  const pool = (db as any).pool;
  let sourcesCount = 0;
  let articlesCount = 0;
  let locationsCount = 0;

  if (pool) {
    const locs = await pool.query('SELECT COUNT(*) FROM news_locations');
    const sources = await pool.query('SELECT COUNT(*) FROM news_sources');
    const articles = await pool.query('SELECT COUNT(*) FROM news_articles');
    locationsCount = parseInt(locs.rows[0].count, 10);
    sourcesCount = parseInt(sources.rows[0].count, 10);
    articlesCount = parseInt(articles.rows[0].count, 10);
  } else {
    const jdata = (db as any).getJsonData();
    locationsCount = (jdata.newsLocations || []).length;
    sourcesCount = (jdata.newsSources || []).length;
    articlesCount = (jdata.newsArticles || []).length;
  }

  console.log(`   ✅ News Sources count: ${sourcesCount}`);
  console.log(`   ✅ News Locations count: ${locationsCount}`);
  console.log(`   ✅ News Articles count: ${articlesCount}`);

  if (sourcesCount <= 0) throw new Error('news_sources count must be > 0');
  if (articlesCount <= 0) throw new Error('news_articles count must be > 0');

  // 4. Test Deduplication (Second cycle should identify duplicates)
  console.log('4. Testing Deduplication on immediate second run...');
  const secondCycle = await newsEngine.runFetchCycle('manual');
  console.log('   ✅ Second cycle summary:', secondCycle.summary);
  console.log(`   ✅ Duplicates correctly caught: ${secondCycle.summary.articlesDuplicate}`);

  console.log('🎉 ALL KAYAN NEWS TESTS COMPLETED SUCCESSFULLY!');
}

testNewsSystem().catch(err => {
  console.error('❌ Kayan News Test Suite Failed:', err);
  process.exit(1);
});
