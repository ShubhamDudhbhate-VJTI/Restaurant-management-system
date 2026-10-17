# RMS Landing Page: Continuous 3D Design

Status: review disposition: REVISE; implementation not started

## Understanding summary

- Rebuild only the public `/` landing page as a continuous, scroll-driven RMS product story.
- Replace the current flat CSS illustration and click-through demo with one persistent procedural React Three Fiber scene.
- Keep all copy, navigation, links, buttons, and authentication behavior in accessible DOM.
- Preserve `useAuth()`, `?next=`, login/logout state, and `/tables` versus `/signup` CTA routing exactly.
- Use only verified RMS product capabilities and existing roles in the copy.
- Optimize the premium experience for capable desktop/laptop hardware, with intentional mobile, reduced-motion, and no-WebGL fallbacks.
- Do not modify other routes, hooks, APIs, or contracts.

## Assumptions

- The page is a public showcase with modest traffic, not a high-scale operational surface.
- New runtime dependencies may be added only to `apps/web`.
- External assets may be researched during design, but production runtime assets and fonts must be locally served or explicitly approved with license, privacy, transfer-size, cache, and failure analysis.
- The canvas is decorative and `aria-hidden`; all meaning remains available in HTML.
- WebGL failure and low-end hardware must degrade to a useful poster/CSS experience.
- Desktop-first means 1440px is the primary visual and performance target.
- No approved Spline scene URL currently exists. Spline integration is deferred rather than guessed.

## Accepted approach

### R3F-first persistent scene

A fixed, full-viewport React Three Fiber canvas remains behind the page while semantic HTML sections scroll above it. GSAP ScrollTrigger is the only scroll driver. One scrubbed master timeline updates a shared mutable progress value, and the R3F scene interpolates camera, lighting, and object states from typed beat data.

Spline is not loaded in the initial implementation. It will not shape the initial scene API or add an adapter abstraction. A future Spline integration can be evaluated as a separate design change after an approved URL is supplied and its size, licensing, export settings, and performance are reviewed.

## Final design

### Architecture

`Landing.tsx` owns the auth-aware navigation, semantic sections, anchor links, fallback states, and existing CTA behavior. The 3D code lives under `src/landing3d/` and is lazy-loaded so the initial HTML and navigation render before WebGL.

Planned modules:

```text
src/pages/Landing.tsx
src/pages/landing.css
src/landing3d/
  LandingScene.tsx
  CameraRig.tsx
  beats.ts
  progress.ts
  fallback.tsx
  objects/
    Table.tsx
    Plate.tsx
    QrPlacard.tsx
    MenuCards.tsx
    Ticket.tsx
    Pass.tsx
    Receipt.tsx
    Chairs.tsx
    Floor.tsx
  shaders/
    scanBeam.ts
    steam.ts
```

The canvas uses `aria-hidden="true"` and `pointer-events: none`. `landing.css` uses `overflow-x: clip`, not `overflow: hidden`. The persistent scene is one canvas, not one WebGL scene per section.

The canvas visibility policy does not rely on IntersectionObserver for a fixed element. Rendering is active only while the landing route is visible, the document is visible, and the scene is within the active journey range. The route lifecycle and `visibilitychange` event suspend the render loop when inactive; the fixed canvas remains visually stable without consuming frames.

### Scroll and data flow

`beats.ts` contains normalized progress ranges for `arrive`, `scan`, `order`, `kitchen`, `bill`, `roles`, and `close`. Each beat defines camera position/target, palette, and object-state targets.

`progress.ts` creates one GSAP context, configures Lenis only for eligible desktop and non-reduced-motion devices, synchronizes Lenis with the GSAP ticker, binds the master ScrollTrigger timeline, refreshes after fonts and the first 3D frame, and cleans up every registration on unmount. The master timeline is the sole writer of `progress.value`; Lenis only supplies scroll smoothing and ScrollTrigger only samples the scroll position. The scene never writes scroll state back.

The lifecycle contract is explicit: mount creates one context, one Lenis instance at most, one ticker callback, and one master trigger; cleanup removes the ticker callback, kills the master trigger, reverts the context, and destroys Lenis. Development diagnostics will assert these counts before and after StrictMode remount and route navigation.

`CameraRig.tsx` reads the shared progress inside `useFrame`, interpolates the active beat pair, and applies damped pointer parallax only when motion is allowed. DOM sections use the same progress ranges rather than independent one-shot reveal timelines, so forward and reverse scrolling are symmetrical.

### Scene journey

| Beat | Scene state | DOM message |
| --- | --- | --- |
| Arrive | Table, plate, steam particles, and QR placard settle into a top-down cobalt room | “Every table. Every order. One system.” |
| Scan | Camera tilts, QR placard faces the viewer, scan beam passes, menu cards fan out | “Scan the table. The menu opens already knowing where you sit.” |
| Order | Menu cards become dishes, dishes orbit and land, tickets appear, status tiles light | “Order from the seat. Add rounds any time.” |
| Kitchen | Camera moves to the steel pass, tickets travel the rail, one ticket becomes ready | “The kitchen sees one ticket per round, with the table and the time.” |
| Bill | Receipt ribbon unspools, total counts to the approved showcase value, paid state lands, plates clear | “One bill for the whole session.” |
| Roles | Camera orbits while verified RMS roles are represented by lit chairs | One concise line per role |
| Close | Camera returns top-down to the clean table and DOM CTA | “Open the system” |

