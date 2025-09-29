import Link from 'next/link';
import { MapPin, Phone, Mail, MessageCircle, Instagram, Twitter } from 'lucide-react';
import { NAVIGATION_ITEMS, CONTACT_INFO, COMPANY_INFO, SOCIAL_LINKS } from '@/lib/utils/constants';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center mr-2">
                <span className="text-gray-900 font-bold">{COMPANY_INFO.name.charAt(0)}</span>
              </div>
              <span className="font-bold text-xl">{COMPANY_INFO.name}</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Solusi terpercaya untuk mahasiswa yang butuh bantuan menyelesaikan tugas kuliah dan skripsi. 
              Kami hadir untuk meringankan beban akademik kamu dengan layanan profesional dan berkualitas.
            </p>
            <div className="flex space-x-4">
              <a href={SOCIAL_LINKS.instagram} className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href={SOCIAL_LINKS.twitter} className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Navigasi</h3>
            <ul className="space-y-2">
              {NAVIGATION_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-gray-300 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Kontak</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <a href={`tel:${CONTACT_INFO.phone}`} className="text-gray-300 hover:text-white transition-colors">
                  {CONTACT_INFO.phone.replace('+62', '0')}
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <a href={`mailto:${CONTACT_INFO.email}`} className="text-gray-300 hover:text-white transition-colors">
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                <span className="text-gray-300">
                  {CONTACT_INFO.location}<br />
                  Layanan 24/7
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 {COMPANY_INFO.name}. Semua hak dilindungi undang-undang.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Kebijakan Privasi
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-s transition-colors">
                Syarat & Ketentuan
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}