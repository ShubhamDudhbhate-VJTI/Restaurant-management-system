# Design rules (RMS)

## 1. How the design skills are used

Skills live in `.agents/skills/`. For all frontend work:

- Always follow: `design-taste-frontend` (core, v2) and `full-output-enforcement`.
- Visual style (use only this one): `minimalist-ui`.
- Ignore every other skill in that folder unless I ask.
- If your tool does not load skills automatically, read those SKILL.md files directly by path.

**Precedence when rules conflict:** section 3 of this file (Project overrides) wins, then `minimalist-ui`, then `design-taste-frontend`.

The copy in `.agents/skills/` is the pinned version for this project. The core skill is v2 experimental and its rule wording can change, so do not reinstall or upgrade it without asking me.

## 2. Design brief (answers for the skill's brief inference)

- **Page kind:** a web APPLICATION (product UI) with a public landing surface. Internal screens remain operational; the landing page is a separate marketing surface with editorial storytelling and no invented proof.
- **Users and devices:**
  - Customers: phones at the table, one-handed, mobile-first.
  - Kitchen: a tablet or monitor read from a distance. High contrast, large type.
  - Cashier and Admin: desktop.
- **Vibe:** minimalist, calm, fast, trustworthy. Editorial restraint in the style of Linear or Notion (this is what `minimalist-ui` describes).
- **Density:** customer screens low to medium. Kitchen and cashier medium to high, but easy to scan.
- **Design system:** shadcn/ui on Tailwind. Do not add another component library.
- **Theme:** light only for the MVP (Page Theme Lock = light). Dark mode is out of scope for now.
- **Accent:** one restrained, non-purple brand accent, defined once as a design token. Plus the fixed status palette in section 3.
- **Shape:** one corner-radius system across the whole app, chosen once.

## 3. Project overrides (these win over the skills)

1. **Status colors are allowed on top of the single accent.** The Color Consistency Lock applies to the brand accent, not to status. Define tokens once for table states (`free`, `held`, `occupied`) and order states (`placed`, `preparing`, `ready`, `served`, `cancelled`). Always pair color with a text label. Never use color alone.
2. **Status indicators are text badges** (shadcn Badge), not decorative dots. The skill's "at most one status dot per section" rule is aimed at decoration. The tables grid and kitchen board show real state, but text badges avoid the issue entirely.
3. **Data grids may use equal cards.** The ban on three-equal-card rows is for marketing feature sections. The tables grid and menu grid are data.
4. **Lists and tables:** kitchen orders are cards. The cashier session list is rows or cards. The bill is a genuine itemized table, so row dividers are fine there. Do not use the divider-on-every-row look elsewhere.
5. **Images:** never float pills or tags over a photo. Put "Unavailable" and any dietary tags below or beside the image. Items without an image render as a clean text-first card. No placeholder illustrations and no hand-drawn decorative SVG.
6. **Internal screen patterns:** no marketing patterns in operational screens. The public landing page may use a hero, narrative sections, and a minimal footer when they communicate the real MVP workflow. Login and signup are simple centered forms.
7. **Copy:** no em dashes or en dashes in any UI text (use a hyphen or rephrase). Plain, short language. Format money in INR as `₹` using the `en-IN` locale.
8. **Touch targets:** at least 44px on customer screens. Primary actions on kitchen and cashier screens are larger (about 48px or more).
9. **Kitchen tickets:** the table number is the largest element. Then items, notes, elapsed time. One primary action per ticket.
10. **Motion:** GSAP only, using the skill's canonical patterns. No scroll event listeners. Always respect `prefers-reduced-motion`. Never animate in a way that delays seating, ordering or paying.
11. **Live updates must not jump the layout.** New kitchen tickets animate in subtly. The offer countdown is always visible while an offer is active.
12. **Accessibility:** WCAG AA contrast, visible focus rings, labelled form fields, everything keyboard operable.
13. **Completeness:** `full-output-enforcement` applies. No placeholder comments, skipped sections or half-built screens at the end of a milestone.

## 4. Screen notes

- **Tables (customer):** grid of table cards with a text status badge. Available: "Scan the QR at the table to sit here". Occupied: **Make a reservation**. A status banner is pinned at the top for the active session.
- **Scan page `/t/:qrToken`:** single purpose. One primary action per relation (see `spec.md` 9.1).
- **Menu and cart:** category tabs, item cards, a sticky cart bar that opens a Sheet drawer.
- **Kitchen:** three columns (Placed / Preparing / Ready for pickup).
- **Cashier:** session list with a detail panel. **Mark paid** is primary. **Force-close** is secondary and destructive, behind a confirm dialog.
- **Admin:** simple shadcn forms and tables for menu and tables.

## 5. Pre-flight before finishing any UI milestone

- Run the skill's own pre-flight check.
- Check a 390px-wide phone viewport with no horizontal scroll, and a 1024px tablet viewport for kitchen and cashier.
- Confirm status is never shown by color alone and reduced-motion is respected.
