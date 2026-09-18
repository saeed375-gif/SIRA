interface SiraLogoProps {
  className?: string;
}

export const SiraLogo = ({ className = '' }: SiraLogoProps) => (
  <img
    src="/brand/sira-logo.jpg"
    alt="شعار منصة سيرة | Sira — عِش حكاية القدس"
    width={1254}
    height={1254}
    className={`shrink-0 object-contain rounded-xl bg-black ${className}`}
  />
);
