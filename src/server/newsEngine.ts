import crypto from 'crypto';
import { Database } from './db.ts';
import { NewsProviderManager } from './newsProviders.ts';
import { aiGateway } from './ai/index.ts';
import { COUNTRIES } from '../data/countries.ts';

export function matchLocationWord(text: string, word: string): boolean {
  if (!text || !word || word.trim().length === 0) return false;
  try {
    const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'u');
    return regex.test(text);
  } catch {
    return text.includes(word);
  }
}

const INITIAL_SOURCES = [
  { id: 'src_rss_yemen_monitor', name: 'يمن مونيتور', url: 'https://www.yemenmonitor.com/feed/', provider_type: 'rss', country: 'ye' },
  { id: 'src_rss_mashhad', name: 'المشهد اليمني', url: 'https://almashhad-alyemeni.com/feed/', provider_type: 'rss', country: 'ye' },
  { id: 'src_rss_uae_google', name: 'أخبار الإمارات', url: 'https://news.google.com/rss?hl=ar&gl=AE&ceid=AE:ar', provider_type: 'rss', country: 'ae' },
  { id: 'src_rss_sa_google', name: 'أخبار السعودية', url: 'https://news.google.com/rss?hl=ar&gl=SA&ceid=SA:ar', provider_type: 'rss', country: 'sa' },
  { id: 'src_rss_bbc', name: 'BBC Arabic', url: 'https://feeds.bbci.co.uk/arabic/rss.xml', provider_type: 'rss', country: 'global' },
  { id: 'src_rss_aljazeera', name: 'الجزيرة نت', url: 'https://www.aljazeera.net/aljazeerarss/a7c6e2fb-b792-4329-ba77-020da1360846.xml', provider_type: 'rss', country: 'global' },
  { id: 'src_rss_sky', name: 'سكاي نيوز عربية', url: 'https://www.skynewsarabia.com/rss.xml', provider_type: 'rss', country: 'global' },
  { id: 'src_rss_france24', name: 'فرانس 24', url: 'https://www.france24.com/ar/rss', provider_type: 'rss', country: 'global' },
  { id: 'src_rss_rt', name: 'RT Arabic', url: 'https://arabic.rt.com/rss/', provider_type: 'rss', country: 'global' }
];

const INITIAL_LOCATIONS = [
  { id: 'loc_ye', nameAr: 'اليمن', nameEn: 'Yemen', countryCode: 'YE', type: 'country' },
  { id: 'loc_ye_sanaa', nameAr: 'صنعاء', nameEn: "Sana'a", countryCode: 'YE', parentId: 'loc_ye', type: 'governorate' },
  { id: 'loc_ye_aden', nameAr: 'عدن', nameEn: 'Aden', countryCode: 'YE', parentId: 'loc_ye', type: 'governorate' },
  { id: 'loc_ye_taiz', nameAr: 'تعز', nameEn: 'Taiz', countryCode: 'YE', parentId: 'loc_ye', type: 'governorate' },
  { id: 'loc_ye_dhale', nameAr: 'الضالع', nameEn: 'Al Dhale', countryCode: 'YE', parentId: 'loc_ye', type: 'governorate' },
  { id: 'loc_ye_hodeidah', nameAr: 'الحديدة', nameEn: 'Hodeidah', countryCode: 'YE', parentId: 'loc_ye', type: 'governorate' },
  { id: 'loc_ye_ibb', nameAr: 'إب', nameEn: 'Ibb', countryCode: 'YE', parentId: 'loc_ye', type: 'governorate' },
  { id: 'loc_ye_hadramout', nameAr: 'حضرموت', nameEn: 'Hadramout', countryCode: 'YE', parentId: 'loc_ye', type: 'governorate' },
  { id: 'loc_sa', nameAr: 'السعودية', nameEn: 'Saudi Arabia', countryCode: 'SA', type: 'country' },
  { id: 'loc_ae', nameAr: 'الإمارات', nameEn: 'UAE', countryCode: 'AE', type: 'country' },
  { id: 'loc_global', nameAr: 'عالمي', nameEn: 'Global', countryCode: 'GLOBAL', type: 'country' }
];

