/**
 * Secure Contact Form Component
 * Implements comprehensive validation, sanitization, and security measures
 */

"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { validateContactForm, type ContactFormData } from '@/lib/forms/validation';
import { CONTACT_INFO } from '@/lib/utils/constants';
import { useFormSecurity } from '@/lib/security/hooks';

interface SecureContactFormProps {
  onSubmit?: (data: ContactFormData) => void;
  disabled?: boolean;
}

export default function SecureContactForm({ 
  onSubmit, 
  disabled = false 
}: SecureContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  
  // Security features: CSRF protection and rate limiting
  const security = useFormSecurity('contact');
  
  const form = useForm<ContactFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      service: '',
      subject: '',
      message: '',
      deadline: ''
    },
    mode: 'onChange' // Real-time validation
  });

  const services = [
    "Joki Tugas Kuliah",
    "Joki Skripsi/Thesis", 
    "Konsultasi Akademik",
    "Review & Edit",
    "Bimbingan Penelitian",
    "Lainnya"
  ];

  const handleFormSubmit = async (data: ContactFormData) => {
    if (disabled || isSubmitting || !security.canSubmit) return;
    
    setIsSubmitting(true);
    setValidationErrors({});
    
    try {
      // Security validation: CSRF and rate limiting
      const securityResult = security.validateSubmission(security.csrfToken || '');
      
      if (!securityResult.valid) {
        if (securityResult.type === 'rate_limit') {
          toast.error(`Terlalu banyak percobaan. Tunggu ${security.retryAfter} detik.`);
        } else if (securityResult.type === 'csrf') {
          toast.error('Token keamanan tidak valid. Silakan refresh halaman.');
          security.refreshCSRF();
        }
        return;
      }
      
      // Comprehensive validation and sanitization
      const validationResult = validateContactForm(data);
      
      if (!validationResult.isValid) {
        setValidationErrors(validationResult.errors);
        toast.error('Mohon periksa kembali data yang Anda masukkan');
        return;
      }
      
      // Use sanitized data for processing
      const sanitizedData = validationResult.sanitizedData;
      
      // Custom submission handler if provided
      if (onSubmit) {
        await onSubmit(sanitizedData);
        return;
      }
      
      // Default WhatsApp submission (with sanitized data)
      await handleWhatsAppSubmission(sanitizedData);
      
      // Reset form on successful submission
      form.reset();
      toast.success('Pesan telah disiapkan! Klik kirim di WhatsApp untuk melanjutkan.');
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleWhatsAppSubmission = async (data: ContactFormData) => {
    // Create WhatsApp message with sanitized data
    const message = `Halo Tim Tugasin! 

Saya ingin konsultasi tentang:
Nama: ${data.name}
Email: ${data.email || 'Tidak disertakan'}
No. HP: ${data.phone}
Layanan: ${data.service}
Mata Kuliah: ${data.subject}
Deadline: ${data.deadline}

Detail Kebutuhan:
${data.message}

Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `${CONTACT_INFO.whatsapp}?text=${encodedMessage}`;
    
    // Validate URL before opening
    try {
      const url = new URL(whatsappUrl);
      if (url.protocol === 'https:' && url.hostname === 'wa.me') {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('Invalid WhatsApp URL');
      }
    } catch (error) {
      console.error('Invalid WhatsApp URL:', error);
      toast.error('Tidak dapat membuka WhatsApp. Silakan hubungi kami melalui kontak lain.');
    }
  };

  const getFieldErrors = (fieldName: keyof ContactFormData): string[] => {
    return validationErrors[fieldName] || [];
  };

  const hasFieldError = (fieldName: keyof ContactFormData): boolean => {
    return getFieldErrors(fieldName).length > 0;
  };

  return (
    <Card className="p-8">
      <CardHeader className="p-0 mb-8">
        <CardTitle className="text-2xl">Kirim Pesan</CardTitle>
        <p className="text-gray-600">
          Isi form di bawah untuk konsultasi gratis. Tim kami akan merespons dalam 5 menit.
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Security Notice */}
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Data Anda aman dan dienkripsi. Kami tidak akan membagikan informasi pribadi Anda kepada pihak ketiga.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Masukkan nama lengkap"
                        disabled={isSubmitting}
                        aria-invalid={hasFieldError('name')}
                      />
                    </FormControl>
                    <FormMessage />
                    {getFieldErrors('name').map((error, index) => (
                      <p key={index} className="text-sm text-destructive">{error}</p>
                    ))}
                  </FormItem>
                )}
              />

              {/* Phone Field */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. WhatsApp *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="08123456789"
                        disabled={isSubmitting}
                        aria-invalid={hasFieldError('phone')}
                      />
                    </FormControl>
                    <FormMessage />
                    {getFieldErrors('phone').map((error, index) => (
                      <p key={index} className="text-sm text-destructive">{error}</p>
                    ))}
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="email@example.com"
                        disabled={isSubmitting}
                        aria-invalid={hasFieldError('email')}
                      />
                    </FormControl>
                    <FormMessage />
                    {getFieldErrors('email').map((error, index) => (
                      <p key={index} className="text-sm text-destructive">{error}</p>
                    ))}
                  </FormItem>
                )}
              />

              {/* Service Field */}
              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Layanan yang Dibutuhkan *</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger aria-invalid={hasFieldError('service')}>
                          <SelectValue placeholder="Pilih layanan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service, index) => (
                          <SelectItem key={index} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {getFieldErrors('service').map((error, index) => (
                      <p key={index} className="text-sm text-destructive">{error}</p>
                    ))}
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject Field */}
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mata Kuliah / Subjek *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Contoh: Algoritma dan Pemrograman"
                        disabled={isSubmitting}
                        aria-invalid={hasFieldError('subject')}
                      />
                    </FormControl>
                    <FormMessage />
                    {getFieldErrors('subject').map((error, index) => (
                      <p key={index} className="text-sm text-destructive">{error}</p>
                    ))}
                  </FormItem>
                )}
              />

              {/* Deadline Field */}
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Contoh: 3 hari lagi"
                        disabled={isSubmitting}
                        aria-invalid={hasFieldError('deadline')}
                      />
                    </FormControl>
                    <FormMessage />
                    {getFieldErrors('deadline').map((error, index) => (
                      <p key={index} className="text-sm text-destructive">{error}</p>
                    ))}
                  </FormItem>
                )}
              />
            </div>

            {/* Message Field */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Detail Kebutuhan *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Jelaskan secara detail tugas yang dibutuhkan, spesifikasi khusus, dll."
                      className="min-h-32"
                      disabled={isSubmitting}
                      aria-invalid={hasFieldError('message')}
                    />
                  </FormControl>
                  <FormMessage />
                  {getFieldErrors('message').map((error, index) => (
                    <p key={index} className="text-sm text-destructive">{error}</p>
                  ))}
                </FormItem>
              )}
            />

            {/* CSRF Token - Hidden field for security */}
            <input 
              type="hidden" 
              value={security.csrfToken || ''} 
              name="csrf_token" 
              aria-hidden="true"
            />
            
            {/* Rate limiting warning */}
            {!security.canSubmit && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Terlalu banyak percobaan pengiriman. Silakan tunggu {security.retryAfter} detik sebelum mencoba lagi.
                  (Tersisa {security.remaining} percobaan)
                </AlertDescription>
              </Alert>
            )}
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting || disabled || !security.canSubmit || !security.csrfToken}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Kirim via WhatsApp
                </>
              )}
            </Button>

            <p className="text-sm text-gray-500 text-center">
              * Wajib diisi. Data kamu aman dan tidak akan dishare ke pihak ketiga.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}