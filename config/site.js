const siteConfig = {
  name: "Tugasin",
  title: "Tugasin - Solusi Joki Tugas dan Skripsi Murah dan Cepat",
  description: "Tugasin membantu mahasiswa menyelesaikan tugas kuliah dan skripsi dengan mudah. Layanan joki tugas terpercaya, cepat, dan berkualitas tinggi.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://tugasin.com",
  keywords: [
    "joki tugas",
    "jasa skripsi", 
    "bantuan akademik",
    "tugas kuliah",
    "thesis",
    "assignment help",
    "academic writing"
  ],
  authors: [
    {
      name: "Tugasin",
      url: "https://tugasin.com",
    },
  ],
  creator: "Tugasin",
  locale: "id_ID",
  themeColor: "#000000",
  
  // Static asset paths (not environment-dependent)
  assets: {
    defaultImage: "/og-default.jpg",
    favicon: "/favicon.ico",
  },
}

module.exports = { siteConfig }