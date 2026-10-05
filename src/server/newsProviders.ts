import fetch from 'node-fetch';
import RSSParser from 'rss-parser';
import { COUNTRIES } from '../data/countries.ts';

export interface RawArticle {
  title: string;
  originalTitle: string;
  description?: string;
  content?: string;
  url: string;
  canonicalUrl: string;
  imageUrl?: string;
  publishedAt: string;
  language?: string;
  country?: string;
  category?: string;
  sourceName?: string;
  sourceId?: string;
}

export interface NewsProvider {
  name: string;
  fetchArticles(country?: string, category?: string, query?: string): Promise<RawArticle[]>;
}

// Clean HTML tags and entities from string
export function stripHtml(html: string = ''): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract first image url from HTML string
export function extractImageUrlFromHtml(html: string = ''): string | undefined {
  if (!html) return undefined;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1] && (match[1].startsWith('http://') || match[1].startsWith('https://'))) {
    return match[1];
  }
  return undefined;
}

// Normalize canonical URL by removing common tracking query parameters
export function normalizeCanonicalUrl(rawUrl: string, baseUrl?: string): string {
  if (!rawUrl) return '';
  let fullUrl = rawUrl.trim()
    .replace(/[\r\n\t]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  try {
    const parsed = baseUrl ? new URL(fullUrl, baseUrl) : new URL(fullUrl);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'traffic_source', 'at_medium', 'at_campaign', 'ref_src', 'rss'
    ];
    for (const p of trackingParams) {
      parsed.searchParams.delete(p);
    }
    return parsed.toString();
  } catch {
    return fullUrl;
  }
}

// Extract article URL from RSS/Atom item accurately
export function extractAndNormalizeArticleUrl(item: any, baseUrl: string): string {
  let rawLink = '';

  if (typeof item.origLink === 'string' && item.origLink.trim()) {
    rawLink = item.origLink.trim();
  } else if (typeof item['feedburner:origLink'] === 'string' && item['feedburner:origLink'].trim()) {
    rawLink = item['feedburner:origLink'].trim();
  } else if (typeof item.link === 'string' && item.link.trim()) {
    rawLink = item.link.trim();
  } else if (item.link && typeof item.link === 'object') {
    if (typeof item.link.href === 'string') {
      rawLink = item.link.href.trim();
    } else if (item.link['$'] && typeof item.link['$'].href === 'string') {
      rawLink = item.link['$'].href.trim();
    }
  } else if (Array.isArray(item.link)) {
    for (const l of item.link) {
      if (typeof l === 'string' && l.trim()) {
        rawLink = l.trim();
        break;
      } else if (l && typeof l === 'object') {
        const href = l.href || l['$']?.href;
        if (typeof href === 'string' && href.trim()) {
          rawLink = href.trim();
          break;
        }
      }
    }
  }

  const cleanBase = baseUrl.replace(/\/feed\/?$/, '');
  if (!rawLink || rawLink === baseUrl || rawLink === cleanBase || rawLink.endsWith('/feed') || rawLink.endsWith('/feed/')) {
    const guid = typeof item.guid === 'string' ? item.guid : (item.guid?._ || item.guid?.['$']?.text || item.id);
    if (typeof guid === 'string' && (guid.startsWith('http://') || guid.startsWith('https://'))) {
      rawLink = guid.trim();
    }
  }

  if (!rawLink) return '';

  return normalizeCanonicalUrl(rawLink, baseUrl);
}

export class GNewsProvider implements NewsProvider {
  name = 'gnews';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GNEWS_API_KEY || process.env.NEWS_API_KEY || '';
  }

  async fetchArticles(country = 'ye', category = 'general', query?: string): Promise<RawArticle[]> {
    if (!this.apiKey) {
      console.warn('GNews API key is not configured');
      return [];
    }
    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const url = `https://gnews.io/api/v4/top-headlines?country=${country}&category=${category}&lang=ar&apikey=${this.apiKey}${qParam}`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`GNews API error: ${res.status} ${res.statusText}`);
    }
    const data: any = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) {
      return [];
    }

    return data.articles.map((art: any) => ({
      title: stripHtml(art.title || ''),
      originalTitle: art.title || '',
      description: stripHtml(art.description || ''),
      content: stripHtml(art.content || art.description || ''),
      url: art.url || '',
      canonicalUrl: normalizeCanonicalUrl(art.url || ''),
      imageUrl: art.image || undefined,
      publishedAt: art.publishedAt || new Date().toISOString(),
      language: 'ar',
      country,
      category,
      sourceName: art.source?.name || 'GNews'
    }));
  }
}

