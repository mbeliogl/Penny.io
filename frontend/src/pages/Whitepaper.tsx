import {
  ArrowRightCircle,
  FileText,
  MousePointerClick,
  PlusCircle,
} from 'lucide-react';
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties } from 'react';

// Data used to drive the “typing” animation in the faux editor header
const INTRO_LINES = [
  { type: 'title', text: 'Penny.io Whitepaper' },
  { type: 'subtitle', text: 'Wallet-native micropayments on Base + Solana' },
  { type: 'meta', text: 'Auto-save enabled • March 2025 build' },
] as const;

// Each section defines its heading, copy, and the “Paste” button label
const SECTION_DEFINITIONS = [
  {
    key: 'problem',
    insertLabel: 'Next block: 1. The Problem',
    title: '1. The Problem',
    body: (
      <>
        <p>
          Every writer and reader knows the pain: essential answers trapped behind monthly paywalls,
          opaque revenue splits, and a maze of logins. Writers wait weeks to get paid, readers juggle
          subscriptions for content they rarely use, and platforms keep a disproportionate share
          despite providing limited value.
        </p>
        <p>
          The result is abandoned tabs, unsupported authors, and a pervasive belief that quality
          knowledge has to hide behind yet another checkout form.
        </p>
      </>
    ),
  },
  {
    key: 'thesis',
    insertLabel: 'Next block: 2. Our Thesis',
    title: '2. Our Thesis',
    body: (
      <>
        <p>
          Content should feel as fluid as sending a message. Pay for exactly what you read, own your
          access forever, and route funds directly to the author in seconds. Penny.io puts wallets
          (not walled gardens) at the center of publishing so economics stay transparent and creators
          stay in control.
        </p>
        <ul>
          <li>No custodial accounts, no dark pools of revenue-share math.</li>
          <li>Wallet-native unlocks mean authors can see, audit, and move their earnings instantly.</li>
          <li>
            Readers only sign once; everything else is x402 automation stitched into HTTP&apos;s
            long-reserved “Payment Required”.
          </li>
        </ul>
      </>
    ),
  },
  {
    key: 'how',
    insertLabel: 'Next block: 3. How Penny Works',
    title: '3. How Penny Works',
    body: (
      <ul>
        <li>
          <strong>Per-article pricing:</strong> writers choose a price between $0.01 and $1.00.
        </li>
        <li>
          <strong>Wallet-native unlocks:</strong> readers sign once via Phantom, MetaMask, or AppKit
          and gain permanent access.
        </li>
        <li>
          <strong>Dual-network payouts:</strong> Base + Solana wallets receive funds immediately—no
          custodial account required.
        </li>
        <li>
          <strong>x402 protocol:</strong> authorization off-chain, settlement on-chain so speed stays
          high while fees stay negligible.
        </li>
      </ul>
    ),
  },
  {
    key: 'flow',
    insertLabel: 'Next block: Payment Flow Comparison',
    title: '4. Payment Flow Comparison',
    body: (
      <div className="editor-flow">
        <div className="editor-flow-column">
          <h4>Legacy Paywalls</h4>
          <ol>
            <li>Redirect to sign-up or subscription page.</li>
            <li>Enter card + personal info while the article disappears.</li>
            <li>Wait for processor approval (15–60s) and hope it succeeds.</li>
            <li>Platform settles with author weeks later.</li>
            <li>Reader loses access if the subscription lapses.</li>
          </ol>
        </div>
        <div className="editor-flow-column">
          <h4>Penny + x402</h4>
          <ol>
            <li>Click “Unlock Article”.</li>
            <li>Sign one authorization in your wallet.</li>
            <li>Backend verifies instantly (~3s) and logs the payment.</li>
            <li>Payout routes directly to the author wallet.</li>
            <li>Access stays tied to the wallet forever.</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    key: 'value',
    insertLabel: 'Next block: 5. Why It Matters',
    title: '5. Why It Matters',
    body: (
      <div className="value-grid">
        <article className="value-card">
          <h4>Readers</h4>
          <p>No subscriptions, no invasive signups, and one wallet popup.</p>
          <p>Pay only for what you consume and keep it forever.</p>
        </article>
        <article className="value-card">
          <h4>Writers</h4>
          <p>
            Instant, transparent earnings with a professional editor, analytics dashboard, tipping,
            and full wallet control.
          </p>
        </article>
        <article className="value-card">
          <h4>Platforms</h4>
          <p>A new monetization primitive that doesn’t compromise UX or security—open and composable.</p>
        </article>
      </div>
    ),
  },
  {
    key: 'features',
    insertLabel: 'Next block: 6. Key Features',
    title: '6. Key Features at Launch',
    body: (
      <ol>
        <li>
          <strong>Modern publishing stack:</strong> TinyMCE editor with autosave drafts, image hosting,
          and paywall preview.
        </li>
        <li>
          <strong>Realtime dashboard:</strong> lifetime earnings, conversion rates, weekly stats, and
          wallet health in one view.
        </li>
        <li>
          <strong>Discovery engine:</strong> category filters, popularity scores, likes, and trending
          signals to surface emerging authors.
        </li>
        <li>
          <strong>Wallet management:</strong> link a complementary network wallet, replace it safely,
          and stay synced across chains.
        </li>
        <li>
          <strong>Tip & donate modals:</strong> optimized flows for supporters to send extra USDC on
          Base or Solana.
        </li>
        <li>
          <strong>Security-by-design:</strong> DOMPurify-protected content, Solana ATA verification,
          rate limiting, and Cloudflare WAF.
        </li>
      </ol>
    ),
  },
  {
    key: 'standards',
    insertLabel: 'Next block: 7. Open Standards',
    title: '7. Built on Open Standards',
    body: (
      <ul>
        <li>
          <strong>x402</strong> for payments.
        </li>
        <li>
          <strong>USDC</strong> on Base + Solana for stability.
        </li>
        <li>
          <strong>Coinbase CDP</strong> for optional gasless settlement.
        </li>
        <li>
          <strong>Supabase</strong> for transparent data storage.
        </li>
        <li>
          <strong>WalletConnect / AppKit</strong> so users never hand us their keys.
        </li>
      </ul>
    ),
  },
  {
    key: 'roadmap',
    insertLabel: 'Next block: What’s Next',
    title: '8. What’s Next',
    body: (
      <ul>
        <li>Author profiles, newsletters, and topic subscriptions.</li>
        <li>AI-assisted drafting, proofreading, and formatting suggestions.</li>
        <li>API marketplace where knowledge can be licensed via the same rails.</li>
        <li>Deeper analytics for authors (funnel analysis, category performance).</li>
        <li>Dark mode, accessibility upgrades, and public roadmap voting.</li>
      </ul>
    ),
  },
] as const;

type SectionKey = (typeof SECTION_DEFINITIONS)[number]['key'];

const ABSTRACT_CONTENT = (
  <>
    <p>
      Penny.io reimagines publishing around wallets, not walled gardens. Writers set a price between
      $0.01 and $1.00, readers unlock individual articles in a single wallet popup, and payouts settle
      in seconds across Base and Solana. Under the hood we rely on the x402 protocol—HTTP’s
      long-reserved “Payment Required” status—so authorization happens off-chain while settlement
      remains verifiable on-chain.
    </p>
    <p>
      The result is a content economy without subscriptions, ads, or delayed payouts. Scroll (or
      click) through the draft to watch the whitepaper assemble in real time.
    </p>
  </>
);

// Motion hook so typing animation respects user preferences
function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setPrefers(mediaQuery.matches);
    setPrefers(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefers;
}

// Small helper to only fire the typing animation once the block is visible
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      });
    }, options ?? { threshold: 0.4 });

    observer.observe(target);

    return () => observer.disconnect();
  }, [options]);

  return [ref, isVisible] as const;
}

