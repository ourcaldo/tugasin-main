export default function imageLoader({ src, width, quality }) {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
  
  if (cdnUrl && src.startsWith('/')) {
    return `${cdnUrl}${src}?w=${width}&q=${quality || 75}`;
  }
  
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  return `${src}?w=${width}&q=${quality || 75}`;
}
