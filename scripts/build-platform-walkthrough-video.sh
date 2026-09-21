#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
capture_directory="/tmp/sira-platform-walkthrough"
output_directory="$project_root/public/video"
output_file="$output_directory/sira-platform-guide-ar.mp4"

mkdir -p "$output_directory"
if [ "${SKIP_CAPTURE:-0}" != "1" ]; then
  bash "$project_root/scripts/capture-platform-walkthrough-screens.sh" "$capture_directory"
fi

# Twelve real platform screens, twenty seconds each: a four-minute fallback
# that can replace the live presentation if connectivity or a live demo fails.
# The screens are static explainer shots, so 10 fps keeps the delivery compact.
arguments=(
  -e
  concat name=walkthrough ! queue ! videoconvert ! x264enc bitrate=2200 speed-preset=ultrafast tune=stillimage key-int-max=300 ! h264parse ! mp4mux faststart=true ! filesink location="$output_file"
)

add_scene() {
  local screen="$1"
  local caption="$2"
  arguments+=(
    filesrc location="$capture_directory/$screen.png" ! pngdec ! imagefreeze num-buffers=200 ! video/x-raw,framerate=10/1 ! videoconvert ! videoscale ! video/x-raw,width=1280,height=720,pixel-aspect-ratio=1/1
    ! textoverlay text="$caption" font-desc="Noto Kufi Arabic Bold 10" color=0xfffaf8f5 outline-color=0xff110b29 halignment=right valignment=bottom xpad=40 ypad=32 shaded-background=true shading-value=185
    ! queue ! walkthrough.
  )
}

add_scene 01 "دليل «سيرة» — فيديو بديل للعرض الحي. في الدقائق القادمة نتعرّف إلى أقسام المنصة وطريقة استخدامها."
add_scene 01 "الصفحة الرئيسية: نقطة البداية. منها تصل سريعاً إلى الخريطة والمسارات والألعاب والبحث والتعريف بالمنصة."
add_scene 02 "استكشف الخريطة: اختر معلماً من العلامات، كبّر العرض، أو بدّل بين طبقات الخريطة لتبدأ اكتشاف القدس."
add_scene 03 "الفلاتر الموضوعية: اقرأ المعالم من زوايا التاريخ والدين والجغرافيا والهوية والذاكرة والحياة."
add_scene 04 "صفحة المكان: لكل معلم بطاقة غنية بالصورة والوصف والموقع والسياق، مع الانتقال إلى خريطته أو حكايته."
add_scene 05 "الحكايات المرتبطة بالأماكن: يقدّم كل موقع سرداً عربياً وصوراً وتفاصيل تساعد على ربط المعلومة بالمكان."
add_scene 06 "المسارات: اختر طريقاً مناسباً، واطّلع على عدد محطاته ومدته ومسافته ووصف التجربة قبل البدء."
add_scene 07 "داخل المسار: الخريطة تقودك محطةً بمحطة، مع تقدم الرحلة والحكاية والصوت الخاص بكل موقع."
add_scene 08 "قسم «القدس كما تُعاش»: نافذة على الطعام والحِرف واللحظات اليومية؛ وتُعرّف المشاهد التجريبية بوضوح."
add_scene 09 "اللحظات المقدسية: مشاهد قصيرة مرتبطة بالمكان، تفتح تجربة سردية إضافية ضمن طبقة الحياة."
add_scene 10 "الألعاب التفاعلية: يمكن للزائر الدخول لحفظ التقدم والنقاط، بينما تبقى الخريطة والحكايات متاحة للجميع."
add_scene 11 "البحث: اكتب اسم مكان أو كلمة مفتاحية للوصول السريع إلى المعالم والحكايات المرتبطة بها."
add_scene 12 "عن سيرة: منصة تفاعلية لاكتشاف القدس عبر أماكنها وحكاياتها وذاكرتها وحياتها اليومية. شكراً لمتابعتكم."

gst-launch-1.0 "${arguments[@]}"
echo "Created $output_file"
