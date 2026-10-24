import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

export function SiteFooter() {
  return (
    <footer className="bg-stage text-mist">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-4">
            {/* One of the few places the logo mark appears. */}
            <Image
              src="/brand/logo-mark.png"
              alt=""
              width={56}
              height={56}
              className="rounded-xl"
            />
            <span className="h-12 w-px bg-brand-light/60" aria-hidden />
            <Wordmark size="sm" tagline className="items-start" />
          </div>
          <p className="mt-6 max-w-sm text-sm leading-relaxed">
            A student-focused media and recognition platform discovering remarkable
            people, ideas, and opportunities — starting at AFIT.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-beam">
            Be part of the story
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/founder" className="hover:text-beam">Talk to the Founder</Link></li>
            <li><Link href="/founder?topic=recommend" className="hover:text-beam">Recommend someone</Link></li>
            <li><Link href="/message" className="hover:text-beam">Send an anonymous message</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-beam">
            The Spotlight
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a href="/#about" className="hover:text-beam">Who we are</a></li>
            <li><a href="/#profile" className="hover:text-beam">The Spotlight Profile</a></li>
            <li><a href="/#rhythm" className="hover:text-beam">Publishing rhythm</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-[11px] uppercase tracking-[0.2em] sm:flex-row sm:justify-between sm:px-6">
          <span>Discover. Tell. Amplify. Connect.</span>
          <span>© {new Date().getFullYear()} The Spotlight</span>
        </div>
      </div>
    </footer>
  );
}
