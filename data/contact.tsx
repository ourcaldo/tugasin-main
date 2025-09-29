import { Phone, MessageCircle, Mail, MapPin } from 'lucide-react';
import type { ContactInfo, FAQ } from '../lib/utils/types';
import { CONTACT_INFO } from '../lib/utils/constants';

export const CONTACT_METHODS: ContactInfo[] = [
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Telepon / WhatsApp",
    details: CONTACT_INFO.phone,
    action: `tel:${CONTACT_INFO.phone}`,
    actionLabel: "Telepon Sekarang"
  },
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "WhatsApp",
    details: "Chat langsung dengan tim kami",
    action: CONTACT_INFO.whatsapp,
    actionLabel: "Chat WhatsApp"
  },
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Email",
    details: CONTACT_INFO.email,
    action: `mailto:${CONTACT_INFO.email}`,
    actionLabel: "Kirim Email"
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Lokasi",
    details: CONTACT_INFO.location,
    action: "#",
    actionLabel: "Lihat Maps"
  }
];

export const FAQS: FAQ[] = [
  {
    question: "Berapa lama waktu pengerjaan tugas?",
    answer: "Tergantung kompleksitas tugas. Tugas reguler 1-3 hari, skripsi 2-4 minggu. Untuk deadline urgent, tersedia paket express."
  },
  {
    question: "Apakah ada jaminan revisi?",
    answer: "Ya! Kami memberikan garansi revisi gratis hingga kamu puas dengan hasilnya. Untuk skripsi, revisi unlimited."
  },
  {
    question: "Bagaimana sistem pembayaran?",
    answer: "DP 50% di awal, pelunasan setelah tugas selesai. Pembayaran via transfer bank, e-wallet, atau crypto."
  },
  {
    question: "Apakah hasil karya original?",
    answer: "100% original! Semua karya dicek dengan software anti-plagiat premium. Kami jamin bebas plagiarisme."
  }
];