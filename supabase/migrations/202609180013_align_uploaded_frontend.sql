-- Align the conservative seed metadata with the exact frontend uploaded on 2026-09-18.
-- This changes database content only; it does not alter the React interface or Google Map implementation.
update public.places set
  short_description_ar='أقدس بقاع العالم المسيحي، تحفة معمارية بيزنطية وصليبية تحتضن القبر المقدس ومفتاح العهدة العمرية.',
  district_ar='البلدة القديمة – حارة النصارى',
  main_image_url='/images/jerusalem/holy-sepulchre.jpg'
where slug='holy-sepulchre';

update public.places set
  short_description_ar='أولى القبلتين وثالث الحرمين ومسرى الرسول، واحة مباركة تبلغ مساحتها 144 دونماً من الرياض والمصليات والقباب.',
  district_ar='البلدة القديمة – الحرم القدسي الشريف',
  main_image_url='/images/jerusalem/dome-of-the-rock.jpg'
where slug='al-aqsa-mosque';

update public.places set
  short_description_ar='طوق حجري منيع بطول 4 كيلومترات، يضم 34 برجاً عسكرياً و7 أبواب مفتوحة تروي حكايات الدفاع عن المدينة.',
  district_ar='محيط البلدة القديمة كاملاً',
  main_image_url='/images/jerusalem/jerusalem-walls-exterior.jpg'
where slug='jerusalem-walls';

update public.places set
  short_description_ar='باب الزهور العتيق، مدخل حارة باب حطة وحي المصرارة العريق، محاط بنقوش الورد الحجري.',
  district_ar='البلدة القديمة – الجدار الشمالي الشرقي',
  main_image_url='/images/jerusalem/herods-gate.jpg'
where slug='bab-al-sahira';
