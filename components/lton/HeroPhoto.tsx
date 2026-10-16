// components/lton/HeroPhoto.tsx — the homepage hero photo. Landscape on phones (full width,
// under the text); the portrait crop, if supplied, in the tall column from 900px.
import { getImageProps } from "next/image";

type Props = {
  /** Landscape photo, e.g. "/photos/hero.jpg". */
  src: string;
  /** Optional portrait crop for the desktop column, e.g. "/photos/hero-portrait.jpg". */
  tallSrc?: string;
  alt: string;
};

export default function HeroPhoto({ src, tallSrc, alt }: Props) {
  const common = { alt, fill: true, priority: true };
  const {
    props: { srcSet: wide, ...rest },
  } = getImageProps({ ...common, src, sizes: "(min-width: 900px) 42vw, 100vw" });
  const tall = tallSrc
    ? getImageProps({ ...common, src: tallSrc, sizes: "42vw" }).props.srcSet
    : undefined;

  return (
    <figure className="l-hero__photo">
      <picture>
        {tall && <source media="(min-width: 900px)" srcSet={tall} sizes="42vw" />}
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
        <img {...rest} srcSet={wide} className="l-hero__img" />
      </picture>
    </figure>
  );
}