export class NewsApiOrgProvider implements NewsProvider {
  name = 'newsapi';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEWSAPI_ORG_KEY || process.env.NEWSAPI_API_KEY || '';
  }

  async fetchArticles(country = 'ye', category = 'general', query?: string): Promise<RawArticle[]> {
    if (!this.apiKey) {
      console.warn('NewsAPI.org key is not configured');
      return [];
    }
    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&apiKey=${this.apiKey}${qParam}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`NewsAPI.org error: ${res.status} ${res.statusText}`);
    }
    const data: any = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) {
      return [];
    }

    return data.articles.map((art: any) => ({
      title: stripHtml(art.title || ''),
      originalTitle: art.title || '',
      description: stripHtml(art.description || ''),
      content: stripHtml(art.content || art.description || ''),
      url: art.url || '',
      canonicalUrl: normalizeCanonicalUrl(art.url || ''),
      imageUrl: art.urlToImage || undefined,
      publishedAt: art.publishedAt || new Date().toISOString(),
      language: 'ar',
      country,
      category,
      sourceName: art.source?.name || 'NewsAPI'
    }));
  }
}

export class RssFeedProvider implements NewsProvider {
  name = 'rss';
  private parser: RSSParser;

  constructor() {
    this.parser = new RSSParser({
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 KayanNews/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      customFields: {
        item: [
          ['source', 'source'],
          ['media:content', 'mediaContent', { keepArray: true }],
          ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
          ['content:encoded', 'contentEncoded'],
          ['enclosure', 'enclosure']
        ]
      }
    });
  }

