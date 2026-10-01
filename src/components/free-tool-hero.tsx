import Link from "next/link";
import { FreeToolIcon, type FreeToolIconName } from "@/components/free-tool-icon";

interface FreeToolHeroProps {
  icon: FreeToolIconName;
  eyebrow: string;
  title: string;
  description: string;
  privacy: string[];
}

export function FreeToolHero({
  icon,
  eyebrow,
  title,
  description,
  privacy,
}: FreeToolHeroProps) {
  return (
    <section className="tool-page-hero">
      <div className="tool-page-inner">
        <Link className="tool-page-hero__back" href="/tools">
          ← All free tools
        </Link>

        <div className="tool-page-hero__identity">
          <span className={`tool-page-hero__icon tool-page-hero__icon--${icon}`}>
            <FreeToolIcon name={icon} />
          </span>
          <p className="tools-eyebrow">{eyebrow}</p>
        </div>

        <h1>{title}</h1>
        <p className="tool-page-hero__description">{description}</p>

        <div className="tool-privacy-line" aria-label="Tool privacy details">
          {privacy.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
