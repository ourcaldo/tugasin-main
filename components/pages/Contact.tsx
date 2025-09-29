"use client";

import { MapPin, Phone, Mail, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import SEO from '../layout/SEO';
import SecureContactForm from '../forms/SecureContactForm';
import { CONTACT_INFO } from '@/lib/utils/constants';

export default function Contact() {

  const contactInfo = [
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
      details: CONTACT_INFO.address,
      action: "#",
      actionLabel: "Lihat Maps"
    }
  ];

  const workingHours = [
    { day: "Senin - Jumat", hours: "08:00 - 22:00 WIB" },
    { day: "Sabtu - Minggu", hours: "09:00 - 21:00 WIB" },
    { day: "Hari Libur", hours: "10:00 - 20:00 WIB" }
  ];


  const faqs = [
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

  return (
    <div className="min-h-screen">
      <SEO 
        title="Kontak - Tugasin.me"
        description="Hubungi tim Tugasin untuk konsultasi gratis tentang jasa joki tugas dan skripsi. WhatsApp 24/7, respons cepat, solusi akademik terpercaya."
        keywords="kontak tugasin, konsultasi gratis, jasa joki tugas, whatsapp tugasin, bantuan akademik"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-4">
            Hubungi Kami
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Konsultasi Gratis Sekarang
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tim kami siap membantu 24/7. Konsultasikan kebutuhan akademik kamu tanpa biaya. 
            Respons dalam 5 menit!
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Secure Contact Form */}
          <div className="lg:col-span-2">
            <SecureContactForm />
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Methods */}
            <Card className="p-6 mb-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle>Kontak Langsung</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <div className="text-primary">{info.icon}</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{info.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{info.details}</p>
                        <Button variant="outline" size="sm" asChild>
                          <a href={info.action} target={info.action.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
                            {info.actionLabel}
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card className="p-6 mb-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Jam Operasional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3">
                  {workingHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <span className="font-medium">{schedule.day}</span>
                      <span className="text-sm text-gray-600">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-green-700">Respons WhatsApp 24/7</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick WhatsApp */}
            <Card className="p-6 bg-primary text-white">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-white">Butuh Bantuan Cepat?</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="mb-4 opacity-90">
                  Chat langsung dengan tim kami di WhatsApp untuk respons instan!
                </p>
                <Button variant="secondary" size="lg" className="w-full" asChild>
                  <a href={CONTACT_INFO.whatsapp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Chat WhatsApp
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pertanyaan yang Sering Ditanyakan
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Beberapa pertanyaan umum yang mungkin ada di pikiran kamu
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <CardContent className="p-0">
                  <h3 className="font-semibold mb-3">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}