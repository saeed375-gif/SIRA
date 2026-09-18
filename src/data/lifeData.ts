import { LifeStory, Route, Challenge, DailyLifeCategory, SourceCitation } from '../types';
import { JERUSALEM_PLACES } from './jerusalemData';

export const LIFE_LABELS: Record<DailyLifeCategory, string> = {
  food: 'الطعام', craft: 'الحرف', market: 'الأسواق', culture: 'الثقافة',
  tradition: 'العادات', people: 'الناس', sound: 'الأصوات', 'daily-life': 'الحياة اليومية',
};
const demoSource: SourceCitation = {
  id: 'sira-life-prototype', title: 'نموذج تحريري لتجربة الحياة في القدس', type: 'محتوى تجريبي',
  author: 'نموذج سيرة', yearOrPeriod: 'نسخة تجريبية', isDemo: true,
  quote: 'مشاهد متخيّلة لا توثّق أشخاصًا أو محال أو أحداثًا فعلية. الصور من مكتبة الأماكن الحالية؛ لا تثبت تفاصيل القصص. يلزم مصدر موثوق قبل نشر المحتوى كحقيقة.',
};
const photo = (name: string) => `/images/jerusalem/life/${name}-960.webp`;
const base = { sources: [demoSource], isDemo: true, tags: ['الحياة', 'مشهد تجريبي'] };
export const LIFE_STORIES: LifeStory[] = [
  { ...base, id: 'morning-bread', contentType: 'moment', category: 'food', placeId: 'p-2', relatedPlaces: ['p-1'],
    title: 'رائحة الخبز صباحًا', summary: 'قبل أن تتسارع الخطوات، نتخيّل صباحًا يبدأ بكيس خبز وحديث قصير عند عتبة السوق.',
    body: 'في هذا المشهد المتخيّل، يصبح الخبز ذريعة للتوقف: سؤال عن اليوم، وفسحة للحديث، ثم خطوات تكمل الطريق. أين تبدأ حكاية صباحك أنت؟',
    image: photo('khan-al-zait-passage'), imageAlt: 'ممر سوق خان الزيت، صورة للمكان وليست لمخبز محدد', context: 'مشهد صباحي متخيّل عند السوق' },
  { ...base, id: 'market-call', contentType: 'moment', category: 'market', placeId: 'p-2',
    title: 'نداء من السوق', summary: 'نتخيّل نداءً يقطع ضجيج الخطوات، فيلتفت عابر وتبدأ حكاية صغيرة بين شخصين.',
    body: 'تخيّل أنك تسير ببطء. ما الذي يلفت انتباهك أولًا: كلمة، لون، أم حركة يد؟ هذا تمرين إنصات للمكان، وليس اقتباسًا من بائع حقيقي.',
    image: photo('khan-al-zait-spices'), imageAlt: 'معروضات في سوق خان الزيت' },
  { ...base, id: 'coffee-pause', contentType: 'moment', category: 'tradition', placeId: 'p-1',
    title: 'فسحة لفنجان قهوة', summary: 'في مشهد متخيّل قرب الباب، تتباطأ الرحلة قليلًا لحديث لا يحتاج إلى موعد.',
    body: 'نضع فنجانًا متخيّلًا في قلب المشهد، ونترك للشخصين مساحة للصمت والكلام. لا ننسب هذه الجلسة إلى مقهى أو شخص محدد.',
    image: photo('damascus-gate-plaza'), imageAlt: 'ساحة باب العمود ومدرجاته' },
  { ...base, id: 'market-table', contentType: 'food', category: 'food', placeId: 'p-2',
    title: 'من السوق إلى المائدة', summary: 'قصة طعام تبدأ بالسؤال عن مناسبة تجمع الناس، وتعود إلى المكان الذي التقوا فيه.',
    body: 'نتخيّل شخصًا يختار ما يحمله إلى مائدة مشتركة. يصبح الحديث عن الطعام حديثًا عن الرفقة والوقت والمكان. أية تفصيلة ستحتفظ بها من هذه الرحلة؟',
    image: photo('khan-al-zait-sweets'), imageAlt: 'معروضات حلوى في سوق خان الزيت', context: 'مائدة مشتركة — سيناريو تجريبي' },
  { ...base, id: 'craft-hands', contentType: 'craft', category: 'craft', placeId: 'p-6', relatedPlaces: ['p-2'],
    title: 'حرفة بين أزقة البلدة القديمة', summary: 'يدان تتعلّمان الصبر. مشهد متخيّل عن انتقال المهارة من شخص إلى آخر.',
    body: 'نتخيّل ورشة صغيرة قرب الطريق: أداة توضع جانبًا، ومحاولة تتكرر، وسؤال يفتح باب التعلم. هذه مساحة لقصة حرفي مستقبلية بعد توثيقها، وليست نسبةً لحرفة أو ورشة فعلية في الموقع.',
    image: photo('herods-gate-detail'), imageAlt: 'تفصيل معماري في باب الساهرة، صورة سياقية وليست لورشة', context: 'تعلّم المهارة — ورشة متخيّلة' },
  { ...base, id: 'market-person', contentType: 'person', category: 'people', placeId: 'p-2',
    title: 'من يعرف خطوات العابرين؟', summary: 'شخصية متخيّلة تسألنا كيف يصنع اللقاء اليومي علاقةً بالمكان.',
    body: 'في هذا السيناريو، يقف صاحب دكان متخيّل عند العتبة. يعرف أن بعض الناس يمرّون مسرعين، وبعضهم يتوقف للسلام. لا يمثل النص مقابلة أو شهادة فعلية.',
    person: { name: 'صاحب دكان — شخصية متخيّلة', relationship: 'لقاءات يومية في السوق' },
    image: photo('khan-al-zait-passage'), imageAlt: 'ممر السوق، صورة للمكان دون إسناد القصة إلى الأشخاص الظاهرين' },
  { ...base, id: 'market-sound', contentType: 'audio', category: 'sound', placeId: 'p-2',
    title: 'استمع إلى إيقاع السوق', summary: 'مساحة للإنصات: عيّنة صوتية مصنوعة لاختبار التجربة، وليست تسجيلًا من القدس.',
    body: 'إيقاعات وخشخشة خفيفة صُنعت رقميًا لتجربة المشغّل فقط. عند توفّر تسجيل ميداني موثّق، يمكن إرفاقه هنا مع مصدره ووصفه النصي.',
    image: photo('khan-al-zait-spices'), imageAlt: 'تفاصيل المعروضات في سوق خان الزيت',
    audioUrl: '/audio/life-demo.wav', audioDurationSeconds: 12,
    audioTranscript: 'عيّنة مصنوعة: نقرات إيقاعية وخشخشة خفيفة. لا تحتوي كلامًا أو أصواتًا ميدانية حقيقية.' },
  { ...base, id: 'morning-pause', contentType: 'story', category: 'culture', placeId: 'p-3',
    title: 'فسحة هدوء في الصباح', summary: 'بعد حركة السوق، نتخيّل وقفة هادئة نلاحظ فيها تفصيلًا من المكان.',
    body: 'تأمل الضوء على الحجر واترك مساحة لحكايات الآخرين. هذا مشهد تأملي متخيّل، لا وصف لمناسبة أو ممارسة دينية موثّقة.',
    image: photo('holy-sepulchre'), imageAlt: 'واجهة كنيسة القيامة، صورة سياقية للمكان' },
  { ...base, id: 'evening-alley', contentType: 'moment', category: 'daily-life', placeId: 'p-3',
    title: 'خطوات عند المساء', summary: 'تخيّل أن الرحلة تترك لك لحظة هدوء، تلاحظ فيها الضوء على الحجر وصدى الخطوات.',
    body: 'مشهد تأملي متخيّل في محيط المكان. كيف يغيّر بطء المشي ما نراه؟ التقط في ذاكرتك تفصيلًا واحدًا قبل أن تكمل.',
    image: photo('holy-sepulchre'), imageAlt: 'واجهة كنيسة القيامة وساحتها، صورة سياقية للمكان' },
];
export const storiesForPlace = (id: string) => LIFE_STORIES.filter(s => s.placeId === id || s.relatedPlaces?.includes(id));
export const lifeMapLink = (placeId: string) => `/explore?category=life&place=${JERUSALEM_PLACES.find(p => p.id === placeId)?.slug || ''}`;
export const LIFE_CHALLENGE: Challenge = {
  id: 'life-place-link', type: 'choice', question: 'في هذه الرحلة التجريبية، أين وضعنا حكاية «من السوق إلى المائدة»؟',
  options: [{ id: 'market', text: 'سوق خان الزيت' }, { id: 'gate', text: 'باب الساهرة' }, { id: 'wall', text: 'ممشى السور' }],
  correctOptionId: 'market', explanation: 'ربطنا حكاية الطعام بسوق خان الزيت كي نكتشف الطعام من خلال المكان والناس. هذا ربط تحريري تجريبي، وليس معلومة تاريخية.', rewardPoints: 15,
};
const specs = [
  { slug: 'tastes-of-jerusalem', title: 'مذاقات القدس', theme: 'tastes' as const, subtitle: 'رحلة ثقافية من اللقاء إلى المائدة', ids: ['coffee-pause', 'market-table', 'craft-hands'] },
  { slug: 'morning-in-jerusalem', title: 'صباح في القدس', theme: 'morning' as const, subtitle: 'الخبز، السوق، الأزقة… ثم فسحة هدوء', ids: ['morning-bread', 'market-call', 'craft-hands', 'morning-pause'] },
  { slug: 'voices-and-crafts', title: 'حِرف وأصوات المدينة', theme: 'crafts' as const, subtitle: 'رحلة في تفاصيل المهارة والإنصات', ids: ['craft-hands', 'market-sound', 'coffee-pause'] },
];
export const LIFE_ROUTES: Route[] = specs.map((spec, index) => {
  const stops = spec.ids.map((id, i) => {
    const story = LIFE_STORIES.find(s => s.id === id)!;
    const place = JERUSALEM_PLACES.find(p => p.id === story.placeId)!;
    return { stepNumber: i + 1, placeId: place.id, placeSlug: place.slug, title: story.title, subtitle: place.name,
      ...place.location, highlightText: story.summary, audioDuration: story.audioUrl ? '00:12' : '—', storyId: id,
      challenge: { ...LIFE_CHALLENGE, id: `${spec.slug}-${i}`, question: `بأي مكان ارتبطت «${story.title}» في هذه المحطة؟`,
        options: JERUSALEM_PLACES.filter(p => ['p-1', 'p-2', 'p-3', 'p-6'].includes(p.id)).map(p => ({ id: p.id, text: p.name })),
        correctOptionId: place.id, explanation: `المحطة مرتبطة بـ${place.name}. القصص والروابط في هذا المسار تجريبية، وليست توثيقًا ميدانيًا.` } };
  });
  return { id: `life-route-${index}`, ...spec, englishTitle: '', category: 'life', isDemo: true,
    durationMinutes: 30 + index * 10, distanceKm: Number((0.7 + index * 0.2).toFixed(1)), difficulty: 'سهل',
    description: `${spec.subtitle}. مسار تجريبي بمشاهد متخيّلة؛ الأوقات والمسافات تقديرية وخط الربط إرشادي، لا يمثل تعليمات ملاحة ميدانية.`,
    coverImage: LIFE_STORIES.find(s => s.id === spec.ids[0])!.image, stops,
    polyline: stops.map(s => ({ lat: s.lat, lng: s.lng })), tags: ['الحياة', 'مسار تجريبي'] };
});
