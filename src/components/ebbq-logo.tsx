import Image from "next/image";
import Link from "next/link";

const SRC = "/brand/ebbq-logo-primary.png";
const WIDTH = 849;
const HEIGHT = 521;

type EbbqLogoProps = {
  className?: string;
  /** Altezza visiva (larghezza segue il rapporto del logo). */
  heightClass?: string;
  priority?: boolean;
  /** Se true, il logo è un link alla dashboard. */
  href?: string;
};

export function EbbqLogo({
  className = "",
  heightClass = "h-8",
  priority = false,
  href,
}: EbbqLogoProps) {
  const img = (
    <Image
      src={SRC}
      alt="Electronic BBQ — EBBQ"
      width={WIDTH}
      height={HEIGHT}
      className={`w-auto ${heightClass} ${className}`}
      priority={priority}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0" aria-label="EBBQ — Dashboard">
        {img}
      </Link>
    );
  }

  return <span className="inline-flex shrink-0">{img}</span>;
}