const INITIAL_ALIASES = [
  { id: 'ali_ye_1', locationId: 'loc_ye', alias: 'اليمن', language: 'ar' },
  { id: 'ali_ye_2', locationId: 'loc_ye', alias: 'Yemen', language: 'en' },
  { id: 'ali_ye_3', locationId: 'loc_ye', alias: 'يمني', language: 'ar' },
  { id: 'ali_ye_4', locationId: 'loc_ye', alias: 'يمنية', language: 'ar' },

  { id: 'ali_sa_1', locationId: 'loc_ye_sanaa', alias: 'صنعاء', language: 'ar' },
  { id: 'ali_sa_2', locationId: 'loc_ye_sanaa', alias: "Sana'a", language: 'en' },
  { id: 'ali_sa_3', locationId: 'loc_ye_sanaa', alias: 'أمانة العاصمة', language: 'ar' },
  { id: 'ali_sa_4', locationId: 'loc_ye_sanaa', alias: 'صنعاء القديمة', language: 'ar' },
  { id: 'ali_sa_5', locationId: 'loc_ye_sanaa', alias: 'خولان', language: 'ar' },
  { id: 'ali_sa_6', locationId: 'loc_ye_sanaa', alias: 'همدان', language: 'ar' },

  { id: 'ali_ad_1', locationId: 'loc_ye_aden', alias: 'عدن', language: 'ar' },
  { id: 'ali_ad_2', locationId: 'loc_ye_aden', alias: 'Aden', language: 'en' },
  { id: 'ali_ad_3', locationId: 'loc_ye_aden', alias: 'العاصمة المؤقتة', language: 'ar' },
  { id: 'ali_ad_4', locationId: 'loc_ye_aden', alias: 'كريتر', language: 'ar' },
  { id: 'ali_ad_5', locationId: 'loc_ye_aden', alias: 'المعلا', language: 'ar' },
  { id: 'ali_ad_6', locationId: 'loc_ye_aden', alias: 'التواهي', language: 'ar' },
  { id: 'ali_ad_7', locationId: 'loc_ye_aden', alias: 'الشيخ عثمان', language: 'ar' },
  { id: 'ali_ad_8', locationId: 'loc_ye_aden', alias: 'المنصورة', language: 'ar' },
  { id: 'ali_ad_9', locationId: 'loc_ye_aden', alias: 'خور مكسر', language: 'ar' },
  { id: 'ali_ad_10', locationId: 'loc_ye_aden', alias: 'البريقة', language: 'ar' },

  { id: 'ali_tz_1', locationId: 'loc_ye_taiz', alias: 'تعز', language: 'ar' },
  { id: 'ali_tz_2', locationId: 'loc_ye_taiz', alias: 'Taiz', language: 'en' },
  { id: 'ali_tz_3', locationId: 'loc_ye_taiz', alias: 'الحوبان', language: 'ar' },
  { id: 'ali_tz_4', locationId: 'loc_ye_taiz', alias: 'المخا', language: 'ar' },
  { id: 'ali_tz_5', locationId: 'loc_ye_taiz', alias: 'التربة', language: 'ar' },

  { id: 'ali_dh_1', locationId: 'loc_ye_dhale', alias: 'الضالع', language: 'ar' },
  { id: 'ali_dh_2', locationId: 'loc_ye_dhale', alias: 'Ad Dali', language: 'en' },
  { id: 'ali_dh_3', locationId: 'loc_ye_dhale', alias: 'Al-Dhale', language: 'en' },
  { id: 'ali_dh_4', locationId: 'loc_ye_dhale', alias: 'Al Dhale', language: 'en' },
  { id: 'ali_dh_5', locationId: 'loc_ye_dhale', alias: 'قعطبة', language: 'ar' },
  { id: 'ali_dh_6', locationId: 'loc_ye_dhale', alias: 'دمت', language: 'ar' },
  { id: 'ali_dh_7', locationId: 'loc_ye_dhale', alias: 'مريس', language: 'ar' },
  { id: 'ali_dh_8', locationId: 'loc_ye_dhale', alias: 'جبن', language: 'ar' },
  { id: 'ali_dh_9', locationId: 'loc_ye_dhale', alias: 'الشعيب', language: 'ar' },

  { id: 'ali_hd_1', locationId: 'loc_ye_hodeidah', alias: 'الحديدة', language: 'ar' },
  { id: 'ali_hd_2', locationId: 'loc_ye_hodeidah', alias: 'Hodeidah', language: 'en' },
  { id: 'ali_hd_3', locationId: 'loc_ye_hodeidah', alias: 'الحديده', language: 'ar' },
  { id: 'ali_hd_4', locationId: 'loc_ye_hodeidah', alias: 'ميناء الحديدة', language: 'ar' },

  { id: 'ali_ib_1', locationId: 'loc_ye_ibb', alias: 'إب', language: 'ar' },
  { id: 'ali_ib_2', locationId: 'loc_ye_ibb', alias: 'Ibb', language: 'en' },
  { id: 'ali_ib_3', locationId: 'loc_ye_ibb', alias: 'العدين', language: 'ar' },
  { id: 'ali_ib_4', locationId: 'loc_ye_ibb', alias: 'يريم', language: 'ar' },

  { id: 'ali_hm_1', locationId: 'loc_ye_hadramout', alias: 'حضرموت', language: 'ar' },
  { id: 'ali_hm_2', locationId: 'loc_ye_hadramout', alias: 'المكلا', language: 'ar' },
  { id: 'ali_hm_3', locationId: 'loc_ye_hadramout', alias: 'سيئون', language: 'ar' },
  { id: 'ali_hm_4', locationId: 'loc_ye_hadramout', alias: 'Hadramout', language: 'en' }
];