### Visual system and copy

- Tile cobalt `#1B3FBF`
- Saffron `#F5A623`
- Chalk `#EEF0F2`
- Pass steel `#8E98A4`
- Char `#12141A`
- Chilli `#E23B2E`, only for meaningful status moments
- Bricolage Grotesque for display
- Existing Geist Sans for body and UI

The redesign removes serif display type, italic accent words, tracked all-caps eyebrows, decorative section numbering, and repeated generic fade-up animation. Text remains sentence case, at least 12px when readable, and at least 4.5:1 contrast.

Copy must be checked against actual pages, hooks, contracts, and seeded workflows. Unsupported claims about automatic service, live analytics, discounts, or waiter behavior are excluded or rewritten. A claim-to-source checklist will be maintained during implementation; every product claim must map to a route, hook, contract, seed behavior, or passing API test.

The bill total, table number, session number, order number, and payment method are explicitly presented as “Demo session” data unless they are sourced from a real persisted workflow. The visual state must not imply that a real payment occurred. The narrative uses concrete product language first: table/session context, QR seating, menu ordering, kitchen status, cashier settlement, and role-specific visibility. Metaphorical supporting copy is allowed only after the concrete behavior is clear.

Every primary and product-flow CTA is auth-aware: unauthenticated visitors go to `/signup${authQuery}`, authenticated visitors go to `/tables`. A label such as “Try the customer flow” must state the signup requirement when logged out, or become “Open the customer flow” when logged in. Decorative role rows do not show directional arrows unless they are actual links or controls.

### Fallbacks and non-functional behavior

The HTML renders immediately with a static cobalt/chalk poster while the lazy 3D chunk loads. The capability policy is deterministic:

- Skip WebGL below 900px viewport width, when `hardwareConcurrency <= 4`, when `deviceMemory <= 4` where available, or when a WebGL context probe fails.
- Render the poster/CSS journey when skipped.
- If WebGL context creation or rendering fails after initialization, remove the canvas and switch to the same fallback.
- Keep the same semantic section order and anchor IDs in every profile. The fallback may reduce visual motion, but it must not alter anchor targets or remove product copy.

Initial budgets are pass/fail constraints: landing 3D JavaScript chunk at or below 350 KB gzip, procedural 3D asset payload at or below 500 KB, no more than 120,000 visible triangles in the desktop scene, no more than 40,000 on the fallback-capable mobile profile, and a 95th-percentile frame time at or below 20 ms during the heaviest desktop beat on the target 1440px test device. If a budget fails, reduce scene complexity before adding effects.

Reduced motion disables Lenis, idle drift, pointer parallax, autoplay arrival motion, and continuous interpolation. Beat changes become discrete poses with short or no transitions. The canvas is hidden from assistive technology; the page has one `h1`, a skip link, keyboard focus styles, and accessible DOM equivalents for every meaningful scene beat.

Accessibility inventory:

- Camera movement, particles, lighting, and object choreography are decorative.
- Beat headings, product claims, role descriptions, payment state, and CTAs are semantic DOM content.
- The progress journey is not an input and does not require keyboard control.
- Reduced-motion and fallback profiles expose the same headings, copy, links, and anchor order.
- No scene state is announced continuously; state changes are represented by the adjacent DOM section.
- The loading state does not block the skip link, navigation, or primary CTA.
- Auth resolution preserves a stable CTA target: while auth is unresolved, the CTA is disabled or clearly marked loading rather than defaulting to signup.

The scene uses `dpr={[1, 1.75]}`, no per-frame allocations, instanced repeated geometry, minimal lights, no mobile bloom, and no real-time shadow maps beyond a restrained contact shadow. Rendering pauses when the landing route or document is inactive.

Budget measurements are reproducible: the JavaScript budget means the production-generated landing 3D chunk after minification and gzip; the asset budget includes all locally fetched models, textures, and shader payloads but excludes the browser/runtime libraries; the triangle budget is measured from the rendered desktop scene; and frame time is measured with a fixed 60-second scripted scroll on the named 1440px target device. The final report records chunk sizes, asset sizes, p95 frame time, long tasks, and any fallback decision.

WebGL failure has an explicit state transition: `loading -> ready`, `loading -> fallback`, `ready -> fallback` on context loss or renderer failure. The fallback transition removes the canvas, disposes scene resources, removes ticker/ScrollTrigger registrations owned by the scene, and leaves the semantic page mounted. Context restoration does not auto-restart the scene during the same visit.

### Validation strategy

Validation is incremental:

1. Verify React 19 and compatible dependency versions before installing.
2. Add only required frontend dependencies.
3. Run the dev app after each scene milestone and inspect browser console output.
4. Verify StrictMode cleanup, forward/reverse scroll, anchors, history, resize, authentication states, reduced motion, and no-WebGL fallback.
5. Run lint, typecheck, build, and preview.
6. Review at 1440px, 768px, and 390px.
7. Run impeccable critique and polish if installed; otherwise perform the equivalent manual review.
8. Measure Lighthouse mobile only after the browser implementation exists, and record the result rather than promising a score in advance.

