import { Request, Response, Express } from 'express';
import { Database } from './db.ts';
import { NewsEngine } from './newsEngine.ts';
import crypto from 'crypto';
import { COUNTRIES, getCountryByCode } from '../data/countries.ts';
import { normalizeCategory, normalizeCountryCode } from '../utils/newsUtils.ts';

export function setupNewsApi(app: Express, db: Database, newsEngine: NewsEngine, requireAdmin: any) {

  // ==========================================
  // PUBLIC NEWS API ENDPOINTS
  // ==========================================

  // Get articles with filters & pagination
  app.get('/api/news', async (req: Request, res: Response) => {
    try {
      const rawCountry = (req.query.country as string) || 'ALL';
      const country = normalizeCountryCode(rawCountry);
      const regionId = req.query.regionId as string;
      const district = req.query.district as string;
      const rawCategory = req.query.category as string;
      const category = rawCategory ? normalizeCategory(rawCategory) : undefined;
      const sourceName = req.query.sourceName as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const search = req.query.search as string;
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.max(1, Math.min(50, parseInt((req.query.limit as string) || '12', 10)));
      const offset = (page - 1) * limit;

      const pool = (db as any).pool;
      const isPg = (db as any).isPg;

      // Logic to trigger on-demand fetch if no news exists for this country/category
      // Only for specific countries, not for 'ALL' or 'GLOBAL'
      if (country && country !== 'ALL' && country !== 'GLOBAL') {
        const countryLower = country.toLowerCase();
        let count = 0;
        if (isPg && pool) {
          let countQuery = 'SELECT COUNT(*) FROM news_articles WHERE country = $1';
          const countParams = [countryLower];
          if (category && category !== 'general' && category !== 'all') {
            countQuery += ' AND category = $2';
            countParams.push(category);
          }
          const checkRes = await pool.query(countQuery, countParams);
          count = parseInt(checkRes.rows[0].count, 10);
        } else {
          const data = (db as any).getJsonData();
          count = (data.newsArticles || []).filter((a: any) => {
            const matchesCountry = (a.country || '').toLowerCase() === countryLower;
            if (!matchesCountry) return false;
            if (category && category !== 'general' && category !== 'all') {
              return a.category === category;
            }
            return true;
          }).length;
        }

        if (count === 0) {
          try {
            await newsEngine.runFetchCycleForCountry(country, category || 'general');
          } catch (fetchErr: any) {
            console.warn(`On-demand fetch for ${country} (${category || 'general'}):`, fetchErr?.message || fetchErr);
          }
        }
      }

      if (isPg && pool) {
        let query = 'SELECT * FROM news_articles WHERE 1=1';
        const params: any[] = [];
        let idx = 1;

        if (country && country !== 'GLOBAL' && country !== 'ALL') {
          query += ` AND country = $${idx++}`;
          params.push(country.toLowerCase());
        }

        if (regionId) {
          // Strict filtering by region_id if provided
          query += ` AND region_id = $${idx++}`;
          params.push(regionId);
        } else if (district) {
          // If no specific region but a district name is provided, fuzzy search
          query += ` AND (title ILIKE $${idx} OR description ILIKE $${idx} OR content ILIKE $${idx} OR region_name ILIKE $${idx})`;
          params.push(`%${district}%`);
          idx++;
        }

        if (category && category !== 'general' && category !== 'all') {
          query += ` AND category = $${idx++}`;
          params.push(category);
        }
        if (sourceName && sourceName !== 'all') {
          query += ` AND source_name = $${idx++}`;
          params.push(sourceName);
        }
        if (startDate) {
          query += ` AND published_at >= $${idx++}`;
          params.push(startDate);
        }
        if (endDate) {
          query += ` AND published_at <= $${idx++}`;
          params.push(endDate);
        }
        if (search) {
          query += ` AND (title ILIKE $${idx} OR description ILIKE $${idx} OR content ILIKE $${idx})`;
          params.push(`%${search}%`);
          idx++;
        }

        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
        const countRes = await pool.query(countQuery, params);
        const total = parseInt(countRes.rows[0].count, 10);

        query += ` ORDER BY published_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(limit, offset);

        const articlesRes = await pool.query(query, params);
        const mapArticleRow = (r: any) => ({
          id: r.id,
          sourceId: r.source_id,
          sourceName: r.source_name,
          title: r.ai_title || r.title,
          originalTitle: r.original_title,
          description: r.ai_summary || r.description,
          content: r.content,
          url: r.url,
          canonicalUrl: r.canonical_url,
          contentHash: r.content_hash,
          imageUrl: r.image_url,
          language: r.language,
          country: r.country,
          regionId: r.region_id,
          regionName: r.region_name,
          category: r.category,
          publishedAt: r.published_at,
          aiTitle: r.ai_title,
          aiSummary: r.ai_summary,
          aiKeyPoints: r.ai_key_points,
          aiLocationVerified: r.ai_location_verified,
          aiProcessed: r.ai_processed,
          aiError: r.ai_error,
          fetchedAt: r.fetched_at
        });

        const articles = articlesRes.rows.map(mapArticleRow);

        // Fetch top 10 breaking news for live ticker (respect filters if possible)
        let breakingQuery = 'SELECT * FROM news_articles WHERE 1=1';
        const breakingParams: any[] = [];
        let bIdx = 1;
        if (country && country !== 'GLOBAL' && country !== 'ALL') {
          breakingQuery += ` AND country = $${bIdx++}`;
          breakingParams.push(country.toLowerCase());
        }
        if (regionId) {
          breakingQuery += ` AND region_id = $${bIdx++}`;
          breakingParams.push(regionId);
        }
        breakingQuery += ` ORDER BY published_at DESC LIMIT 10`;
        const breakingRes = await pool.query(breakingQuery, breakingParams);
        const breakingNews = breakingRes.rows.map(mapArticleRow);

        res.json({
          success: true,
          articles,
          breakingNews,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1
          }
        });
      } else {
        // JSON fallback
        const data = (db as any).getJsonData();
        if (!data.newsArticles) data.newsArticles = [];
        let list = [...data.newsArticles];

        if (country && country.toUpperCase() !== 'GLOBAL' && country.toUpperCase() !== 'ALL') {
          const cLower = country.toLowerCase();
          list = list.filter((a: any) => (a.country || 'ye').toLowerCase() === cLower);
        }
        if (regionId) {
          list = list.filter((a: any) => a.regionId === regionId || (a.regionName || '').includes(regionId));
        }
        if (district) {
          const d = district.toLowerCase();
          list = list.filter((a: any) =>
            (a.title || '').toLowerCase().includes(d) ||
            (a.description || '').toLowerCase().includes(d) ||
            (a.content || '').toLowerCase().includes(d)
          );
        }
        if (category && category !== 'general' && category !== 'all') {
          list = list.filter((a: any) => a.category === category);
        }
        if (sourceName && sourceName !== 'all') {
          const s = sourceName.toLowerCase();
          list = list.filter((a: any) => (a.sourceName || '').toLowerCase().includes(s));
        }
        if (startDate) {
          const startTime = new Date(startDate).getTime();
          list = list.filter((a: any) => new Date(a.publishedAt).getTime() >= startTime);
        }
        if (endDate) {
          const endTime = new Date(endDate).getTime();
          list = list.filter((a: any) => new Date(a.publishedAt).getTime() <= endTime);
        }
        if (search) {
          const q = search.toLowerCase();
          list = list.filter((a: any) =>
            (a.title || '').toLowerCase().includes(q) ||
            (a.description || '').toLowerCase().includes(q) ||
            (a.content || '').toLowerCase().includes(q)
          );
        }

        list.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        const total = list.length;
        const paged = list.slice(offset, offset + limit);

        // Filter breaking news similarly
        let breakingList = [...data.newsArticles];
        if (country && country.toUpperCase() !== 'GLOBAL' && country.toUpperCase() !== 'ALL') {
          const cLower = country.toLowerCase();
          breakingList = breakingList.filter((a: any) => (a.country || 'ye').toLowerCase() === cLower);
        }
        if (regionId) {
          breakingList = breakingList.filter((a: any) => a.regionId === regionId || (a.regionName || '').includes(regionId));
        }
        breakingList = breakingList
          .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
          .slice(0, 10);

        res.json({
          success: true,
          articles: paged,
          breakingNews: breakingList,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1
          }
        });
      }
    } catch (err: any) {
      console.error('Failed to get news articles:', err);
      res.status(500).json({ success: false, error: 'فشل في جلب الأخبار' });
    }
  });

  // Get countries
  app.get('/api/news/countries', async (req: Request, res: Response) => {
    try {
      // Use the comprehensive COUNTRIES list instead of querying DB for fixed list
      res.json({ 
        success: true, 
        countries: COUNTRIES.map(c => ({
          country_code: c.code,
          name_ar: c.nameAr,
          name_en: c.nameEn,
          emoji: c.emoji
        }))
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل جلب الدول' });
    }
  });

  // Get regions (governorates/cities)
  app.get('/api/news/regions', async (req: Request, res: Response) => {
    try {
      const countryCode = ((req.query.countryCode as string) || 'YE').toUpperCase();
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        const r = await pool.query("SELECT id, name_ar, name_en, country_code, type FROM news_locations WHERE UPPER(country_code) = $1 AND type != 'country'", [countryCode]);
        res.json({ success: true, regions: r.rows });
      } else {
        const data = (db as any).getJsonData();
        const locs = (data.newsLocations || []).filter((l: any) =>
          ((l.countryCode || l.country_code || '').toUpperCase() === countryCode) && l.type !== 'country'
        );
        res.json({
          success: true,
          regions: locs.map((l: any) => ({
            id: l.id,
            name_ar: l.nameAr || l.name_ar,
            name_en: l.nameEn || l.name_en,
            country_code: l.countryCode || l.country_code,
            type: l.type
          }))
        });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل جلب المناطق' });
    }
  });

  // Get categories
  app.get('/api/news/categories', async (req: Request, res: Response) => {
    res.json({
      success: true,
      categories: [
        { id: 'general', nameAr: 'عام' },
        { id: 'politics', nameAr: 'سياسة' },
        { id: 'business', nameAr: 'اقتصاد' },
        { id: 'technology', nameAr: 'تكنولوجيا' },
        { id: 'science', nameAr: 'علوم' },
        { id: 'sports', nameAr: 'رياضة' },
        { id: 'health', nameAr: 'صحة' }
      ]
    });
  });

  // Get article by id
  app.get('/api/news/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        const r = await pool.query('SELECT * FROM news_articles WHERE id = $1', [id]);
        if (r.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'الخبر غير موجود' });
        }
        const row = r.rows[0];
        res.json({
          success: true,
          article: {
            id: row.id,
            sourceId: row.source_id,
            sourceName: row.source_name,
            title: row.ai_title || row.title,
            originalTitle: row.original_title,
            description: row.ai_summary || row.description,
            content: row.content,
            url: row.url,
            canonicalUrl: row.canonical_url,
            imageUrl: row.image_url,
            language: row.language,
            country: row.country,
            regionId: row.region_id,
            regionName: row.region_name,
            category: row.category,
            publishedAt: row.published_at,
            aiTitle: row.ai_title,
            aiSummary: row.ai_summary,
            aiKeyPoints: row.ai_key_points,
            aiLocationVerified: row.ai_location_verified,
            aiProcessed: row.ai_processed,
            aiError: row.ai_error,
            fetchedAt: row.fetched_at
          }
        });
      } else {
        const data = (db as any).getJsonData();
        const found = (data.newsArticles || []).find((a: any) => a.id === id);
        if (!found) {
          return res.status(404).json({ success: false, error: 'الخبر غير موجود' });
        }
        res.json({ success: true, article: found });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل في جلب الخبر' });
    }
  });

  // ==========================================
  // ADMIN NEWS API ENDPOINTS (Protected)
  // ==========================================

  app.get('/api/admin/news/sources', requireAdmin, async (req: Request, res: Response) => {
    try {
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        const r = await pool.query('SELECT * FROM news_sources ORDER BY created_at DESC');
        res.json({ success: true, sources: r.rows });
      } else {
        const data = (db as any).getJsonData();
        res.json({ success: true, sources: data.newsSources || [] });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل في جلب مصادر الأخبار' });
    }
  });

  app.post('/api/admin/news/sources', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, url, providerType, country } = req.body;
      if (!name || !url) {
        return res.status(400).json({ success: false, error: 'اسم المصدر والرابط مطلوبان' });
      }
      const id = 'src_' + crypto.randomBytes(6).toString('hex');
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        await pool.query(
          'INSERT INTO news_sources (id, name, url, provider_type, country, enabled) VALUES ($1, $2, $3, $4, $5, true)',
          [id, name.trim(), url.trim(), providerType || 'rss', country || 'ye']
        );
      } else {
        const data = (db as any).getJsonData();
        if (!data.newsSources) data.newsSources = [];
        data.newsSources.push({
          id,
          name: name.trim(),
          url: url.trim(),
          provider_type: providerType || 'rss',
          country: country || 'ye',
          enabled: true,
          error_count: 0,
          created_at: new Date().toISOString()
        });
        (db as any).saveJson(data);
      }
      res.status(201).json({ success: true, message: 'تم إضافة المصدر بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل في إضافة المصدر' });
    }
  });

  app.delete('/api/admin/news/sources/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        await pool.query('DELETE FROM news_sources WHERE id = $1', [id]);
      } else {
        const data = (db as any).getJsonData();
        if (data.newsSources) {
          data.newsSources = data.newsSources.filter((s: any) => s.id !== id);
          (db as any).saveJson(data);
        }
      }
      res.json({ success: true, message: 'تم حذف المصدر بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل في حذف المصدر' });
    }
  });

  app.post('/api/admin/news/sources/:id/toggle', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        await pool.query('UPDATE news_sources SET enabled = NOT enabled WHERE id = $1', [id]);
      } else {
        const data = (db as any).getJsonData();
        const s = (data.newsSources || []).find((x: any) => x.id === id);
        if (s) {
          s.enabled = !s.enabled;
          (db as any).saveJson(data);
        }
      }
      res.json({ success: true, message: 'تم تغيير حالة المصدر بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل في تغيير حالة المصدر' });
    }
  });

  app.get('/api/admin/news/locations', requireAdmin, async (req: Request, res: Response) => {
    try {
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        const lRes = await pool.query('SELECT * FROM news_locations ORDER BY country_code, name_ar');
        const aRes = await pool.query('SELECT * FROM news_location_aliases');
        res.json({ success: true, locations: lRes.rows, aliases: aRes.rows });
      } else {
        const data = (db as any).getJsonData();
        res.json({
          success: true,
          locations: data.newsLocations || [],
          aliases: data.newsLocationAliases || []
        });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل جلب المواقع' });
    }
  });

  app.post('/api/admin/news/locations', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { nameAr, nameEn, countryCode, type, aliases } = req.body;
      if (!nameAr || !nameEn || !countryCode) {
        return res.status(400).json({ success: false, error: 'بيانات الموقع مطلوبة' });
      }
      const locId = 'loc_' + crypto.randomBytes(6).toString('hex');
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        await pool.query(
          'INSERT INTO news_locations (id, name_ar, name_en, country_code, type) VALUES ($1, $2, $3, $4, $5)',
          [locId, nameAr.trim(), nameEn.trim(), countryCode.trim(), type || 'governorate']
        );
        if (Array.isArray(aliases)) {
          for (const al of aliases) {
            if (al.trim()) {
              const aliId = 'ali_' + crypto.randomBytes(6).toString('hex');
              await pool.query(
                'INSERT INTO news_location_aliases (id, location_id, alias, language) VALUES ($1, $2, $3, $4)',
                [aliId, locId, al.trim(), /[a-zA-Z]/.test(al) ? 'en' : 'ar']
              );
            }
          }
        }
      } else {
        const data = (db as any).getJsonData();
        if (!data.newsLocations) data.newsLocations = [];
        if (!data.newsLocationAliases) data.newsLocationAliases = [];
        data.newsLocations.push({
          id: locId,
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          countryCode: countryCode.trim(),
          type: type || 'governorate'
        });
        if (Array.isArray(aliases)) {
          for (const al of aliases) {
            if (al.trim()) {
              data.newsLocationAliases.push({
                id: 'ali_' + crypto.randomBytes(6).toString('hex'),
                locationId: locId,
                alias: al.trim(),
                language: /[a-zA-Z]/.test(al) ? 'en' : 'ar'
              });
            }
          }
        }
        (db as any).saveJson(data);
      }
      res.status(201).json({ success: true, message: 'تم إضافة الموقع والبدائل بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل في إضافة الموقع' });
    }
  });

  app.get('/api/admin/news/settings', requireAdmin, async (req: Request, res: Response) => {
    try {
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        const r = await pool.query('SELECT * FROM news_settings WHERE id = $1', ['default']);
        res.json({ success: true, settings: r.rows[0] || { updateIntervalMinutes: 180, enabled: true } });
      } else {
        const data = (db as any).getJsonData();
        const s = (data.newsSettings || []).find((x: any) => x.id === 'default');
        res.json({ success: true, settings: s || { updateIntervalMinutes: 180, enabled: true } });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل جلب إعدادات الأخبار' });
    }
  });

  app.put('/api/admin/news/settings', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { updateIntervalMinutes, enabled } = req.body;
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        await pool.query(
          'UPDATE news_settings SET update_interval_minutes = $1, enabled = $2, updated_at = NOW() WHERE id = $3',
          [parseInt(updateIntervalMinutes, 10) || 180, enabled !== false, 'default']
        );
      } else {
        const data = (db as any).getJsonData();
        let s = (data.newsSettings || []).find((x: any) => x.id === 'default');
        if (!s) {
          s = { id: 'default' };
          data.newsSettings.push(s);
        }
        s.updateIntervalMinutes = parseInt(updateIntervalMinutes, 10) || 180;
        s.enabled = enabled !== false;
        s.updatedAt = new Date().toISOString();
        (db as any).saveJson(data);
      }
      await newsEngine.startScheduler();
      res.json({ success: true, message: 'تم تحديث الإعدادات بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل تحديث الإعدادات' });
    }
  });

  app.post('/api/admin/news/fetch-manual', requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await newsEngine.runFetchCycle('manual');
      res.json({ success: true, message: 'تم تشغيل دورة تحديث الأخبار بنجاح', result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'فشل تحديث الأخبار' });
    }
  });

  app.get('/api/admin/news/jobs', requireAdmin, async (req: Request, res: Response) => {
    try {
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        const r = await pool.query('SELECT * FROM news_fetch_jobs ORDER BY started_at DESC LIMIT 20');
        res.json({ success: true, jobs: r.rows });
      } else {
        const data = (db as any).getJsonData();
        res.json({ success: true, jobs: (data.newsFetchJobs || []).slice(0, 20) });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل جلب سجلات التحديث' });
    }
  });

  app.get('/api/admin/news/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;
      if (isPg && pool) {
        const totalArts = await pool.query('SELECT COUNT(*) FROM news_articles');
        const totalSources = await pool.query('SELECT COUNT(*) FROM news_sources');
        const lastJob = await pool.query('SELECT * FROM news_fetch_jobs ORDER BY started_at DESC LIMIT 1');
        res.json({
          success: true,
          stats: {
            totalArticles: parseInt(totalArts.rows[0].count, 10),
            totalSources: parseInt(totalSources.rows[0].count, 10),
            lastJob: lastJob.rows[0] || null
          }
        });
      } else {
        const data = (db as any).getJsonData();
        const totalArticles = (data.newsArticles || []).length;
        const totalSources = (data.newsSources || []).length;
        const lastJob = (data.newsFetchJobs || [])[0] || null;
        res.json({
          success: true,
          stats: {
            totalArticles,
            totalSources,
            lastJob
          }
        });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل جلب الإحصائيات' });
    }
  });

  // Delete article by ID
  app.delete('/api/admin/news/articles/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;

      if (isPg && pool) {
        await pool.query('DELETE FROM news_articles WHERE id = $1', [id]);
      } else {
        const data = (db as any).getJsonData();
        if (data.newsArticles) {
          data.newsArticles = data.newsArticles.filter((a: any) => a.id !== id);
          (db as any).saveJson(data);
        }
      }
      res.json({ success: true, message: 'تم حذف الخبر بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل حذف الخبر' });
    }
  });

  // Update article location / category
  app.put('/api/admin/news/articles/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { regionId, regionName, category } = req.body;
      const pool = (db as any).pool;
      const isPg = (db as any).isPg;

      if (isPg && pool) {
        await pool.query(
          'UPDATE news_articles SET region_id = $1, region_name = $2, category = $3, updated_at = NOW() WHERE id = $4',
          [regionId || null, regionName || null, category || 'general', id]
        );
      } else {
        const data = (db as any).getJsonData();
        const art = (data.newsArticles || []).find((a: any) => a.id === id);
        if (art) {
          art.regionId = regionId || null;
          art.regionName = regionName || null;
          art.category = category || 'general';
          art.updatedAt = new Date().toISOString();
          (db as any).saveJson(data);
        }
      }
      res.json({ success: true, message: 'تم تحديث بيانات الخبر بنجاح' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل تحديث بيانات الخبر' });
    }
  });
}