// Typing animation for the intro meta text at the top of the editor
function TypedIntro() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [ref, isVisible] = useInView();
  const [renderedLines, setRenderedLines] = useState(() => INTRO_LINES.map(() => ''));
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isVisible || prefersReducedMotion || completed) return;

    const currentLine = INTRO_LINES[lineIndex];
    if (!currentLine) {
      setCompleted(true);
      return;
    }

    const targetText = currentLine.text;
    const timeout = setTimeout(() => {
      setRenderedLines((prev) => {
        const next = [...prev];
        next[lineIndex] = targetText.slice(0, charIndex + 1);
        return next;
      });

      if (charIndex + 1 === targetText.length) {
        if (lineIndex + 1 === INTRO_LINES.length) {
          setCompleted(true);
        } else {
          setLineIndex((prev) => prev + 1);
          setCharIndex(0);
        }
      } else {
        setCharIndex((prev) => prev + 1);
      }
    }, 25);

    return () => clearTimeout(timeout);
  }, [charIndex, completed, isVisible, lineIndex, prefersReducedMotion]);

  useEffect(() => {
    if (!prefersReducedMotion) return;
    setRenderedLines(INTRO_LINES.map((line) => line.text));
    setCompleted(true);
  }, [prefersReducedMotion]);

  return (
    <div className="typed-panel" ref={ref}>
      {INTRO_LINES.map((line, index) => {
        const isActive = !completed && index === lineIndex;
        return (
          <p key={line.text} className={`typed-line typed-line--${line.type}`}>
            <span>{renderedLines[index]}</span>
            {isActive && <span className="typed-caret" aria-hidden="true" />}
          </p>
        );
      })}
    </div>
  );
}

