export default function imageLoader({ src, width, quality }) {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
  if (cdnUrl) {
    return `${cdnUrl}${src}?w=${width}&q=${quality || 75}`;
  }
  return src;
}
