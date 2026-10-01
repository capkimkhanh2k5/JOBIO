import { htmlToPlainText } from '@/lib/htmlText';

type SeoOptions = {
  title: string;
  description?: string | null;
  canonicalPath?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, unknown>;
};

function getOrCreateMeta(name: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  return meta;
}

function getOrCreateCanonical() {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  return link;
}

export function absoluteSiteUrl(path = window.location.pathname) {
  return new URL(path, window.location.origin).toString();
}

export function plainSeoText(value?: string | null, limit = 160) {
  const text = htmlToPlainText(value).replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 1).trim()}...` : text;
}

export function setPageSeo(options: SeoOptions) {
  const previousTitle = document.title;
  const meta = getOrCreateMeta('description');
  const previousDescription = meta.getAttribute('content');
  const canonical = getOrCreateCanonical();
  const previousCanonical = canonical.getAttribute('href');
  const jsonLd = options.jsonLd ? document.createElement('script') : null;

  document.title = options.title;
  meta.setAttribute('content', options.description || '');
  canonical.setAttribute(
    'href',
    options.canonicalUrl || absoluteSiteUrl(options.canonicalPath || window.location.pathname),
  );

  if (jsonLd) {
    jsonLd.type = 'application/ld+json';
    jsonLd.dataset.jobioSeo = 'true';
    jsonLd.text = JSON.stringify(options.jsonLd);
    document.head.appendChild(jsonLd);
  }

  return () => {
    document.title = previousTitle || 'JOBIO';
    if (previousDescription === null) {
      meta.removeAttribute('content');
    } else {
      meta.setAttribute('content', previousDescription);
    }
    if (previousCanonical === null) {
      canonical.remove();
    } else {
      canonical.setAttribute('href', previousCanonical);
    }
    jsonLd?.remove();
  };
}