function RevealGroup({ children }: { children: React.ReactNode }) {
  const items = Children.toArray(children);
  return (
    <div className="editor-section-body">
      {items.map((child, index) => {
        const delay = `${index * 240}ms`;
        if (!isValidElement(child)) {
          return (
            <p key={index} className="text-reveal" style={{ '--reveal-delay': delay } as CSSProperties}>
              {child}
            </p>
          );
        }
        const revealStyle = { ...(child.props.style ?? {}), '--reveal-delay': delay } as CSSProperties;
        const existingClass = child.props.className ?? '';
        return cloneElement(child, {
          key: child.key ?? index,
          className: `${existingClass} text-reveal`.trim(),
          style: revealStyle,
        });
      })}
    </div>
  );
}

function Whitepaper() {
  const lineNumbers = useMemo(() => Array.from({ length: 120 }, (_, index) => index + 1), []);
  const sectionRefs = useRef<Record<SectionKey, HTMLElement | null>>({} as Record<SectionKey, HTMLElement | null>);
  const revealTimeouts = useRef<Record<SectionKey, number>>({} as Record<SectionKey, number>);
  // Tracks which sections have been “pasted” into the faux editor
  const [revealedSections, setRevealedSections] = useState<Record<SectionKey | 'abstract', boolean>>(() => {
    const initial: Record<SectionKey | 'abstract', boolean> = { abstract: true };
    SECTION_DEFINITIONS.forEach((section) => {
      initial[section.key] = false;
    });
    return initial;
  });

  // Auto-insert blocks once they scroll into view
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setRevealedSections((prev) => {
        const next = { ...prev };
        SECTION_DEFINITIONS.forEach((section) => {
          next[section.key] = true;
        });
        return next;
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute('data-section-key') as SectionKey | null;
            if (key && !revealTimeouts.current[key]) {
              revealTimeouts.current[key] = window.setTimeout(() => {
                setRevealedSections((prev) => {
                  if (prev[key]) return prev;
                  return { ...prev, [key]: true };
                });
                delete revealTimeouts.current[key];
              }, 350);
            }
          }
        });
      },
      { threshold: 1, rootMargin: '0px 0px -100px 0px' },
    );

    SECTION_DEFINITIONS.forEach((section) => {
      if (!revealedSections[section.key]) {
        const node = sectionRefs.current[section.key];
        if (node) observer.observe(node);
      }
    });

    return () => {
      observer.disconnect();
      Object.values(revealTimeouts.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      revealTimeouts.current = {} as Record<SectionKey, number>;
    };
  }, [revealedSections]);

  const registerSectionRef = (key: SectionKey) => (node: HTMLElement | null) => {
    sectionRefs.current[key] = node;
  };

  return (
    <div className="whitepaper-page">
      <div className="whitepaper-editor">
        <div className="editor-window">
          {/* Faux editor chrome and toolbar */}
          <header className="editor-chrome" aria-label="Faux editor chrome">
            <div className="editor-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="editor-filename">
              <FileText size={16} aria-hidden="true" />
              <span>whitepaper.md</span>
            </div>
            <div className="editor-status">Auto-save on · Wallet connected</div>
          </header>

          <div className="editor-toolbar" role="presentation">
            <div className="editor-toolbar-left">
              <span>H1</span>
              <span>H2</span>
              <span>Quote</span>
              <span>List</span>
              <span>Insert</span>
            </div>
            <div className="editor-toolbar-right">Cmd ⌘ + ↵ to run x402 check</div>
          </div>

          <div className="editor-body">
            <div className="editor-gutter" aria-hidden="true">
              {/* Line-number column for the editor */}
              {lineNumbers.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
            <div className="editor-content">
              {/* Intro typing animation + contextual hint */}
              <TypedIntro />
              <div className="editor-hint">
                <MousePointerClick size={16} aria-hidden="true" />
                <p>
                  Scroll to keep writing—each section will auto-paste when its cursor enters view.
                </p>
              </div>

              <section className="editor-block revealed" id="section-abstract">
                <p className="editor-section-label">Abstract</p>
                <RevealGroup>{ABSTRACT_CONTENT}</RevealGroup>
              </section>

              {/* Render each section either as a “Paste block” button or the card content */}
              {SECTION_DEFINITIONS.map((section) => {
                const isRevealed = revealedSections[section.key];
                return (
                  <section
                    key={section.key}
                    id={`section-${section.key}`}
                    className={`editor-block ${isRevealed ? 'revealed' : 'pending'}`}
                    ref={registerSectionRef(section.key)}
                    data-section-key={section.key}
                  >
                    {isRevealed ? (
                      <>
                        <p className="editor-section-label">{section.title}</p>
                        <RevealGroup>{section.body}</RevealGroup>
                      </>
                    ) : (
                      <div className="editor-placeholder">
                        <PlusCircle size={18} aria-hidden="true" />
                        <span>{section.insertLabel}</span>
                      </div>
                    )}
                  </section>
                );
              })}

              <section className="editor-block revealed">
                <p className="editor-section-label">9. Join the Network</p>
                <RevealGroup>
                  <p>
                    Penny.io is the home for people who believe knowledge should travel at the speed of a signature. If
                    you’re a writer frustrated with legacy platforms or a reader tired of hundred-dollar paywalls, we
                    built this for you.
                  </p>
                  <ul>
                    <li>Connect your wallet and publish in minutes.</li>
                    <li>Read with one click, no account required.</li>
                    <li>Fork the repo or open an issue—everything is open source.</li>
                  </ul>
                </RevealGroup>
                <button type="button" className="editor-cta-button">
                  <ArrowRightCircle size={18} aria-hidden="true" />
                  Pay for brilliance
                </button>
              </section>
            </div>
          </div>
        </div>

        {/* Scroll cue floating under the editor surface */}
        <div className="editor-scroll-cue">
          <span />
          <p>Scroll to continue drafting</p>
        </div>
      </div>
    </div>
  );
}

export default Whitepaper;
