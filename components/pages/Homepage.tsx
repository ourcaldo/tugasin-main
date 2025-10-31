"use client";

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CheckCircle, Clock, Shield, Users, Star, ArrowRight, MessageCircle, FileText, GraduationCap, Lightbulb, User, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { BlogPost } from '@/lib/utils/types';
import FAQ from '../shared/FAQ';
import SupplementalContent from '../shared/SupplementalContent';
import { FAQS } from '@/data/contact';
import { HOMEPAGE_SUPPLEMENTAL_CONTENT } from '@/data/supplemental';

// Dynamic imports for below-the-fold sections
const TestimonialsSection = dynamic(() => import('../sections/TestimonialsSection'), {
  loading: () => (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="h-8 bg-gray-200 rounded mb-4 w-96 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 w-2/3 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="h-16 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
});

const BlogPreviewSection = dynamic(() => import('../sections/BlogPreviewSection'), {
  loading: () => (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="h-8 bg-gray-200 rounded mb-4 w-80 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 w-2/3 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow animate-pulse overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-3 w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
});

const ServicesSection = dynamic(() => import('../sections/ServicesSection'), {
  loading: () => (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="h-8 bg-gray-200 rounded mb-4 w-64 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 w-2/3 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
});

interface HomepageProps {
  recentPosts: BlogPost[];
}

export default function Homepage({ recentPosts = [] }: HomepageProps) {
  const isLoadingPosts = false;

  const features = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Pengerjaan Cepat",
      description: "Tugas selesai tepat waktu, bahkan untuk deadline mendadak"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "100% Original",
      description: "Bebas plagiat dengan jaminan keaslian karya"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Tim Profesional",
      description: "Dikerjakan oleh ahli sesuai bidang studi kamu"
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Garansi Revisi",
      description: "Revisi gratis sampai kamu puas dengan hasilnya"
    }
  ];

  const services = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Joki Tugas Kuliah",
      description: "Essay, laporan praktikum, makalah, dan tugas harian lainnya",
      price: "Mulai 50k",
      popular: false
    },
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: "Joki Skripsi",
      description: "Skripsi lengkap dari proposal hingga sidang dengan bimbingan",
      price: "Mulai 2jt",
      popular: true
    },
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: "Konsultasi Akademik",
      description: "Bimbingan penelitian, metodologi, dan konsep akademik",
      price: "Mulai 100k",
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      university: "Universitas Indonesia",
      text: "Tugasin benar-benar menyelamatkan semester saya! Tugas yang dikerjakan selalu berkualitas dan tepat waktu.",
      rating: 5
    },
    {
      name: "Ahmad R.",
      university: "ITB",
      text: "Skripsi saya selesai dengan nilai A berkat bantuan tim Tugasin. Proses revisinya juga sangat kooperatif.",
      rating: 5
    },
    {
      name: "Maya L.",
      university: "Universitas Gadjah Mada",
      text: "Harga terjangkau untuk mahasiswa, kualitas kerja profesional. Sangat recommended!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-[50px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-4">
                Solusi Akademik Terpercaya
              </Badge>
              <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
                Tugas numpuk bikin stress? <span className="text-primary">Serahin aja ke Tugasin!</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Dari tugas harian sampai skripsi, kami bantu kamu selesaikan dengan mudah. 
                Fokus ke hal yang lebih penting, biar kami yang handle tugasnya!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild>
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Konsultasi Gratis
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/layanan">
                    Lihat Layanan
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                * Konsultasi gratis untuk menentukan kebutuhan kamu
              </p>
            </div>
            <div className="relative aspect-[4/3]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1652004736787-a0d5e345817f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBsYXB0b3AlMjBzdHJlc3N8ZW58MXx8fHwxNzU4ODY1ODM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Mahasiswa stress mengerjakan tugas"
                className="rounded-lg shadow-2xl object-cover"
                fill
                priority
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">1000+ Tugas Selesai</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Kenapa Pilih Tugasin?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Kami paham banget struggle kamu sebagai mahasiswa. Makanya kami hadir dengan solusi yang beneran membantu.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="text-primary">{feature.icon}</div>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section - Dynamically Imported */}
      <ServicesSection services={services} />

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Gimana Caranya?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Prosesnya simple banget! Cuma 4 langkah dan tugas kamu kelar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Kirim Detail Tugas", description: "WhatsApp kami dengan detail tugas yang mau dikerjakan" },
              { step: "2", title: "Dapat Harga & Timeline", description: "Kami kasih quote harga dan estimasi waktu pengerjaan" },
              { step: "3", title: "Bayar & Tunggu", description: "Transfer DP, tim kami langsung mulai mengerjakan" },
              { step: "4", title: "Terima Hasil", description: "Hasil siap! Revisi gratis sampai kamu puas" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Dynamically Imported */}
      <TestimonialsSection testimonials={testimonials} />

      {/* FAQ Section */}
      <FAQ faqs={FAQS} />

      {/* Blog Section - Dynamically Imported */}
      <BlogPreviewSection recentPosts={recentPosts} isLoadingPosts={isLoadingPosts} />

      {/* Supplemental Content Section */}
      <SupplementalContent htmlContent={HOMEPAGE_SUPPLEMENTAL_CONTENT} />

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Siap Bebas dari Stress Tugas?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Jangan biarkan tugas mengganggu kehidupan sosial dan mental health kamu. 
            Serahkan ke kami dan nikmati masa kuliah yang lebih menyenangkan!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat WhatsApp Sekarang
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/layanan">
                Lihat Semua Layanan
              </Link>
            </Button>
          </div>
          <p className="text-sm mt-4 opacity-75">
            Konsultasi gratis • Respons cepat • Layanan 24/7
          </p>
        </div>
      </section>
    </div>
  );
}