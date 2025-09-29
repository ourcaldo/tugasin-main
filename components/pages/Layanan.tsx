import dynamic from 'next/dynamic';
import { CheckCircle, Clock, FileText, GraduationCap, BookOpen, Calculator, Beaker, Code, MessageCircle, Shield, Users, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SEO from '@/components/layout/SEO';

// Dynamic imports for service components (below the fold)
const ServiceCard = dynamic(() => import('../services/ServiceCard'), {
  loading: () => (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="h-12 w-12 bg-gray-200 rounded mb-4"></div>
      <div className="h-6 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-4"></div>
      <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
      <div className="space-y-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  )
});

const FeatureCard = dynamic(() => import('../services/FeatureCard'), {
  loading: () => (
    <div className="text-center p-6 bg-white rounded-lg shadow animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-4"></div>
      <div className="h-6 bg-gray-200 rounded mb-2 w-2/3 mx-auto"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
  )
});

const TestimonialCard = dynamic(() => import('../services/TestimonialCard'), {
  loading: () => (
    <div className="p-6 bg-white rounded-lg shadow animate-pulse">
      <div className="flex mb-4 space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-5 w-5 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  )
});

export default function Layanan() {
  const mainServices = [
    {
      icon: <FileText className="h-12 w-12" />,
      title: "Joki Tugas Kuliah",
      description: "Tugas harian, essay, makalah, laporan praktikum, dan presentasi",
      price: "Mulai 50k",
      features: [
        "Essay dan makalah (1000-5000 kata)",
        "Laporan praktikum lengkap",
        "Analisis case study",
        "Presentasi PowerPoint",
        "Review literatur",
        "Tugas perhitungan"
      ],
      popular: false,
      timeframe: "1-3 hari"
    },
    {
      icon: <GraduationCap className="h-12 w-12" />,
      title: "Joki Skripsi/Thesis",
      description: "Skripsi S1, thesis S2, dan disertasi S3 dengan bimbingan lengkap",
      price: "Mulai 2jt",
      features: [
        "Proposal penelitian",
        "BAB 1-5 lengkap",
        "Metodologi penelitian",
        "Analisis data SPSS/R",
        "Bimbingan revisi dosen",
        "Persiapan sidang"
      ],
      popular: true,
      timeframe: "2-4 minggu"
    },
    {
      icon: <BookOpen className="h-12 w-12" />,
      title: "Konsultasi Akademik",
      description: "Bimbingan penelitian, metodologi, dan konsep akademik",
      price: "Mulai 100k",
      features: [
        "Konsultasi metodologi",
        "Review draft tulisan",
        "Brainstorming topik",
        "Penjelasan konsep",
        "Strategi penelitian",
        "Tips menulis akademik"
      ],
      popular: false,
      timeframe: "Fleksibel"
    }
  ];

  const subjectServices = [
    {
      category: "Sosial & Humaniora",
      subjects: [
        { name: "Manajemen", icon: "📊" },
        { name: "Akuntansi", icon: "💰" },
        { name: "Ekonomi", icon: "📈" },
        { name: "Hukum", icon: "⚖️" },
        { name: "Psikologi", icon: "🧠" },
        { name: "Komunikasi", icon: "📢" },
        { name: "Sosiologi", icon: "👥" },
        { name: "Politik", icon: "🗳️" }
      ]
    },
    {
      category: "Sains & Teknologi",
      subjects: [
        { name: "Informatika", icon: "💻" },
        { name: "Sistem Informasi", icon: "🔗" },
        { name: "Teknik", icon: "⚙️" },
        { name: "Matematika", icon: "🔢" },
        { name: "Fisika", icon: "⚛️" },
        { name: "Kimia", icon: "🧪" },
        { name: "Biologi", icon: "🧬" },
        { name: "Statistika", icon: "📊" }
      ]
    }
  ];

  const packages = [
    {
      name: "Paket Express",
      description: "Untuk deadline mepet (24-48 jam)",
      multiplier: "2x harga normal",
      features: [
        "Prioritas tertinggi",
        "Tim dedicated",
        "Progress report real-time",
        "Support 24/7"
      ]
    },
    {
      name: "Paket Standard",
      description: "Waktu pengerjaan normal (3-7 hari)",
      multiplier: "Harga normal",
      features: [
        "Kualitas terjamin",
        "Revisi 2x gratis",
        "Progress update harian",
        "Support jam kerja"
      ]
    },
    {
      name: "Paket Economy",
      description: "Hemat untuk deadline longgar (>7 hari)",
      multiplier: "Diskon 20%",
      features: [
        "Harga terjangkau",
        "Revisi 1x gratis",
        "Progress update berkala",
        "Support email"
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Layanan - Tugasin.me"
        description="Layanan lengkap joki tugas kuliah, skripsi, dan konsultasi akademik. Semua jurusan, harga terjangkau, hasil berkualitas. Konsultasi gratis sekarang!"
        keywords="joki tugas kuliah, jasa skripsi, bantuan tugas, joki thesis, layanan akademik, tugas manajemen, tugas teknik"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-4">
            Layanan Lengkap
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Layanan Joki Tugas & Skripsi
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dari tugas harian sampai skripsi, semua jurusan kami handle. 
            Dikerjakan oleh ahli berpengalaman dengan hasil berkualitas tinggi.
          </p>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Layanan Utama
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Pilih layanan yang sesuai dengan kebutuhan akademik kamu
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {mainServices.map((service, index) => (
              <Card key={index} className={`relative p-6 hover:shadow-lg transition-shadow ${service.popular ? 'border-primary border-2' : ''}`}>
                {service.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Paling Populer
                  </Badge>
                )}
                <CardHeader className="p-0 mb-6">
                  <div className="text-primary mb-4">{service.icon}</div>
                  <CardTitle className="text-2xl">{service.title}</CardTitle>
                  <p className="text-gray-600">{service.description}</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-primary mb-2">{service.price}</div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {service.timeframe}
                    </div>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button className="w-full" variant={service.popular ? "default" : "outline"} asChild>
                    <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Konsultasi Sekarang
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subject Services */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Bidang Studi yang Kami Layani
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tim kami terdiri dari experts di berbagai bidang untuk memastikan kualitas terbaik
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {subjectServices.map((category, index) => (
              <Card key={index} className="p-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-xl">{category.category}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-2 gap-4">
                    {category.subjects.map((subject, idx) => (
                      <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-2xl mr-3">{subject.icon}</span>
                        <span className="font-medium">{subject.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Paket Harga Berdasarkan Deadline
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Semakin longgar deadline, semakin hemat harganya!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <p className="text-gray-600">{pkg.description}</p>
                  <div className="text-2xl font-bold text-primary mt-2">{pkg.multiplier}</div>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Kenapa Tugasin Berbeda?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: "100% Anti Plagiat",
                description: "Semua karya original dengan pengecekan plagiarisme menggunakan tools premium"
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Tim Expert",
                description: "Dikerjakan oleh lulusan S2/S3 sesuai bidang studi dengan pengalaman bertahun-tahun"
              },
              {
                icon: <Star className="h-8 w-8" />,
                title: "Garansi Kepuasan",
                description: "Revisi unlimited sampai kamu puas, atau 100% uang kembali"
              }
            ].map((item, index) => (
              <Card key={index} className="p-6 text-center">
                <CardContent className="p-0">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-primary">{item.icon}</div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Siap Mulai Project Kamu?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Konsultasikan kebutuhan kamu dengan tim kami. Gratis dan tanpa komitmen!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat WhatsApp
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
              <a href="tel:+6281234567890">
                Telepon Langsung
              </a>
            </Button>
          </div>
          <p className="text-sm mt-4 opacity-75">
            Respons dalam 5 menit • Estimasi harga langsung • Konsultasi gratis
          </p>
        </div>
      </section>
    </div>
  );
}