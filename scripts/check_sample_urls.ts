import fetch from 'node-fetch';

const urls = [
  { source: 'يمن مونيتور', url: 'https://www.yemenmonitor.com/Details/ArtMID/908/ArticleID/183707' },
  { source: 'المشهد اليمني', url: 'https://www.almashhad.news/news/497804' },
  { source: 'BBC Arabic', url: 'https://www.bbc.com/arabic/articles/cvrlyrn28jp0o' },
  { source: 'الجزيرة نت', url: 'https://www.aljazeera.net/sport/2026/10/3/ ذهبوا-لتوديع-فريقهم' },
  { source: 'سكاي نيوز عربية', url: 'https://www.skynewsarabia.com/middle-east/1896008' },
  { source: 'فرانس 24', url: 'https://www.france24.com/ar/فيديو/20261003' },
  { source: 'RT Arabic', url: 'https://rtarabic.com/middle_east/1839452/' }
];

async function checkAll() {
  console.log('--- CHECKING SAMPLE ARTICLE URLS ---');
  for (const item of urls) {
    try {
      const res = await fetch(encodeURI(item.url), {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        redirect: 'follow'
      });
      console.log(`[${item.source}] Status: ${res.status} | Final Destination: ${res.url}`);
    } catch (e: any) {
      console.log(`[${item.source}] Error: ${e.message}`);
    }
  }
}

checkAll();
