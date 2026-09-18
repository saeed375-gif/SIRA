import React from 'react';
import { ShieldCheck, Compass, Map, Heart, Sparkles, Award, ScrollText, CheckCircle2 } from 'lucide-react';

interface AboutViewProps {
  onNavigate: (path: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0D081F] text-[#FAF8F5] pb-24 md:pb-16 text-right">
      {/* Hero Header */}
      <div className="bg-[#140E2E] border-b border-[#24174B] py-16 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1140] border border-[#D4AF37]/40 text-xs font-bold text-[#E5C158]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>فلسفة المشروع ورؤيته</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#FAF8F5] font-serif-ar leading-tight">
            عن منصة «سيرة»
          </h1>

          <p className="text-base sm:text-lg text-[#D8CDE8] leading-relaxed font-serif-ar">
            «سيرة» ليست موقعاً لقراءة معلومات مجردة عن القدس؛ «سيرة» تجربة رقمية تفاعلية حية صُممت لتعيش من خلالها روح المدينة وحكايتها المتجذرة في كل حجر.
          </p>
        </div>
      </div>

      {/* Content Pillars */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        
        {/* The Core Idea */}
        <section className="rounded-3xl bg-[#160E36] border border-[#2B1E55] p-6 md:p-8 space-y-4 shadow-2xl">
          <h2 className="text-2xl font-bold text-[#FAF8F5] font-serif-ar">
            لماذا بنينا «سيرة»؟
          </h2>
          <p className="text-sm md:text-base text-[#DDD5E8] leading-relaxed">
            كثيراً ما تُعرض القدس في المنصات الرقمية كمجرد مقالات ويكيبيديا جامدة أو صور سياحية منعزلة عن سياقها الإنساني. في «سيرة»، نؤمن بأن القدس كائن حي يتنفس عبر مساراته، وبواباته، وحراسه، وأصوات مؤذنيه، وأجراس كنائسه، ورائحة توابله في سوق العطارين.
          </p>
          <p className="text-sm md:text-base text-[#DDD5E8] leading-relaxed">
            انطلقنا من بوستر الهوية البصرية الذي يمزج ليل القدس البنفسجي العميق بنور قبابها الذهبي ودفء حجارتها، وحولناه إلى منتج رقمي حقيقي قابل للتفاعل في يد كل إنسان في العالم.
          </p>
        </section>

        {/* 4 Pillars of Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C158] mb-3">
              <Map className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#FAF8F5]">الجغرافيا الحقيقية</h3>
            <p className="text-xs text-[#C4B7D8] leading-relaxed">
              تعتمد المنصة خرائط واقعية تفاعلية مربوطة بالإحداثيات الدقيقة وشبكة الأزقة، متجاوزة الخرائط الوهمية أو المخططات الصماء.
            </p>
          </div>

          <div className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C158] mb-3">
              <ScrollText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#FAF8F5]">التوثيق الأكاديمي الصارم</h3>
            <p className="text-xs text-[#C4B7D8] leading-relaxed">
              كل حكاية، وتاريخ، وحقبة معمارية مدعمة بمصادر تاريخية ومخطوطات وسجلات محكمة القدس الشرعية المعتمدة.
            </p>
          </div>

          <div className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C158] mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#FAF8F5]">المسارات المتصلة</h3>
            <p className="text-xs text-[#C4B7D8] leading-relaxed">
              نظام "المكان يقودك إلى المكان التالي" الذي يحول التصفح من صفحات متناثرة إلى رحلة متسلسلة تحاكي المشي الفعلي في المدينة.
            </p>
          </div>

          <div className="rounded-2xl bg-[#160E36] border border-[#2B1E55] p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#E5C158] mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#FAF8F5]">تثبيت المعرفة بالتفاعل</h3>
            <p className="text-xs text-[#C4B7D8] leading-relaxed">
              تحديات فورية ومقارنات بصرية بين صور الأرشيف وصور اليوم ومشغل صوتي مع موجات متزامنة تخاطب العاطفة والفكر.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="rounded-3xl bg-gradient-to-r from-[#1E1145] to-[#2B195D] border border-[#D4AF37]/40 p-8 text-center space-y-4 shadow-2xl">
          <h3 className="text-2xl font-bold text-[#FAF8F5] font-serif-ar">
            هل أنت جاهز لبدء رحلتك في القدس؟
          </h3>
          <p className="text-xs sm:text-sm text-[#DDD5E8] max-w-lg mx-auto">
            انطلق الآن في المسار المميز عبر أزقة البلدة القديمة من باب العمود حتى باحات المسجد الأقصى المبارك.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/routes/journey-in-heart-of-jerusalem')}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#110B29] font-bold text-sm shadow-xl shadow-[#D4AF37]/30 transition-all active:scale-95"
            >
              ابدأ مسار قلب القدس الآن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