export class NewsEngine {
  private db: Database;
  private providerManager: NewsProviderManager;
  private isFetching: boolean = false;
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor(db: Database) {
    this.db = db;
    this.providerManager = new NewsProviderManager();
  }

  public async initializeTables() {
    const pool = (this.db as any).pool;
    const isPg = (this.db as any).isPg;

    if (isPg && pool) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS news_sources (
          id VARCHAR(64) PRIMARY KEY,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          provider_type VARCHAR(64) NOT NULL DEFAULT 'rss',
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          country VARCHAR(32) NOT NULL DEFAULT 'ye',
          error_count INT NOT NULL DEFAULT 0,
          last_success_at TIMESTAMPTZ,
          last_error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS news_locations (
          id VARCHAR(64) PRIMARY KEY,
          name_ar TEXT NOT NULL,
          name_en TEXT NOT NULL,
          country_code VARCHAR(32) NOT NULL,
          parent_id VARCHAR(64),
          type VARCHAR(32) NOT NULL DEFAULT 'governorate',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS news_location_aliases (
          id VARCHAR(64) PRIMARY KEY,
          location_id VARCHAR(64) REFERENCES news_locations(id) ON DELETE CASCADE,
          alias TEXT NOT NULL,
          language VARCHAR(16) NOT NULL DEFAULT 'ar',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS news_articles (
          id VARCHAR(64) PRIMARY KEY,
          source_id VARCHAR(64) REFERENCES news_sources(id) ON DELETE SET NULL,
          source_name TEXT,
          title TEXT NOT NULL,
          original_title TEXT NOT NULL,
          description TEXT,
          content TEXT,
          url TEXT NOT NULL,
          canonical_url TEXT UNIQUE NOT NULL,
          content_hash VARCHAR(64) NOT NULL,
          image_url TEXT,
          language VARCHAR(16) NOT NULL DEFAULT 'ar',
          country VARCHAR(32) NOT NULL DEFAULT 'ye',
          region_id VARCHAR(64) REFERENCES news_locations(id) ON DELETE SET NULL,
          region_name TEXT,
          category VARCHAR(64) NOT NULL DEFAULT 'general',
          published_at TIMESTAMPTZ NOT NULL,
          ai_title TEXT,
          ai_summary TEXT,
          ai_key_points JSONB,
          ai_location_verified BOOLEAN NOT NULL DEFAULT FALSE,
          ai_processed BOOLEAN NOT NULL DEFAULT FALSE,
          ai_error TEXT,
          fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS news_fetch_jobs (
          id VARCHAR(64) PRIMARY KEY,
          started_at TIMESTAMPTZ NOT NULL,
          finished_at TIMESTAMPTZ,
          status VARCHAR(32) NOT NULL,
          sources_checked INT NOT NULL DEFAULT 0,
          articles_found INT NOT NULL DEFAULT 0,
          articles_new INT NOT NULL DEFAULT 0,
          articles_duplicate INT NOT NULL DEFAULT 0,
          articles_ai_processed INT NOT NULL DEFAULT 0,
          articles_failed INT NOT NULL DEFAULT 0,
          error_message TEXT
        );

        CREATE TABLE IF NOT EXISTS news_settings (
          id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
          update_interval_minutes INT NOT NULL DEFAULT 180,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          last_run_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_news_articles_canonical ON news_articles(canonical_url);
        CREATE INDEX IF NOT EXISTS idx_news_articles_hash ON news_articles(content_hash);
        CREATE INDEX IF NOT EXISTS idx_news_articles_filter ON news_articles(country, category, published_at DESC);
        CREATE INDEX IF NOT EXISTS idx_aliases_alias ON news_location_aliases(alias);
      `);

      // Seed locations
      for (const l of INITIAL_LOCATIONS) {
        await pool.query(
          `INSERT INTO news_locations (id, name_ar, name_en, country_code, parent_id, type)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [l.id, l.nameAr, l.nameEn, l.countryCode, l.parentId || null, l.type]
        );
      }

      // Seed Global COUNTRIES into news_locations
      for (const c of COUNTRIES) {
        const locId = `loc_${c.code.toLowerCase()}`;
        await pool.query(
          `INSERT INTO news_locations (id, name_ar, name_en, country_code, type)
           VALUES ($1, $2, $3, $4, 'country')
           ON CONFLICT (id) DO NOTHING`,
          [locId, c.nameAr, c.nameEn, c.code.toUpperCase()]
        );

        // Seed country-level aliases
        const aliases = [
          ...c.aliasesAr.map(a => ({ alias: a, lang: 'ar' })),
          ...c.aliasesEn.map(a => ({ alias: a, lang: 'en' })),
          { alias: c.nameAr, lang: 'ar' },
          { alias: c.nameEn, lang: 'en' }
        ];

        for (const al of aliases) {
          const aliId = `ali_${c.code.toLowerCase()}_${crypto.createHash('md5').update(al.alias).digest('hex').slice(0, 8)}`;
          await pool.query(
            `INSERT INTO news_location_aliases (id, location_id, alias, language)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO NOTHING`,
            [aliId, locId, al.alias, al.lang]
          );
        }
      }

      // Seed aliases (initial ones)
      for (const a of INITIAL_ALIASES) {
        await pool.query(
          `INSERT INTO news_location_aliases (id, location_id, alias, language)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [a.id, a.locationId, a.alias, a.language]
        );
      }

      // Seed real sources
      for (const s of INITIAL_SOURCES) {
        await pool.query(
          `INSERT INTO news_sources (id, name, url, provider_type, enabled, country)
           VALUES ($1, $2, $3, $4, true, $5)
           ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, name = EXCLUDED.name`,
          [s.id, s.name, s.url, s.provider_type, s.country]
        );
      }

      // Seed settings
      await pool.query(`
        INSERT INTO news_settings (id, update_interval_minutes, enabled)
        VALUES ('default', 180, true)
        ON CONFLICT (id) DO NOTHING
      `);
    } else {
      // Local JSON Store fallback initialization
      const data = (this.db as any).getJsonData();
      if (!data.newsSources) data.newsSources = [];
      if (!data.newsLocations) data.newsLocations = [];
      if (!data.newsLocationAliases) data.newsLocationAliases = [];
      if (!data.newsArticles) data.newsArticles = [];
      if (!data.newsFetchJobs) data.newsFetchJobs = [];
      if (!data.newsSettings) data.newsSettings = [];

      // Seed JSON locations
      for (const l of INITIAL_LOCATIONS) {
        if (!data.newsLocations.some((x: any) => x.id === l.id)) {
          data.newsLocations.push(l);
        }
      }

      // Seed JSON Global COUNTRIES
      for (const c of COUNTRIES) {
        const locId = `loc_${c.code.toLowerCase()}`;
        if (!data.newsLocations.some((x: any) => x.id === locId)) {
          data.newsLocations.push({
            id: locId,
            nameAr: c.nameAr,
            nameEn: c.nameEn,
            countryCode: c.code.toUpperCase(),
            type: 'country'
          });
        }

        const aliases = [
          ...c.aliasesAr.map(a => ({ alias: a, lang: 'ar' })),
          ...c.aliasesEn.map(a => ({ alias: a, lang: 'en' })),
          { alias: c.nameAr, lang: 'ar' },
          { alias: c.nameEn, lang: 'en' }
        ];

        for (const al of aliases) {
          if (!data.newsLocationAliases.some((x: any) => x.locationId === locId && x.alias === al.alias)) {
            data.newsLocationAliases.push({
              id: `ali_${c.code.toLowerCase()}_${crypto.createHash('md5').update(al.alias).digest('hex').slice(0, 8)}`,
              locationId: locId,
              alias: al.alias,
              language: al.lang
            });
          }
        }
      }

      // Seed JSON aliases
      for (const a of INITIAL_ALIASES) {
        if (!data.newsLocationAliases.some((x: any) => x.id === a.id)) {
          data.newsLocationAliases.push(a);
        }
      }

      // Seed JSON sources
      for (const s of INITIAL_SOURCES) {
        const existing = data.newsSources.find((x: any) => x.id === s.id);
        if (existing) {
          existing.url = s.url;
          existing.name = s.name;
        } else {
          data.newsSources.push({
            ...s,
            enabled: true,
            errorCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Seed JSON settings
      if (data.newsSettings.length === 0) {
        data.newsSettings.push({
          id: 'default',
          updateIntervalMinutes: 180,
          enabled: true,
          updatedAt: new Date().toISOString()
        });
      }

      (this.db as any).saveJson(data);
    }
  }

  public async startScheduler() {
    await this.initializeTables();
    
    const intervalMinutes = await this.getUpdateInterval();
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    this.schedulerInterval = setInterval(async () => {
      await this.runFetchCycle('scheduled').catch(err => {
        console.warn('Scheduled fetch cycle error:', err?.message || err);
      });
    }, Math.max(intervalMinutes, 10) * 60 * 1000);

    console.log(`📰 News scheduler started (Interval: ${intervalMinutes} minutes).`);
  }

  public async getUpdateInterval(): Promise<number> {
    const pool = (this.db as any).pool;
    const isPg = (this.db as any).isPg;
    if (isPg && pool) {
      const res = await pool.query('SELECT update_interval_minutes, enabled FROM news_settings WHERE id = $1', ['default']);
      if (res.rows.length > 0) {
        if (!res.rows[0].enabled) return 999999;
        return res.rows[0].update_interval_minutes || 180;
      }
    } else {
      const data = (this.db as any).getJsonData();
      const s = (data.newsSettings || []).find((x: any) => x.id === 'default');
      if (s) {
        if (!s.enabled) return 999999;
        return s.updateIntervalMinutes || 180;
      }
    }
    return 180;
  }

  public async runFetchCycleForCountry(countryCode: string, category: string = 'general', query?: string): Promise<{ jobId: string; summary: any }> {
    if (this.isFetching) {
      // If a global cycle is running, don't crash, return gracefully
      return {
        jobId: 'skipped_busy',
        summary: { status: 'busy', articlesFound: 0, articlesNew: 0 }
      };
    }

    this.isFetching = true;
    const jobId = 'job_country_' + countryCode.toLowerCase() + '_' + crypto.randomBytes(4).toString('hex');
    const startedAt = new Date().toISOString();
    const pool = (this.db as any).pool;
    const isPg = (this.db as any).isPg;

    let articlesFound = 0;
    let articlesNew = 0;
    let articlesDuplicate = 0;
    let articlesAiProcessed = 0;
    let articlesFailed = 0;

    try {
      // 1. Fetch articles for this country and category
      const targetCategory = (category && category !== 'all') ? category : 'general';
      const fetched = await this.providerManager.fetchWithFallback(countryCode, targetCategory, query);
      articlesFound = fetched.articles.length;

      // 2. Load locations and aliases for tagging
      let locations: any[] = [];
      let aliases: any[] = [];
      if (isPg && pool) {
        const lRes = await pool.query('SELECT * FROM news_locations');
        const aRes = await pool.query('SELECT * FROM news_location_aliases');
        locations = lRes.rows;
        aliases = aRes.rows;
      } else {
        const data = (this.db as any).getJsonData();
        locations = data.newsLocations || [];
        aliases = data.newsLocationAliases || [];
      }

      const quotaExhausted = false; // We might want to track this globally
      let aiAttempts = 0;
      const MAX_AI_PER_COUNTRY_FETCH = 3;

      // 3. Process and Save
      for (const raw of fetched.articles) {
        try {
          const canonicalUrl = raw.canonicalUrl || raw.url;
          const contentHash = crypto.createHash('sha256').update((raw.title + (raw.description || '')).trim()).digest('hex');

          // Deduplication
          let exists = false;
          if (isPg && pool) {
            const dup = await pool.query('SELECT id FROM news_articles WHERE canonical_url = $1 OR content_hash = $2', [canonicalUrl, contentHash]);
            exists = dup.rows.length > 0;
          } else {
            const data = (this.db as any).getJsonData();
            exists = (data.newsArticles || []).some((a: any) => a.canonicalUrl === canonicalUrl || a.contentHash === contentHash);
          }

          if (exists) {
            articlesDuplicate++;
            continue;
          }

          articlesNew++;
          const articleId = 'art_' + crypto.randomBytes(6).toString('hex');
          
          // Tagging (Same logic as global cycle)
          let matchedRegionId: string | null = null;
          let matchedRegionName: string | null = null;
          let locationVerified = false;
          const textBlob = (raw.title + ' ' + (raw.description || '')).toLowerCase();

          for (const al of aliases) {
            const locId = al.location_id || al.locationId;
            const aliasStr = (al.alias || '').toLowerCase();
            if (locId !== 'loc_ye' && aliasStr.length > 2 && matchLocationWord(textBlob, aliasStr)) {
              matchedRegionId = locId;
              const locObj = locations.find((l: any) => l.id === locId);
              if (locObj) matchedRegionName = locObj.name_ar || locObj.nameAr;
              locationVerified = true;
              break;
            }
          }

          // Base article record (saved immediately for sub-second response)
          const articleRecord = {
            id: articleId,
            sourceId: raw.sourceId || null,
            sourceName: raw.sourceName || fetched.providerName,
            title: raw.title,
            originalTitle: raw.title,
            description: raw.description || null,
            content: raw.content || null,
            url: raw.url,
            canonicalUrl,
            contentHash,
            imageUrl: raw.imageUrl || null,
            language: raw.language || 'ar',
            country: countryCode.toLowerCase(),
            regionId: matchedRegionId,
            regionName: matchedRegionName,
            category: (category && category !== 'all' && category !== 'general' ? category : raw.category) || 'general',
            publishedAt: raw.publishedAt || new Date().toISOString(),
            aiTitle: null,
            aiSummary: null,
            aiKeyPoints: [],
            aiLocationVerified: locationVerified,
            aiProcessed: false,
            aiError: null,
            fetchedAt: new Date().toISOString()
          };

          if (isPg && pool) {
            await pool.query(
              `INSERT INTO news_articles (
                id, source_id, source_name, title, original_title, description, content, url, canonical_url,
                content_hash, image_url, language, country, region_id, region_name, category, published_at,
                ai_title, ai_summary, ai_key_points, ai_location_verified, ai_processed, ai_error, fetched_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())`,
              [
                articleRecord.id, articleRecord.sourceId, articleRecord.sourceName, articleRecord.title, 
                articleRecord.originalTitle, articleRecord.description, articleRecord.content, articleRecord.url, 
                articleRecord.canonicalUrl, articleRecord.contentHash, articleRecord.imageUrl, articleRecord.language, 
                articleRecord.country, articleRecord.regionId, articleRecord.regionName, articleRecord.category, 
                articleRecord.publishedAt, articleRecord.aiTitle, articleRecord.aiSummary, JSON.stringify(articleRecord.aiKeyPoints),
                articleRecord.aiLocationVerified, articleRecord.aiProcessed, articleRecord.aiError
              ]
            );
          } else {
            const data = (this.db as any).getJsonData();
            if (!data.newsArticles) data.newsArticles = [];
            data.newsArticles.unshift(articleRecord);
            (this.db as any).saveJson(data);
          }
        } catch (artErr) {
          articlesFailed++;
        }
      }

      return {
        jobId,
        summary: {
          status: 'success',
          articlesFound,
          articlesNew,
          articlesDuplicate,
          articlesAiProcessed,
          articlesFailed
        }
      };

    } finally {
      this.isFetching = false;
    }
  }

  public async runFetchCycle(triggeredBy: 'scheduled' | 'manual' = 'manual'): Promise<{ jobId: string; summary: any }> {
    if (this.isFetching) {
      throw new Error('A news fetch cycle is already running (Mutex locked).');
    }

    this.isFetching = true;
    const jobId = 'job_' + crypto.randomBytes(6).toString('hex');
    const startedAt = new Date().toISOString();

    const pool = (this.db as any).pool;
    const isPg = (this.db as any).isPg;

    let sourcesChecked = 0;
    let articlesFound = 0;
    let articlesNew = 0;
    let articlesDuplicate = 0;
    let articlesAiProcessed = 0;
    let articlesFailed = 0;
    let errorMsg: string | undefined = undefined;

    // Log job start
    if (isPg && pool) {
      await pool.query(
        `INSERT INTO news_fetch_jobs (id, started_at, status, sources_checked, articles_found, articles_new, articles_duplicate, articles_ai_processed, articles_failed)
         VALUES ($1, $2, 'running', 0, 0, 0, 0, 0, 0)`,
        [jobId, startedAt]
      );
    } else {
      const data = (this.db as any).getJsonData();
      if (!data.newsFetchJobs) data.newsFetchJobs = [];
      data.newsFetchJobs.unshift({
        id: jobId,
        started_at: startedAt,
        status: 'running',
        sources_checked: 0,
        articles_found: 0,
        articles_new: 0,
        articles_duplicate: 0,
        articles_ai_processed: 0,
        articles_failed: 0
      });
      (this.db as any).saveJson(data);
    }

    try {
      // Get enabled sources
      let sources: any[] = [];
      if (isPg && pool) {
        const sRes = await pool.query('SELECT * FROM news_sources WHERE enabled = true');
        sources = sRes.rows;
      } else {
        const data = (this.db as any).getJsonData();
        sources = (data.newsSources || []).filter((s: any) => s.enabled !== false);
      }

      sourcesChecked = sources.length;
      const rawArticlesList: any[] = [];

      for (const source of sources) {
        try {
          const feedUrl = source.url || source.feed_url;
          const fetched = await this.providerManager.fetchWithFallback(
            source.country || 'ye',
            'general',
            undefined,
            source.provider_type === 'rss' ? feedUrl : undefined
          );

          for (const art of fetched.articles) {
            rawArticlesList.push({
              ...art,
              sourceId: source.id,
              sourceName: source.name
            });
          }

          if (isPg && pool) {
            await pool.query(
              'UPDATE news_sources SET last_success_at = NOW(), error_count = 0, last_error = NULL WHERE id = $1',
              [source.id]
            );
          } else {
            const data = (this.db as any).getJsonData();
            const s = (data.newsSources || []).find((x: any) => x.id === source.id);
            if (s) {
              s.lastSuccessAt = new Date().toISOString();
              s.errorCount = 0;
              s.lastError = undefined;
            }
            (this.db as any).saveJson(data);
          }
        } catch (srcErr: any) {
          console.warn(`Source ${source.name} (${source.url}) failed:`, srcErr?.message || srcErr);
          if (isPg && pool) {
            await pool.query(
              'UPDATE news_sources SET error_count = error_count + 1, last_error = $1 WHERE id = $2',
              [srcErr?.message || String(srcErr), source.id]
            );
          } else {
            const data = (this.db as any).getJsonData();
            const s = (data.newsSources || []).find((x: any) => x.id === source.id);
            if (s) {
              s.errorCount = (s.errorCount || 0) + 1;
              s.lastError = srcErr?.message || String(srcErr);
            }
            (this.db as any).saveJson(data);
          }
        }
      }

      articlesFound = rawArticlesList.length;

      // Get locations and aliases for entity mapping
      let locations: any[] = [];
      let aliases: any[] = [];
      if (isPg && pool) {
        const lRes = await pool.query('SELECT * FROM news_locations');
        const aRes = await pool.query('SELECT * FROM news_location_aliases');
        locations = lRes.rows;
        aliases = aRes.rows;
      } else {
        const data = (this.db as any).getJsonData();
        locations = data.newsLocations || [];
        aliases = data.newsLocationAliases || [];
      }

      let aiProcessedCount = 0;
      let aiAttempts = 0;
      let quotaExhausted = false;
      const MAX_AI_PER_CYCLE = 2;

      for (const raw of rawArticlesList) {
        try {
          const canonicalUrl = raw.canonicalUrl || raw.url;
          const contentHash = crypto.createHash('sha256').update((raw.title + (raw.description || '')).trim()).digest('hex');

          // Deduplication: 1. canonical_url, 2. content_hash
          if (isPg && pool) {
            const dupCanon = await pool.query('SELECT id FROM news_articles WHERE canonical_url = $1', [canonicalUrl]);
            if (dupCanon.rows.length > 0) {
              articlesDuplicate++;
              continue;
            }
            const dupHash = await pool.query('SELECT id FROM news_articles WHERE content_hash = $1', [contentHash]);
            if (dupHash.rows.length > 0) {
              articlesDuplicate++;
              continue;
            }
          } else {
            const data = (this.db as any).getJsonData();
            const arts = data.newsArticles || [];
            const dup = arts.find((a: any) => a.canonicalUrl === canonicalUrl || a.contentHash === contentHash);
            if (dup) {
              articlesDuplicate++;
              continue;
            }
          }

          articlesNew++;
          const articleId = 'art_' + crypto.randomBytes(6).toString('hex');
          const publishedAt = raw.publishedAt || new Date().toISOString();

          // Location entity mapping via verified aliases
          let matchedRegionId: string | null = null;
          let matchedRegionName: string | null = null;
          let locationVerified = false;

          const textBlob = (raw.title + ' ' + (raw.description || '')).toLowerCase();
          
          // Check governorate/city level aliases first
          for (const al of aliases) {
            const locId = al.location_id || al.locationId;
            const aliasStr = (al.alias || '').toLowerCase();
            if (locId !== 'loc_ye' && aliasStr.length > 1 && matchLocationWord(textBlob, aliasStr)) {
              matchedRegionId = locId;
              const locObj = locations.find((l: any) => l.id === locId);
              if (locObj) matchedRegionName = locObj.name_ar || locObj.nameAr;
              locationVerified = true;
              break;
            }
          }

          // If no specific city matched, check general country aliases
          if (!matchedRegionId) {
            for (const al of aliases) {
              const locId = al.location_id || al.locationId;
              const aliasStr = (al.alias || '').toLowerCase();
              if (locId === 'loc_ye' && aliasStr.length > 1 && matchLocationWord(textBlob, aliasStr)) {
                matchedRegionId = locId;
                matchedRegionName = 'اليمن';
                locationVerified = true;
                break;
              }
            }
          }

          // Kayan AI processing (strictly analyzes raw text, no hallucination)
          let aiTitle: string | null = null;
          let aiSummary: string | null = null;
          let aiKeyPoints: string[] = [];
          let aiProcessed = false;
          let aiError: string | null = null;

          if (aiAttempts < MAX_AI_PER_CYCLE && !quotaExhausted && process.env.GEMINI_API_KEY) {
            aiAttempts++;
            try {
              if (aiAttempts > 1) {
                await new Promise(r => setTimeout(r, 1200));
              }
              const aiResult = await this.processWithGemini(raw.title, raw.description || raw.content || '');
              aiTitle = aiResult.title;
              aiSummary = aiResult.summary;
              aiKeyPoints = aiResult.keyPoints;
              aiProcessed = true;
              aiProcessedCount++;
              articlesAiProcessed++;
            } catch (aiErr: any) {
              const errMsg = aiErr?.message || String(aiErr);
              console.log('ℹ️ Retaining original article text (AI enrichment skipped):', errMsg.slice(0, 100));
              aiError = errMsg;
              articlesFailed++;
              
              if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('UNAVAILABLE') || errMsg.includes('503')) {
                quotaExhausted = true;
              }
            }
          }

          let finalCountry = (raw.country || 'global').toLowerCase();
          if (matchedRegionId?.startsWith('loc_ye')) {
            finalCountry = 'ye';
          } else if (matchedRegionId?.startsWith('loc_sa')) {
            finalCountry = 'sa';
          } else if (matchedRegionId?.startsWith('loc_ae')) {
            finalCountry = 'ae';
          }

          const articleRecord = {
            id: articleId,
            sourceId: raw.sourceId || null,
            sourceName: raw.sourceName || 'Unknown',
            title: aiTitle || raw.title,
            originalTitle: raw.title,
            description: aiSummary || raw.description || null,
            content: raw.content || null,
            url: raw.url,
            canonicalUrl,
            contentHash,
            imageUrl: raw.imageUrl || null,
            language: raw.language || 'ar',
            country: finalCountry,
            regionId: matchedRegionId,
            regionName: matchedRegionName,
            category: raw.category || 'general',
            publishedAt,
            aiTitle,
            aiSummary,
            aiKeyPoints,
            aiLocationVerified: locationVerified,
            aiProcessed,
            aiError,
            fetchedAt: new Date().toISOString()
          };

          if (isPg && pool) {
            await pool.query(
              `INSERT INTO news_articles (
                id, source_id, source_name, title, original_title, description, content, url, canonical_url,
                content_hash, image_url, language, country, region_id, region_name, category, published_at,
                ai_title, ai_summary, ai_key_points, ai_location_verified, ai_processed, ai_error, fetched_at, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW(), NOW())`,
              [
                articleRecord.id,
                articleRecord.sourceId,
                articleRecord.sourceName,
                articleRecord.title,
                articleRecord.originalTitle,
                articleRecord.description,
                articleRecord.content,
                articleRecord.url,
                articleRecord.canonicalUrl,
                articleRecord.contentHash,
                articleRecord.imageUrl,
                articleRecord.language,
                articleRecord.country,
                articleRecord.regionId,
                articleRecord.regionName,
                articleRecord.category,
                articleRecord.publishedAt,
                articleRecord.aiTitle,
                articleRecord.aiSummary,
                JSON.stringify(articleRecord.aiKeyPoints),
                articleRecord.aiLocationVerified,
                articleRecord.aiProcessed,
                articleRecord.aiError
              ]
            );
          } else {
            const data = (this.db as any).getJsonData();
            if (!data.newsArticles) data.newsArticles = [];
            data.newsArticles.unshift(articleRecord);
            (this.db as any).saveJson(data);
          }
        } catch (artErr: any) {
          console.warn('Failed to insert/process raw article:', artErr?.message || artErr);
          articlesFailed++;
        }
      }

      const finishedAt = new Date().toISOString();
      const status = articlesFailed > 0 && articlesNew === 0 ? 'failed' : articlesFailed > 0 ? 'partial' : 'success';

      if (isPg && pool) {
        await pool.query(
          `UPDATE news_fetch_jobs SET
            finished_at = $1, status = $2, sources_checked = $3, articles_found = $4,
            articles_new = $5, articles_duplicate = $6, articles_ai_processed = $7, articles_failed = $8
           WHERE id = $9`,
          [finishedAt, status, sourcesChecked, articlesFound, articlesNew, articlesDuplicate, articlesAiProcessed, articlesFailed, jobId]
        );
        await pool.query('UPDATE news_settings SET last_run_at = NOW() WHERE id = $1', ['default']);
      } else {
        const data = (this.db as any).getJsonData();
        const job = (data.newsFetchJobs || []).find((j: any) => j.id === jobId);
        if (job) {
          job.finished_at = finishedAt;
          job.status = status;
          job.sources_checked = sourcesChecked;
          job.articles_found = articlesFound;
          job.articles_new = articlesNew;
          job.articles_duplicate = articlesDuplicate;
          job.articles_ai_processed = articlesAiProcessed;
          job.articles_failed = articlesFailed;
        }
        if (data.newsSettings?.[0]) {
          data.newsSettings[0].lastRunAt = finishedAt;
        }
        (this.db as any).saveJson(data);
      }

      return {
        jobId,
        summary: {
          status,
          sourcesChecked,
          articlesFound,
          articlesNew,
          articlesDuplicate,
          articlesAiProcessed,
          articlesFailed
        }
      };
    } catch (err: any) {
      errorMsg = err?.message || String(err);
      const finishedAt = new Date().toISOString();
      if (isPg && pool) {
        await pool.query(
          `UPDATE news_fetch_jobs SET finished_at = $1, status = 'failed', error_message = $2 WHERE id = $3`,
          [finishedAt, errorMsg, jobId]
        );
      } else {
        const data = (this.db as any).getJsonData();
        const job = (data.newsFetchJobs || []).find((j: any) => j.id === jobId);
        if (job) {
          job.finished_at = finishedAt;
          job.status = 'failed';
          job.error_message = errorMsg;
        }
        (this.db as any).saveJson(data);
      }
      throw err;
    } finally {
      this.isFetching = false;
    }
  }

  private async processWithGemini(title: string, text: string): Promise<{ title: string; summary: string; keyPoints: string[] }> {
    const prompt = `أنت مساعد ذكاء اصطناعي إخباري محايد. مهمتك تحليل وتلخيص الخبر المرفق فقط:
1. لا تختلق أي معلومة أو واقعة غير موجودة في النص المرفق إطلاقاً.
2. اكتب عنواناً موجزاً وواضحاً (title).
3. اكتب ملخصاً دقيقاً في سطرين إلى ثلاثة أسطر (summary).
4. استخرج 2 إلى 3 نقاط رئيسية من النص الأصلي (keyPoints).

أجب بصيغة JSON حصراً بهذا الشكل:
{
  "title": "...",
  "summary": "...",
  "keyPoints": ["...", "..."]
}

عنوان الخبر: ${title}
نص الخبر: ${text}`;

    const response = await aiGateway.generateText({
      model: 'gemini-3.8-flash',
      prompt
    });

    const responseText = response.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON returned from Gemini');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title || title,
      summary: parsed.summary || text.slice(0, 200),
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : []
    };
  }
}
