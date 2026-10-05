import RSSParser from 'rss-parser';

const FEEDS = [
  { name: 'يمن مونيتور', url: 'https://www.yemenmonitor.com/feed/' },
  { name: 'المشهد اليمني', url: 'https://almashhad-alyemeni.com/feed/' },
  { name: 'BBC Arabic', url: 'https://feeds.bbci.co.uk/arabic/rss.xml' },
  { name: 'الجزيرة نت', url: 'https://www.aljazeera.net/aljazeerarss/a7c6e2fb-b792-4329-ba77-020da1360846.xml' },
  { name: 'سكاي نيوز عربية', url: 'https://www.skynewsarabia.com/rss.xml' },
  { name: 'فرانس 24', url: 'https://www.france24.com/ar/rss' },
  { name: 'RT Arabic', url: 'https://arabic.rt.com/rss/' }
];

async function inspectFeeds() {
  const parser = new RSSParser({
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  for (const f of FEEDS) {
    console.log(`\n=================== FEED: ${f.name} ===================`);
    try {
      const feed = await parser.parseURL(f.url);
      const firstItem = feed.items[0];
      if (firstItem) {
        console.log('Title:', firstItem.title);
        console.log('item.link:', typeof firstItem.link, JSON.stringify(firstItem.link));
        console.log('item.guid:', typeof firstItem.guid, JSON.stringify(firstItem.guid));
        console.log('item.origLink:', (firstItem as any).origLink);
        console.log('item.id:', firstItem.id);
      } else {
        console.log('No items found');
      }
    } catch (e: any) {
      console.error('Error fetching feed:', e?.message || e);
    }
  }
}

inspectFeeds();