The acceptance matrix includes 1440px desktop, 768px tablet, 390px mobile, reduced motion, no WebGL, context loss, StrictMode remount, route away/back, resize after font loading, anchor links, browser history, and keyboard-only navigation. The required evidence includes trigger/ticker counts before and after unmount, arbitrary forward/reverse progress samples, and a claim-to-source checklist.

The user-comprehension review must verify that a first-time visitor can identify what RMS does, who uses it, how QR seating leads to ordering, how kitchen status is connected, and how one session becomes a bill without operating the 3D scene. It must also verify that logged-out and logged-in CTA labels and destinations are understandable.

Security boundary: this landing rebuild preserves the existing `?next=` behavior as requested and does not modify `authRedirect.ts` or authentication routes. The current validator accepts protocol-relative values beginning with `//`, which is a pre-existing open-redirect concern. It is recorded here for separate security remediation and is not considered fixed by this landing work.

## Decision log

1. **R3F-first instead of Spline-first.** Spline-first was rejected because no approved scene URL exists and an arbitrary third-party scene would introduce unknown licensing, visual, loading, and performance risks. R3F provides deterministic camera and object synchronization.
2. **No initial Spline adapter.** The requested hybrid direction is acknowledged, but an adapter without a concrete scene would be YAGNI and could constrain the scene model. Spline can be evaluated later as a separate change.
3. **One master ScrollTrigger timeline.** Independent reveal timelines were rejected because they are not reversible and can drift from the 3D scene. A shared progress source keeps DOM and WebGL synchronized.
4. **Semantic DOM over WebGL text.** Rendering product copy and CTAs inside the canvas was rejected for accessibility, searchability, selection, and reliable interaction.
5. **Procedural geometry first.** Downloaded or generated food assets are deferred until the procedural experience works and any models meet strict size and optimization budgets.
6. **Desktop-first with explicit fallback.** The target is a premium capable-laptop presentation, but no-WebGL, reduced-motion, and lower-end paths remain intentional rather than blank.
7. **Measurable budgets and lifecycle assertions.** Qualitative performance language was insufficient. Explicit payload, triangle, frame-time, capability, and cleanup checks are required before acceptance.
8. **Stable semantic anchors across profiles.** Shortening visual motion must not change the section order, IDs, or accessible product narrative.
9. **Concrete product copy and auth-aware CTAs.** Metaphorical copy, misleading demo payment states, and signup-only product CTAs were rejected. The page must state concrete behavior and route every primary flow according to auth state.

## Risks

- A persistent WebGL canvas may still be expensive on integrated GPUs; budgets, capability checks, and measured frame-time gates must be enforced.
- Lenis, ScrollTrigger, and StrictMode can double-register if cleanup is incomplete.
- Scroll-linked DOM and WebGL states can drift if beat ranges are duplicated instead of shared.
- The requested ₹945 showcase total must remain clearly labeled as demo data if it is not sourced from application data.
- Lighthouse mobile performance may be constrained by the canvas and must be measured rather than assumed.
- A future Spline scene may not fit the established camera, palette, or payload budget and may need to remain excluded after separate review.
- The existing `?next=` validator may allow a protocol-relative open redirect; changing it would exceed the landing-only scope and requires a separate security task.
- If auth resolution is slow, a visually incomplete CTA can confuse visitors; the landing implementation must avoid defaulting to signup while auth is unresolved.

## Implementation handoff

Implementation may begin only after the review disposition is upgraded to APPROVED. The implementation must remain limited to the landing page, its 3D modules, frontend dependency manifest, approved local assets/models, and fonts.

## Multi-agent review disposition

The required sequential review was completed:

- **Skeptic / Challenger:** all blocking objections were accepted and addressed in the design through measurable budgets, lifecycle ownership, deterministic fallback rules, and claim governance. Evidence is still pending implementation.
- **Constraint Guardian:** performance, visibility, context-loss, asset-supply-chain, and reproducibility objections were accepted. The existing protocol-relative `?next=` open redirect was recorded as a separate security task because fixing it would exceed the landing-only scope.
- **User Advocate:** misleading demo payment state, inconsistent CTA destinations, signup wording, false role affordances, and comprehension validation were accepted and incorporated into the design.
- **Integrator / Arbiter:** **REVISE**. The approach is viable, but empirical acceptance evidence does not exist until implementation and browser validation are completed.

The design is therefore not approved for implementation under the brainstorming exit criteria. Required evidence before approval:

1. Production chunk, asset, triangle, frame-time, long-task, and memory measurements.
2. StrictMode, route-navigation, resize, visibility, context-loss, and cleanup diagnostics.
3. No-WebGL, low-end, reduced-motion, mobile, anchor, keyboard, and browser-history validation.
4. Claim-to-source checklist and final copy review, including clearly labeled demo data.
5. User-comprehension review at the required viewport sizes and fallback modes.
