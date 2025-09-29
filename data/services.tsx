import { FileText, GraduationCap, BookOpen } from 'lucide-react';
import type { Service, ServicePackage, SubjectCategory } from '../lib/utils/types';

export const MAIN_SERVICES: Service[] = [
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

export const SERVICE_PACKAGES: ServicePackage[] = [
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

export const SUBJECT_SERVICES: SubjectCategory[] = [
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

export const AVAILABLE_SERVICES = [
  "Joki Tugas Kuliah",
  "Joki Skripsi/Thesis",
  "Konsultasi Akademik",
  "Review & Edit",
  "Bimbingan Penelitian",
  "Lainnya"
];