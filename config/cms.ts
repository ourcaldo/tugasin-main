export const cmsConfig = {
  endpoint: process.env.NEXT_PUBLIC_CMS_ENDPOINT || "https://cms.tugasin.me/graphql",
  username: process.env.CMS_USERNAME || "",
  password: process.env.CMS_PASSWORD || "",
  timeout: parseInt(process.env.CMS_TIMEOUT || "10000"),
  enabled: process.env.NEXT_PUBLIC_ENABLE_CMS === "true",
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  useFallbackData: process.env.NEXT_PUBLIC_USE_FALLBACK_DATA === "true",
  revalidateInterval: {
    blog: 300, // 5 minutes for blog posts
    services: 3600, // 1 hour for services
    static: 86400, // 24 hours for static content
  },
  retryAttempts: 3,
  retryDelay: 1000,
}