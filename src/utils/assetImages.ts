import type { Equipment } from '@/types';

// Curated high-resolution professional stock images for each IT asset category
export const CATEGORY_IMAGES: Record<string, string> = {
  Laptop: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop',
  Monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop',
  Peripheral: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop',
  NetworkDevice: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop',
  Default: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop'
};

/**
 * Resolves the appropriate image URL for an equipment asset.
 * If the asset specifies a custom image URL (starting with http/https), it uses that.
 * Otherwise, it falls back to the curated image for its category.
 */
export const getAssetImageUrl = (asset: Equipment | null | undefined): string => {
  if (!asset) return CATEGORY_IMAGES.Default;
  
  if (asset.image_url && (asset.image_url.startsWith('http://') || asset.image_url.startsWith('https://'))) {
    return asset.image_url;
  }
  
  if (asset.image_url_https && (asset.image_url_https.startsWith('http://') || asset.image_url_https.startsWith('https://'))) {
    return asset.image_url_https;
  }
  
  return CATEGORY_IMAGES[asset.category] || CATEGORY_IMAGES.Default;
};
