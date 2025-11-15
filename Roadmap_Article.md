# Penny.io Feature Roadmap

_A concise look at what’s coming next for the platform._

---

## 1. UI / UX Improvements

- **Dark Mode & Themes**  
  Light, dark, and system-based themes so readers can stay comfortable in any environment.

- **Category Insights**  
  Dashboard statistics showing total articles and average popularity per category to help writers understand where demand is growing.

- **Trending Sections**  
  Category-specific “Trending Now” blocks with visual indicators so readers can discover hot topics quickly.

- **Reading History & Favorites**  
  Wallet-based history plus a favorites list to revisit saved articles without juggling bookmarks.

- **Persistent Draft Categories**  
  Draft editor will remember a writer’s category selections (requires schema + API update).

- **Author Newsletter Popups**  
  x402-powered opt-ins so readers can support their favorite authors with premium newsletters.

- **LLM Writing/Proofread Assist**  
  Optional AI co-pilot inside the editor to suggest titles, summarize sections, or clean up grammar.

**Later**  
- Support email integration (`support@penny.io`) for high-priority tickets.  
- Security overview page that summarizes privacy posture for readers.  
- Documentation refresh (README, CLAUDE.md, internal guides).

---

## 2. Enhanced Article Discovery

- **Dynamic Home Feed**  
  Toggle between “Popular Articles” and “Recently Published” to balance evergreen hits with fresh drops.

- **Author Profiles**  
  Dedicated profile pages with bios, stats, and wallet info so readers can follow specific voices.

- **Author Highlighting**  
  Featured modules on the homepage to showcase new authors, themed collections, or sponsored partners.

---

## 3. Backend & Functional Upgrades

- **Admin Payment Logs**  
  Tooling to inspect payment history per article, simplifying support and reconciliation.

- **Solana ATA Helper**  
  Refactor `resolveSolanaAtaOwner` into a shared helper with caching/backoff so RPC calls stay efficient during bursts.

- **Payment Normalization Job**  
  Background job to reconcile legacy payment records and keep lifetime stats accurate.

- **Health Checks & Tests**  
  New unit/integration tests (or a health endpoint) dedicated to `/payment-status` on both EVM and Solana pathways.

---

## 4. API / Technical Marketplace

- **Code & API Access**  
  Paid access endpoints—scraped datasets or API-powered insights—where revenue flows directly to the publisher’s wallet via x402.

- **Third-Party Integrations**  
  Shareable links and embed widgets so other platforms can surface Penny.io content; likely paired with author profile metadata.

---

We’re shipping aggressively while keeping the product stable for writers and readers. Have an idea? Reach out or open an issue—this roadmap evolves with community feedback.*** End Patch
