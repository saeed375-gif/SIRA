#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_directory="$project_root/public/video"
output_file="$output_directory/sira-platform-guide-ar.mp4"

mkdir -p "$output_directory"

# Eight captioned scenes, nine seconds each. The video intentionally has no
# audio track so it is usable as a quiet fallback; the companion Arabic script
# can be read as a voice-over when narration is needed.
arguments=(
  -e
  concat name=journey ! queue ! videoconvert ! x264enc bitrate=2200 speed-preset=ultrafast tune=stillimage key-int-max=60 ! h264parse ! mp4mux faststart=true ! filesink location="$output_file"
)

add_scene() {
  local image="$1"
  local title="$2"
  local description="$3"
  local title_alignment="${4:-right}"

  arguments+=(
    filesrc location="$project_root/public/images/jerusalem/$image" ! jpegdec ! imagefreeze num-buffers=270 ! video/x-raw,framerate=30/1 ! videoconvert ! videoscale ! video/x-raw,width=1920,height=1080,pixel-aspect-ratio=1/1
    ! textoverlay text="$title" font-desc="Noto Kufi Arabic Bold 34" color=0xffe5c158 outline-color=0xff110b29 halignment="$title_alignment" valignment=top xpad=105 ypad=105 shaded-background=true shading-value=135
    ! textoverlay text="$description" font-desc="Noto Kufi Arabic 18" color=0xfffaf8f5 outline-color=0xff110b29 halignment="$title_alignment" valignment=bottom xpad=105 ypad=115 shaded-background=true shading-value=165
    ! queue ! journey.
  )
}

add_scene "dome-of-the-rock.jpg" "سِيرَة" "عِش حكاية القدس — فيديو إرشادي احتياطي بشرح مكتوب" center
add_scene "jerusalem-ramparts.jpg" "ابدأ من الخريطة الحيّة" "اختر موقعاً في البلدة القديمة، وشاهد المعالم والمسار على خريطة تفاعلية واحدة."
add_scene "damascus-gate.jpg" "كل مكان يفتح حكاية" "استكشف باب العمود وخان الزيت والقيامة والأقصى، مع صور ووصف وموقع وحكاية صوتية."
add_scene "khan-al-zait-passage.jpg" "اتبع مساراً خطوة بخطوة" "تأخذك «رحلة في قلب القدس» عبر أربع محطات من باب العمود إلى باحات الأقصى."
add_scene "holy-sepulchre.jpg" "طبقات متعددة لفهم المكان" "استخدم الفلاتر لتقرأ المكان من زوايا التاريخ والدين والجغرافيا والهوية والذاكرة والحياة."
add_scene "khan-al-zait-sweets.jpg" "القدس كما تُعاش" "تقرّبك طبقة الحياة من الطعام والحِرف واللحظات اليومية. وتظهر المشاهد التجريبية بعلامة واضحة داخل المنصة."
add_scene "herods-gate.jpg" "استمع، ثم جرّب" "استمع إلى السرد العربي، واختبر معرفتك في الألعاب التفاعلية. التسجيلات السردية مولّدة من نصوص المنصة وليست تسجيلات ميدانية."
add_scene "dome-and-chain.jpg" "سيرة... ابدأ رحلتك" "اكتشف القدس من خلال أماكنها وحكاياتها وذاكرتها وحياتها اليومية — النسخة الاحتياطية الصامتة، 72 ثانية." center

gst-launch-1.0 "${arguments[@]}"
echo "Created $output_file"
