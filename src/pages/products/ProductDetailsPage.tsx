import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useUserAuth } from '../../context/UserAuthContext.tsx';
import type { Product, ProductFile, Media } from '../../types.ts';
import { 
  ArrowLeft, ArrowRight, Download, Share2, Check, ShieldCheck, 
  ExternalLink, Play, BookOpen, Smartphone, Laptop, FileText, 
  Layers, Tag, Calendar, User, Globe, AlertCircle, Copy, CheckCircle2,
  FileCode, Video, Music, Palette, ShoppingBag, Eye, Heart, Star, MessageSquare
} from 'lucide-react';

interface ProductDetailsPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

interface ProductDetailsResponse {
  product: Product & {
    media?: Media[];
    files?: ProductFile[];
    related?: Product[];
  };
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({ slug, onNavigate }) => {
  const { lang, dir } = useLanguage();
  const { user } = useUserAuth();
  const [productData, setProductData] = useState<Product | null>(null);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [fileList, setFileList] = useState<ProductFile[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedMediaPreview, setSelectedMediaPreview] = useState<Media | null>(null);

  // Favorites & Claiming
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [claimed, setClaimed] = useState<boolean>(false);
  const [claiming, setClaiming] = useState<boolean>(false);

  // Reviews State
  const [reviews, setReviews] = useState<Array<{ id: string; userId: string; userName: string; rating: number; title?: string; body: string; createdAt: string }>>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [newReviewTitle, setNewRatingTitle] = useState<string>('');
  const [newReviewBody, setNewReviewBody] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewMsg, setReviewMessage] = useState<string | null>(null);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${slug}`);
      const data = await res.json();
      if (data.success && data.product) {
        const prod = data.product;
        setProductData(prod);
        setMediaList(prod.media || []);
        setFileList(prod.files || []);
        setRelatedProducts(prod.related || []);
        setActiveImage(prod.coverUrl || prod.bannerUrl || prod.iconUrl || '');

        // Fetch favorite status & reviews
        fetchFavStatus(prod.id);
        fetchReviews(prod.id);
      } else {
        setError(data.error || (lang === 'ar' ? 'المنتج غير موجود' : 'Product not found'));
      }
    } catch (err: any) {
      console.error('Failed to load product details:', err);
      setError(lang === 'ar' ? 'حدث خطأ أثناء تحميل بيانات المنتج' : 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavStatus = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/favorite-status`);
      const data = await res.json();
      setIsFavorite(!!data.isFavorite);
    } catch {
      setIsFavorite(false);
    }
  };

  const fetchReviews = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch {
      setReviews([]);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً لإضافة المنتج إلى المفضلة' : 'Please log in to add this product to favorites');
      onNavigate('/login');
      return;
    }
    if (!productData) return;

    try {
      if (isFavorite) {
        await fetch(`/api/me/favorites/${productData.id}`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        await fetch(`/api/me/favorites/${productData.id}`, { method: 'POST' });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleClaimFree = async () => {
    if (!user) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً لإضافة المنتج إلى مكتبتك' : 'Please log in to add this product to your library');
      onNavigate('/login');
      return;
    }
    if (!productData) return;

    setClaiming(true);
    try {
      const res = await fetch(`/api/products/${productData.id}/claim-free`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setClaimed(true);
      } else {
        alert(data.error || 'فشل إضافة المنتج للمكتبة');
      }
    } catch (err) {
      alert('حدث خطأ أثناء الإضافة إلى المكتبة');
    } finally {
      setClaiming(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً لنشر مراجعتك' : 'Please log in to submit a review');
      onNavigate('/login');
      return;
    }
    if (!productData || !newReviewBody.trim()) return;

    setSubmittingReview(true);
    setReviewMessage(null);
    try {
      const res = await fetch(`/api/products/${productData.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newRating,
          title: newReviewTitle.trim() || undefined,
          body: newReviewBody.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setReviewMessage(lang === 'ar' ? 'تم نشر مراجعتك بنجاح!' : 'Review published successfully!');
        setNewReviewBody('');
        setNewRatingTitle('');
        fetchReviews(productData.id);
      } else {
        setReviewMessage(data.error || 'فشل حفظ المراجعة');
      }
    } catch (err) {
      setReviewMessage('حدث خطأ أثناء نشر المراجعة');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  // Convert safe video URL to embeddable player
  const getEmbedVideoUrl = (url?: string): string | null => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        let videoId = '';
        if (parsed.hostname.includes('youtu.be')) {
          videoId = parsed.pathname.slice(1);
        } else if (parsed.searchParams.has('v')) {
          videoId = parsed.searchParams.get('v') || '';
        } else if (parsed.pathname.includes('/embed/')) {
          videoId = parsed.pathname.split('/embed/')[1];
        }
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
      }
      if (parsed.hostname.includes('vimeo.com')) {
        const match = parsed.pathname.match(/\/(\d+)/);
        const vimeoId = match ? match[1] : '';
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
      }
    } catch {
      return null;
    }
    return null;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12" dir={dir}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-40 bg-slate-200 rounded-lg" />
            <div className="h-64 bg-slate-200 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-96 bg-slate-200 rounded-2xl md:col-span-2" />
              <div className="h-96 bg-slate-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center" dir={dir}>
        <div className="mx-auto max-w-md bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {lang === 'ar' ? 'المنتج غير متوفر' : 'Product Not Found'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {error || (lang === 'ar' ? 'عذراً، لم نتمكن من العثور على المنتج المطلوب.' : 'The requested digital product could not be located.')}
          </p>
          <button
            onClick={() => onNavigate('/products')}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
          >
            {dir === 'rtl' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{lang === 'ar' ? 'العودة إلى دليل المنتجات' : 'Back to Products'}</span>
          </button>
        </div>
      </div>
    );
  }

  const isFree = !productData.price || productData.price === 0;
  const title = (lang === 'ar' ? productData.nameAr : productData.nameEn) || productData.nameEn;
  const shortDesc = (lang === 'ar' ? productData.shortDescAr : productData.shortDescEn) || productData.shortDescEn;
  const fullDesc = (lang === 'ar' ? productData.fullDescAr : productData.fullDescEn) || productData.fullDescEn;
  const features = (lang === 'ar' ? productData.featuresAr : productData.featuresEn) || [];
  const embedVideoUrl = getEmbedVideoUrl(productData.videoUrl);

  const mainFile = fileList.find(f => f.isMain) || fileList[0];

  return (
    <div className="min-h-screen bg-slate-50 py-8" dir={dir}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('/products')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {dir === 'rtl' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{lang === 'ar' ? 'العودة إلى المنتجات' : 'Back to Products'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
              <span>{isFavorite ? (lang === 'ar' ? 'في المفضلة' : 'Favorited') : (lang === 'ar' ? 'إضافة للمفضلة' : 'Favorite')}</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copiedLink ? (lang === 'ar' ? 'تم نسخ الرابط' : 'Link Copied') : (lang === 'ar' ? 'مشاركة' : 'Share')}</span>
            </button>
          </div>
        </div>

        {/* Top Hero Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
            
            {/* Product Icon / Main Visual */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 flex items-center justify-center shadow-xs">
              {productData.iconUrl || productData.coverUrl ? (
                <img
                  src={productData.iconUrl || productData.coverUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/images/kayan_pdf_icon.jpg';
                  }}
                />
              ) : (
                <ShoppingBag className="w-12 h-12 text-slate-400" />
              )}
            </div>

            {/* Product Title, Meta & Actions */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 uppercase tracking-wide">
                  {productData.type}
                </span>
                {productData.category && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {productData.category}
                  </span>
                )}
                {productData.featured && (
                  <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                    {lang === 'ar' ? 'منتج مميز' : 'Featured'}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                {title}
              </h1>

              {productData.author && (
                <p className="text-xs sm:text-sm text-slate-600 font-medium mb-3">
                  {lang === 'ar' ? `المؤلف / الناشر: ${productData.author}` : `Author / Publisher: ${productData.author}`}
                  {productData.publisher && ` • ${productData.publisher}`}
                </p>
              )}

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {shortDesc}
              </p>

              {/* Price and Download Action Area */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium">{lang === 'ar' ? 'السعر' : 'Price'}</span>
                  <span className="text-2xl font-black text-slate-900">
                    {isFree ? (lang === 'ar' ? 'مجاني' : 'Free') : `${productData.price} ${productData.currency || 'USD'}`}
                  </span>
                </div>

                {isFree && (
                  <button
                    onClick={handleClaimFree}
                    disabled={claiming || claimed}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{claimed ? (lang === 'ar' ? 'في مكتبتك' : 'In Your Library') : (lang === 'ar' ? 'إضافة لمكتبتي المجانية' : 'Add to My Free Library')}</span>
                  </button>
                )}

                {mainFile && (
                  <a
                    href={mainFile.fileUrl}
                    download={mainFile.originalName || `${productData.slug}_file`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 text-sm shadow-md shadow-sky-600/20 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'تحميل المنتج الآن' : 'Download Now'}</span>
                    <span className="text-xs opacity-80 font-normal">({mainFile.size})</span>
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Video Preview (if available) */}
        {embedVideoUrl && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-sky-600" />
              <span>{productData.videoTitle || (lang === 'ar' ? 'العرض المرئي للمنتج' : 'Product Video Preview')}</span>
            </h3>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
              <iframe
                src={embedVideoUrl}
                title={productData.videoTitle || title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Main Content Grid: Description & Media vs Specs & Files */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Left Column (2 Cols): Full Description, Features, and Media Gallery */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Full Description & Features */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                {lang === 'ar' ? 'عن هذا المنتج' : 'About this Product'}
              </h2>
              <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-6">
                {fullDesc || shortDesc}
              </div>

              {features.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                    {lang === 'ar' ? 'أبرز المزايا والمواصفات' : 'Key Features & Specs'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Media Gallery / Screenshots */}
            {mediaList.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'معرض الصور والوسائط' : 'Media Gallery'}</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {mediaList.length} {lang === 'ar' ? 'عناصر' : 'items'}
                  </span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {mediaList.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMediaPreview(item)}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs hover:shadow-md transition-all"
                    >
                      <img
                        src={item.thumbnailUrl || item.fileUrl || ''}
                        alt={item.titleAr || item.titleEn || title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="h-6 w-6" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Downloadable Files List */}
            {fileList.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                  {lang === 'ar' ? 'الملفات المرفقة القابلة للتحميل' : 'Downloadable Files'}
                </h2>
                <div className="space-y-3">
                  {fileList.map(file => (
                    <div
                      key={file.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-sky-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">{file.title}</span>
                            {file.isMain && (
                              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                {lang === 'ar' ? 'الملف الرئيسي' : 'Main'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span className="uppercase">{file.fileType}</span>
                            {file.sha256 && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[10px]" title={file.sha256}>
                                  SHA: {file.sha256.slice(0, 8)}...
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <a
                        href={file.fileUrl}
                        download={file.originalName || file.title}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 transition-colors shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'تحميل' : 'Download'}</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews & Ratings Section */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span>{lang === 'ar' ? 'مراجعات وتقييمات العملاء' : 'Customer Reviews'}</span>
                </span>
                <span className="text-xs font-normal text-slate-500">
                  {reviews.length} {lang === 'ar' ? 'مراجعة' : 'reviews'}
                </span>
              </h2>

              {/* Submit Review Form */}
              <form onSubmit={handleSubmitReview} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-900">
                  {lang === 'ar' ? 'أضف تقييمك للمنتج:' : 'Write a Review:'}
                </h3>

                {reviewMsg && (
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 font-bold">
                    {reviewMsg}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= newRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ms-2">{newRating} / 5</span>
                </div>

                <input
                  type="text"
                  value={newReviewTitle}
                  onChange={e => setNewRatingTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'عنوان المراجعة (اختياري)...' : 'Review title (optional)...'}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:ring-2 focus:ring-sky-500/20 outline-hidden font-medium"
                />

                <textarea
                  rows={3}
                  required
                  value={newReviewBody}
                  onChange={e => setNewReviewBody(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب رأيك وتجربتك بالتفصيل عن المنتج...' : 'Share your detailed feedback...'}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:ring-2 focus:ring-sky-500/20 outline-hidden"
                />

                <button
                  type="submit"
                  disabled={submittingReview || !newReviewBody.trim()}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? (lang === 'ar' ? 'جاري النشر...' : 'Publishing...') : (lang === 'ar' ? 'نشر التقييم' : 'Submit Review')}
                </button>
              </form>

              {/* Reviews List */}
              <div className="space-y-4 pt-2">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    {lang === 'ar' ? 'لا توجد تقييمات لهذا المنتج بعد. كن أول من يشارك رأيه!' : 'No reviews yet. Be the first to share your review!'}
                  </p>
                ) : (
                  reviews.map(rev => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px]">
                            {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="font-bold text-slate-900">{rev.userName}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.title && <h4 className="font-bold text-slate-900 text-xs">{rev.title}</h4>}
                      <p className="text-slate-600 leading-relaxed text-[11px]">{rev.body}</p>
                      <span className="text-[10px] text-slate-400 block pt-1">{new Date(rev.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Metadata Box & Specifications */}
          <div className="space-y-6">
            
            {/* Technical Specifications */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4 pb-2 border-b border-slate-100">
                {lang === 'ar' ? 'معلومات ومواصفات المنتج' : 'Product Information'}
              </h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{lang === 'ar' ? 'نوع المنتج' : 'Type'}</span>
                  <span className="font-semibold text-slate-900 uppercase">{productData.type}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{lang === 'ar' ? 'التصنيف' : 'Category'}</span>
                  <span className="font-semibold text-slate-900">{productData.category}</span>
                </div>

                {productData.license && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{lang === 'ar' ? 'الترخيص' : 'License'}</span>
                    <span className="font-semibold text-slate-900">{productData.license}</span>
                  </div>
                )}

                {/* Ebook specifics */}
                {productData.pages ? (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{lang === 'ar' ? 'عدد الصفحات' : 'Pages'}</span>
                    <span className="font-semibold text-slate-900">{productData.pages}</span>
                  </div>
                ) : null}

                {productData.language && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{lang === 'ar' ? 'اللغة' : 'Language'}</span>
                    <span className="font-semibold text-slate-900">{productData.language}</span>
                  </div>
                )}

                {productData.isbn && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">ISBN</span>
                    <span className="font-mono text-slate-900">{productData.isbn}</span>
                  </div>
                )}

                {/* Android / Software specifics */}
                {productData.versionName && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{lang === 'ar' ? 'رقم الإصدار' : 'Version'}</span>
                    <span className="font-semibold text-slate-900">v{productData.versionName}</span>
                  </div>
                )}

                {productData.packageName && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{lang === 'ar' ? 'اسم الحزمة' : 'Package'}</span>
                    <span className="font-mono text-[10px] text-slate-800">{productData.packageName}</span>
                  </div>
                )}

                {productData.minAndroid && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{lang === 'ar' ? 'الحد الأدنى للنظام' : 'Min OS'}</span>
                    <span className="font-semibold text-slate-900">{productData.minAndroid}</span>
                  </div>
                )}

                {productData.sha256 && (
                  <div className="py-1 border-b border-slate-100">
                    <span className="text-slate-500 block mb-1">SHA-256</span>
                    <span className="font-mono text-[10px] text-slate-800 break-all bg-slate-50 p-1.5 rounded-lg block">
                      {productData.sha256}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">{lang === 'ar' ? 'تاريخ الإضافة' : 'Added Date'}</span>
                  <span className="text-slate-700">{productData.createdAt.split('T')[0]}</span>
                </div>
              </div>

              {/* Tags */}
              {productData.tags && productData.tags.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 block mb-2">{lang === 'ar' ? 'الوسوم' : 'Tags'}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {productData.tags.map((tag, i) => (
                      <span key={i} className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-base mb-4 pb-2 border-b border-slate-100">
                  {lang === 'ar' ? 'منتجات ذات صلة' : 'Related Products'}
                </h3>
                <div className="space-y-3">
                  {relatedProducts.map(rel => (
                    <div
                      key={rel.id}
                      onClick={() => onNavigate(`/products/${rel.slug}`)}
                      className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                        <img
                          src={rel.coverUrl || rel.iconUrl || '/assets/images/kayan_pdf_icon.jpg'}
                          alt={rel.nameEn}
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assets/images/kayan_pdf_icon.jpg';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 truncate transition-colors">
                          {lang === 'ar' ? rel.nameAr : rel.nameEn}
                        </h4>
                        <span className="text-[11px] text-slate-500 capitalize">{rel.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Media Preview Modal */}
      {selectedMediaPreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedMediaPreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <img
              src={selectedMediaPreview.fileUrl || selectedMediaPreview.thumbnailUrl || ''}
              alt=""
              className="max-h-[80vh] w-auto object-contain mx-auto rounded-2xl"
            />
            <button
              onClick={() => setSelectedMediaPreview(null)}
              className="absolute top-4 end-4 rounded-full bg-slate-900/60 text-white p-2 hover:bg-slate-900 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
