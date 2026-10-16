// components/lton/PhotoSlot.tsx — a framed image slot for photography that doesn't exist yet.
//
// No photos of Conor or the car exist (PRODUCT.md), so nothing is faked. Each slot names
// the file it is waiting for. Until that file is set via `src`, the slot renders a designed
// brand panel (ink or mist, with the L plate) that reads as intentional, not empty.
//
// To add a photo: put it in /public/photos/ and pass its path as `src`, e.g.
//   <PhotoSlot src="/photos/hero.jpg" alt="Conor in the dual-control car" ... />
type Props = {
  /** Public path of the photo once it exists, e.g. "/photos/hero.jpg". */
  src?: string;
  /** Describes the photo for screen readers. Ignored by the fallback panel. */
  alt: string;
  /** What belongs here, kept in the markup for whoever adds the photo. */
  wants: string;
  tone?: "ink" | "mist";
  /** The plate letter shown in the fallback. */
  plate?: "L" | "N";
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export default function PhotoSlot({ src, alt, wants, tone = "ink", plate = "L", className = "", style, children }: Props) {
  return (
    <figure
      className={`l-photo l-photo--${tone} ${className}`}
      data-wants={src ? undefined : wants}
      style={style}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="l-photo__img" />
      ) : (
        <div className="l-photo__fallback" aria-hidden="true">
          <span className="l-photo__road" />
          <span className="l-photo__plate"><span>{plate}</span></span>
        </div>
      )}
      {children}
    </figure>
  );
}