  private getCandidateUrls(country: string, category: string, query?: string): string[] {
    const c = country.toUpperCase();
    const cat = category.toLowerCase();
    const urls: string[] = [];

    if (query) {
      urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ar&gl=${c === 'YE' ? 'YE' : c}&ceid=${c}:ar`);
    }

    if (c === 'YE') {
      if (cat === 'business') {
        urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent('اقتصاد اليمن')}&hl=ar&gl=YE&ceid=YE:ar`);
      } else if (cat === 'sports') {
        urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent('رياضة اليمن')}&hl=ar&gl=YE&ceid=YE:ar`);
      } else {
        urls.push('https://www.yemenmonitor.com/feed');
        urls.push('https://almashhad-alyemeni.com/feed/');
        urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent('اليمن')}&hl=ar&gl=YE&ceid=YE:ar`);
      }
      return urls;
    }

    let topic: string | null = null;
    if (cat === 'business') topic = 'BUSINESS';
    else if (cat === 'technology') topic = 'TECHNOLOGY';
    else if (cat === 'sports') topic = 'SPORTS';
    else if (cat === 'health') topic = 'HEALTH';
    else if (cat === 'science') topic = 'SCIENCE';

    if (topic) {
      urls.push(`https://news.google.com/rss/headlines/section/topic/${topic}?hl=ar&gl=${c}&ceid=${c}:ar`);
    }

    // Top headlines for that country
    urls.push(`https://news.google.com/rss?hl=ar&gl=${c}&ceid=${c}:ar`);

    if (cat === 'business') {
      const countryData = COUNTRIES.find(x => x.code === c);
      const name = countryData ? countryData.nameAr : c;
      urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent('اقتصاد ' + name)}&hl=ar&gl=${c}&ceid=${c}:ar`);
    }

    return urls;
  }

  async fetchArticles(country = 'ye', category = 'general', query?: string, feedUrl?: string): Promise<RawArticle[]> {
    const urlsToTry: string[] = feedUrl ? [feedUrl] : this.getCandidateUrls(country, category, query);
    const allArticles: RawArticle[] = [];
    const seenUrls = new Set<string>();

    for (const urlToFetch of urlsToTry) {
      try {
        const feed = await this.parser.parseURL(urlToFetch);
        const items = feed.items || [];
        if (items.length === 0) continue;

        for (const item of items) {
          const rawTitle = (item.title || '').trim();
          if (!rawTitle) continue;

          let sourceName = feed.title ? stripHtml(feed.title) : 'RSS Feed';
          let cleanTitle = stripHtml(rawTitle);

          // Handle Google News style "Headline - Source Name"
          if (item.source) {
            sourceName = typeof item.source === 'string' ? item.source : (item.source?._ || item.source?.['$']?.url || sourceName);
          } else if (cleanTitle.includes(' - ')) {
            const parts = cleanTitle.split(' - ');
            if (parts.length > 1 && parts[parts.length - 1].length < 40) {
              sourceName = parts[parts.length - 1].trim();
              cleanTitle = parts.slice(0, parts.length - 1).join(' - ').trim();
            }
          }

          const articleUrl = extractAndNormalizeArticleUrl(item, urlToFetch);
          if (!articleUrl || seenUrls.has(articleUrl)) continue;
          seenUrls.add(articleUrl);

          const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : (item.isoDate || new Date().toISOString());
          const rawBody = item.contentEncoded || item['content:encoded'] || item.content || item.summary || item.contentSnippet || item.description || '';
          const cleanDesc = stripHtml(item.contentSnippet || item.description || rawBody);

          let imageUrl: string | undefined = undefined;
          if (item.enclosure?.url && typeof item.enclosure.url === 'string') {
            imageUrl = item.enclosure.url;
          } else if (item.mediaContent?.[0]?.['$']?.url) {
            imageUrl = item.mediaContent[0]['$'].url;
          } else if (item.mediaThumbnail?.[0]?.['$']?.url) {
            imageUrl = item.mediaThumbnail[0]['$'].url;
          } else {
            imageUrl = extractImageUrlFromHtml(rawBody) || extractImageUrlFromHtml(item.description);
          }

          allArticles.push({
            title: cleanTitle,
            originalTitle: rawTitle,
            description: cleanDesc.slice(0, 500),
            content: cleanDesc,
            url: articleUrl,
            canonicalUrl: articleUrl,
            imageUrl,
            publishedAt: pubDate,
            language: 'ar',
            country: country.toLowerCase(),
            category: category.toLowerCase(),
            sourceName
          });

          if (allArticles.length >= 35) break;
        }

        if (allArticles.length >= 10) break;
      } catch (err: any) {
        console.warn(`RSS fetch failed for ${urlToFetch}:`, err?.message || err);
      }
    }

    if (query) {
      const q = query.toLowerCase();
      return allArticles.filter(a => a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q)));
    }

    return allArticles;
  }
}

export class NewsProviderManager {
  private providers: NewsProvider[] = [];

  constructor() {
    this.providers.push(new RssFeedProvider());
    this.providers.push(new GNewsProvider());
    this.providers.push(new NewsApiOrgProvider());
  }

  registerProvider(provider: NewsProvider) {
    this.providers.unshift(provider);
  }

  async fetchWithFallback(country: string, category: string, query?: string, feedUrl?: string): Promise<{ articles: RawArticle[]; providerName: string }> {
    const countryCode = (country || 'ye').toLowerCase();
    const categoryNormalized = (category || 'general').toLowerCase();

    // 1. Try RSS Provider (with feedUrl or auto-resolved high-quality feeds)
    const rssProvider = this.providers.find(p => p.name === 'rss') as RssFeedProvider;
    if (rssProvider) {
      try {
        const articles = await rssProvider.fetchArticles(countryCode, categoryNormalized, query, feedUrl);
        if (articles.length > 0) {
          return { articles, providerName: 'rss' };
        }
      } catch (rssErr: any) {
        console.warn(`RSS fetch failed for country ${countryCode}:`, rssErr?.message || rssErr);
      }
    }

    // 2. Try GNews and NewsAPI if configured
    for (const provider of this.providers) {
      if (provider.name === 'rss') continue;
      try {
        const articles = await provider.fetchArticles(countryCode, categoryNormalized, query);
        if (articles.length > 0) {
          return { articles, providerName: provider.name };
        }
      } catch (err: any) {
        console.warn(`Provider ${provider.name} failed:`, err?.message || err);
      }
    }

    // 3. Fallback: Search-based fetch using country names
    const countryData = COUNTRIES.find(c => c.code.toLowerCase() === countryCode);
    if (countryData) {
      const searchQuery = query || countryData.searchTerms.join(' OR ');
      for (const provider of this.providers) {
        if (provider.name === 'rss') continue;
        try {
          const articles = await provider.fetchArticles(undefined, categoryNormalized, searchQuery);
          if (articles.length > 0) {
            articles.forEach(a => { a.country = countryCode; a.category = categoryNormalized; });
            return { articles, providerName: `${provider.name}_search` };
          }
        } catch {}
      }
    }

    // Return empty results cleanly without throwing unhandled exceptions
    return { articles: [], providerName: 'none' };
  }
}
