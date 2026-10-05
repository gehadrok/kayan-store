import fetch from 'node-fetch';
import RSSParser from 'rss-parser';
import { db } from '../src/server/db.ts';

const SOURCES = [
  { id: 'src_rss_yemen_monitor', name: 'يمن مونيتور', url: 'https://www.yemenmonitor.com/feed/' },
  { id: 'src_rss_mashhad', name: 'المشهد اليمني', url: 'https://almashhad-alyemeni.com/feed/' },
  { id: 'src_rss_bbc', name: 'BBC Arabic', url: 'https://feeds.bbci.co.uk/arabic/rss.xml' },
  { id: 'src_rss_aljazeera', name: 'الجزيرة نت', url: 'https://www.aljazeera.net/aljazeerarss/a7c6e2fb-b792-4329-ba77-020da1360846.xml' },
  { id: 'src_rss_sky', name: 'سكاي نيوز عربية', url: 'https://www.skynewsarabia.com/rss.xml' },
  { id: 'src_rss_france24', name: 'فرانس 24', url: 'https://www.france24.com/ar/rss' },
  { id: 'src_rss_rt', name: 'RT Arabic', url: 'https://arabic.rt.com/rss/' }
];

export function normalizeCanonicalUrl(rawUrl: string, baseUrl?: string): string {
  if (!rawUrl) return '';
  let fullUrl = rawUrl.trim()
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

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

  if (!rawLink || rawLink === baseUrl || rawLink.endsWith('/feed') || rawLink.endsWith('/feed/')) {
    const guid = typeof item.guid === 'string' ? item.guid : (item.guid?._ || item.guid?.['$']?.text || item.id);
    if (typeof guid === 'string' && (guid.startsWith('http://') || guid.startsWith('https://'))) {
      rawLink = guid.trim();
    }
  }

  if (!rawLink) return '';

  return normalizeCanonicalUrl(rawLink, baseUrl);
}

async function verifyUrl(targetUrl: string): Promise<{ ok: boolean; status: number; finalUrl: string; contentType: string }> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  try {
    // Try HEAD first
    let res = await fetch(targetUrl, { method: 'HEAD', headers, redirect: 'follow' });
    if (res.status === 405 || res.status === 403) {
      // Fallback to GET if HEAD blocked
      res = await fetch(targetUrl, { method: 'GET', headers, redirect: 'follow' });
    }

    const contentType = res.headers.get('content-type') || '';
    const finalUrl = res.url || targetUrl;

    const isOk = res.ok && !finalUrl.endsWith('/feed/') && !finalUrl.endsWith('/feed');
    return {
      ok: isOk,
      status: res.status,
      finalUrl,
      contentType
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      finalUrl: targetUrl,
      contentType: 'error: ' + (err?.message || err)
    };
  }
}

async function main() {
  console.log('================================================================');
  console.log('KAYAN NEWS — URL EXTRACTION & HTTP HEALTH DIAGNOSTIC');
  console.log('================================================================\n');

  const parser = new RSSParser({
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  let totalChecked = 0;
  let totalHealthy = 0;
  let totalFailed = 0;

  for (const src of SOURCES) {
    console.log(`\nTesting Source: ${src.name} (${src.url})`);
    try {
      const feed = await parser.parseURL(src.url);
      const items = feed.items || [];
      console.log(`  Feed Items Count: ${items.length}`);

      if (items.length > 0) {
        const sample = items.slice(0, 2);
        for (let i = 0; i < sample.length; i++) {
          totalChecked++;
          const item = sample[i];
          const extractedUrl = extractAndNormalizeArticleUrl(item, src.url);
          console.log(`  Sample ${i + 1}:`);
          console.log(`    Title: ${item.title?.slice(0, 60)}`);
          console.log(`    Raw Link: ${item.link}`);
          console.log(`    Normalized URL: ${extractedUrl}`);

          const testResult = await verifyUrl(extractedUrl);
          console.log(`    HTTP Check Status: ${testResult.status} | OK: ${testResult.ok}`);
          console.log(`    Final Destination: ${testResult.finalUrl}`);
          console.log(`    Content-Type: ${testResult.contentType}`);

          if (testResult.ok) {
            totalHealthy++;
          } else {
            totalFailed++;
          }
        }
      }
    } catch (err: any) {
      console.error(`  Error parsing feed for ${src.name}:`, err?.message || err);
    }
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: Total Checked: ${totalChecked} | Healthy: ${totalHealthy} | Failed: ${totalFailed}`);
  console.log('================================================================');
}

main().catch(console.error);
