import { ReactNode, useEffect, useRef } from 'react';
import { PenTool, LayoutDashboard, ShieldCheck, Zap, BookOpen, Eye, Coins } from 'lucide-react';
import AppKitConnectButton from './AppKitConnectButton';

type Highlight = {
  icon: ReactNode;
  title: string;
  detail: string;
};

type ConnectPromptHeroProps = {
  title: string;
  description: string;
  highlights?: Highlight[];
};



const glyphs = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#%$<{}!@$&*◦◇◆◎'.split('');

const ConnectPromptHero = ({
  title,
  description,
  highlights = defaultHighlights,
}: ConnectPromptHeroProps) => {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    let lastEmit = 0;

    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastEmit < 65) return;
      lastEmit = now;

      if (panelRef.current?.contains(event.target as Node)) return;

      const rect = surface.getBoundingClientRect();
      const particle = document.createElement('span');
      particle.className = 'connect-hero__particle';
      particle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      particle.style.left = `${event.clientX - rect.left}px`;
      particle.style.top = `${event.clientY - rect.top}px`;
      surface.appendChild(particle);

      requestAnimationFrame(() => particle.classList.add('is-active'));

      setTimeout(() => {
        particle.remove();
      }, 1200);
    };

    surface.addEventListener('pointermove', handlePointerMove);
    return () => surface.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return (
    <section className="connect-hero" aria-live="polite">
      <div className="connect-hero__surface" ref={surfaceRef}>
        <div className="connect-hero__panel" ref={panelRef}>
          <p className="connect-hero__eyebrow">Let's put it into words</p>
          <h1>{title}</h1>
          <p className="connect-hero__description">{description}</p>
          <div className="connect-hero__cta">
            <AppKitConnectButton />
          </div>

          <div className="connect-hero__divider" aria-hidden="true" />

          <ul className="connect-hero__highlights">
            {highlights.map(({ icon, title: highlightTitle, detail }) => (
              <li key={highlightTitle}>
                <span className="connect-hero__icon">{icon}</span>
                <div>
                  <p className="connect-hero__highlight-title">{highlightTitle}</p>
                  <p className="connect-hero__highlight-detail">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="connect-hero__glow" aria-hidden="true" />
      </div>
    </section>
  );
};

export const writeHighlights: Highlight[] = [
  {
    icon: <PenTool size={16} />,
    title: 'Autosave drafts',
    detail: 'Offline-safe, synced every five seconds.',
  },
  {
    icon: <Eye size={16} />,
    title: 'Clean preview',
    detail: 'See exactly what readers get before publishing.',
  },
  {
    icon: <Zap size={16} />,
    title: 'Instant publish',
    detail: 'Go live and get paid in under 30 seconds.',
  },
];

export const dashboardHighlights: Highlight[] = [
  {
    icon: <LayoutDashboard size={16} />,
    title: 'Unified analytics',
    detail: 'Revenue, metrics, and insights in one view.',
  },
  {
    icon: <Coins size={16} />,
    title: 'Multi-chain payouts',
    detail: 'Control your payout wallets.',
  },
  {
    icon: <BookOpen size={16} />,
    title: 'Manage your articles',
    detail: 'Edit or delete your articles.',
  },
];

export default ConnectPromptHero;
