import { MapPin, Phone, Mail, ArrowUpRight, Instagram, Facebook, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface FooterProps {
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessSocials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export const Footer = ({
  businessAddress = "{{business_address}}",
  businessPhone = "{{business_phone}}",
  businessEmail = "contacto@negocio.com",
  businessSocials = {}
}: FooterProps) => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-white py-24 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-12 gap-16 pb-16 border-b border-white/5">
          <div className="md:col-span-5 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                Tu Próximo <br />
                <span className="text-primary">Nivel Comienza Aquí</span>
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                No solo reservamos lugares, diseñamos experiencias. Únete a la comunidad que está transformando su estilo de vida.
              </p>
            </div>

            <div className="flex gap-4">
              {[{ icon: Instagram, url: businessSocials.instagram }, { icon: Facebook, url: businessSocials.facebook }, { icon: Twitter, url: businessSocials.twitter }].map((social, i) => social.url && (
                <motion.a
                  key={i}
                  href={social.url}
                  whileHover={{ y: -5, scale: 1.1 }}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary transition-colors group"
                >
                  <social.icon className="h-5 w-5 text-slate-400 group-hover:text-white" />
                </motion.a>
              ))}
            </div>
          </div>

          <div className="md:col-span-7 grid sm:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{t('booking.footer.contact_title')}</h3>
              <div className="space-y-4">
                <div className="group cursor-pointer">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Ubicación</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold group-hover:text-primary transition-colors">{businessAddress}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="group cursor-pointer">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Teléfono</p>
                  <a href={`tel:${businessPhone}`} className="text-sm font-bold group-hover:text-primary transition-colors">
                    {businessPhone}
                  </a>
                </div>
                <div className="group cursor-pointer">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Email</p>
                  <a href={`mailto:${businessEmail}`} className="text-sm font-bold group-hover:text-primary transition-colors">
                    {businessEmail}
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{t('booking.footer.hours_title')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('booking.footer.days.mon_fri')}</span>
                  <span className="text-sm font-black italic">07:00 — 21:00</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('booking.footer.days.sat')}</span>
                  <span className="text-sm font-black italic">08:00 — 14:00</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('booking.footer.days.sun')}</span>
                  <span className="text-sm font-black italic opacity-30">{t('common.closed')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          <p>© {new Date().getFullYear()} {businessAddress !== "{{business_address}}" ? businessAddress.split(',')[0] : "Business"}. {t('booking.footer.copyright')}</p>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="text-white italic font-black tracking-tighter text-sm">BookPro</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
