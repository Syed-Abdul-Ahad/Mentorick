# Mentorick — Agent Context (Read Before Any New Work)

> **Mandatory:** Before starting any new task on this repo, read this file end-to-end.  
> Update this file when architecture or critical flows change.  
> Do **not** treat `server/README.md` as source of truth — it is stale.

**Generated:** 2026-11-13  
**Working branch for current initiative:** `bank-transfer-13-nov` (branched from `main` @ `e8a52e1`)  
**Safety backup:**  
- Folder: `../Mentorick-backup-2026-11-13_e8a52e1`  
- Git branch: `backup/pre-big-change-2026-11-13`

---

## 1. What Mentorick Is

Marketplace for **paid 1:1 video mentorship** (and group “mega sessions”) with:

- Mentees browsing mentors and booking slots  
- Mentors setting availability and pricing  
- Mentees paying Mentorick via **bank transfer + screenshot** (admin verifies)  
- Platform fee **30%**; mentors receive **70%** via **manual offline payout**  
- Sessions held on **Google Meet** (via Google Calendar API), not hosted natively  
- Payment model is shaped for future **PayFast** beside bank transfer (not replacing)  

**Roles:** `mentee` | `mentor` | `admin`

**Product tagline:** *World-class wisdom, Accessibly yours.*

---

## 2. Repo Layout

```
Mentorick/
├── client/          # React 19 + Vite 7 + Redux Toolkit + Tailwind 4
├── server/          # Express 4 + Mongoose 8
├── docs/            # Agent/project docs (this file)
├── jest.config.js   # Jest roots = server/utils/booking only
└── .github/
```

Separate apps (not a monorepo workspace). Run client and server independently.

---

## 3. Architecture Snapshot

```
Browser (Vite SPA)
  └─ httpOnly cookie auth + Redux user mirror
       └─ axios withCredentials → Express /api/*
            ├─ MongoDB (User, Profiles, Booking, Review, GoogleToken)
            ├─ Bank transfer payments (proof upload → admin verify)
            ├─ Google OAuth (login OR calendar — two flows)
            ├─ Resend (transactional email)
            └─ Cloudinary (profile headshots + payment proofs)
```

**Canonical domain entity:** `Booking` (not the unused `Session` model).

---

## 4. Backend Boot & Mounts

| File | Role |
|------|------|
| `server/server.js` | dotenv, DB connect, listen, process error handlers |
| `server/app.js` | middleware + route mounts |
| `server/config/database.js` | Mongo connect; drops legacy review indexes |

**API mounts (`app.js`):**

| Path | Domain |
|------|--------|
| `/health` | Health |
| `/uploads` | Static uploads (+ CORS) |
| `/` | SEO (`robots.txt`, `sitemap.xml`) |
| `/api/auth` | Auth + Google **login** |
| `/api/users` | Users (admin-heavy) |
| `/api/mentor` | Mentor profiles |
| `/api/mentee` | Mentee profiles |
| `/api/mentor/availability` | Availability CRUD + public slots |
| `/api/booking` | 1:1 bookings |
| `/api/mega-sessions` | Mega sessions |
| `/api/payments` | Bank details, proof upload, admin verify/reject |
| `/api/reviews` | Reviews |
| `/auth` | Google **Calendar** OAuth (not under `/api`) |

**Layering:** `routes` → `controllers` → `services` + `utils` → `models`

---

## 5. Data Model (What Matters)

### User (`server/models/User.js`)
- Auth identity: email/password and/or `googleId`
- `role`, `isEmailVerified`, `isActive`, reset-token fields
- JWT via `generateAuthToken()` → `{ id, email, role }`

### MentorProfile
- Pricing: `sessionDurations[{ duration, priceUSD, pricePKR }]`
- `timezone` (default `Asia/Karachi`)
- Nested `availability` (weekly / specificDates / unavailability)
- `averageRating`, `reviewCount`
- **Featured (admin):** `isFeatured` + `featuredAt` — max **10** curated for homepage / Mentors page slider (`GET /api/mentor/profiles?featured=true`; `PATCH /api/mentor/profiles/:id/featured`). Mentors page list below still shows **all** mentors (featured included).

### MenteeProfile
- Lightweight: about, interests, headshot

### Booking (**core**)
- 1:1: `mentor`, `mentee`, times, price, payment, status, meeting
- Mega parent: `isMegaSession`, `participants`, `maxParticipants`, `createdBy`, no mentee required
- Mega child: `parentMegaSession` + paying `mentee`
- `durationMinutes` ∈ {15, 30, 60, 90}
- Status: `pending` | `confirmed` | `completed` | `cancelled` | `no-show`
- Payment nested: see §8 (bank_transfer / future payfast)
- Meeting: Google Meet + `calendarEventId` only after admin verifies payment

### Review
- Mentor + mentee + rating + comment  
- **Not** linked to a Booking (no “must have completed session” gate in schema)

### GoogleToken
- Mentor calendar OAuth tokens only

### Session (`models/Session.js`)
- **Dead / unused.** Do not build on it.

---

## 6. Auth — Why It Is Built This Way

**Design choice:** httpOnly cookie JWT (cross-site friendly with `sameSite: 'none'` + `secure` in production) so SPA never stores tokens in localStorage.

**Client:** Redux holds `user` only; on boot `App.jsx` calls `GET /auth/me` with credentials. Axios uses `withCredentials: true`.

**Two Google OAuth flows (easy to confuse):**

| Purpose | Routes | Redirect env | Scopes |
|---------|--------|--------------|--------|
| Login/signup | `/api/auth/google/login` + callback | `GOOGLE_AUTH_REDIRECT_URI` | openid/email/profile |
| Mentor Calendar | `/auth/google` + callback | `GOOGLE_REDIRECT_URI` | calendar |

Calendar connect is required so booking confirmation can create Meet links on the mentor’s calendar.

**Incomplete:** local email verification is stubbed (token generation commented out in register). Google users are auto-verified. Forgot-password email **is** live via Resend.

---

## 7. Availability Engine — Why This Shape

Location: `server/utils/booking/*` (+ `bookingService.js`)

**Why Luxon + UTC storage:** mentors and mentees are often in different countries; store `startTimeUTC`/`endTimeUTC`, keep `mentorTimezone`/`menteeTimezone` for display.

**Generation idea:**
1. Weekly hours (dayOfWeek 0=Sun…6=Sat) overridden by date-specific hours  
2. Merge contiguous hours → windows  
3. Subtract active bookings (`pending` + `confirmed`)  
4. Emit starts every **15 minutes** for feasible durations the mentor prices  
5. Horizon ≈ **14 days**  
6. Unavailability blackouts remove days (force flag can override conflicts)

**Public API** feeds the booking UI; mentor APIs edit weekly/date/unavailable.

**Note:** `isAvailableForBooking` exists on profile but is **not** enforced in booking validation today.

---

## 8. Booking + Payment Happy Path (1:1)

```
Mentee picks slot (≥24h lead time) on MentorPublicProfile
  → BookingModal createBooking → Booking pending, payment.awaiting_proof
       payment: bank_transfer, amount, platformFee 30%, mentorPayoutAmount 70%, proofDueAt = now+30m
  → UI shows bank details (from env) + countdown
  → POST /api/payments/bookings/:id/proof (Cloudinary screenshot)
       → payment.awaiting_verification + WhatsApp deep-link for mentee
  → Admin POST /api/payments/bookings/:id/verify
       → payment.paid, booking.confirmed
       → Google Calendar event + Meet link
       → Resend confirmation emails
  (If no proof by proofDueAt → expiry job: cancelled + payment.expired, slot frees)
```

**Payment statuses:** `awaiting_proof` | `awaiting_verification` | `paid` | `expired` | `failed` | `rejected`

**Rules:**
- Slot hold: `pending` + `confirmed` block availability; 30m without proof → cancel/expire
- Lead time: session start must be ≥ `BOOKING_MIN_LEAD_HOURS` (default 24)
- Meet link hidden from mentees until `status === confirmed`
- Funds: 100% to Mentorick bank (env); mentor payouts offline
- Reject: admin can reject proof → mentee may re-upload while still pending

**Bank / fee env:** `BANK_*`, `PAYMENT_PROOF_MINUTES`, `BOOKING_MIN_LEAD_HOURS`, `WHATSAPP_SUPPORT_NUMBER`, `PLATFORM_FEE_RATE`

**PayFast-ready:** `provider` enum includes `payfast`; reserved `externalOrderId` / `externalPaymentId` / `metadata` unused now.

**Idempotency:** recreating the exact same mentor/mentee/window returns the existing booking instead of duplicating.

**Expiry:** `paymentExpiryService` interval from `server.js` + lazy expire on availability / create.

**Session completion:** `bookingCompletionService` marks `confirmed` → `completed` when `endTimeUTC < now` (interval + lazy on my-bookings / analytics / mega list / availability). Pending unpaid bookings are never auto-completed.

---

## 9. Mega Sessions Flow

1. **Admin** creates mega session → Booking `isMegaSession`, `pending`  
   - Admin sets **per-mentee seat price** (`priceAmount`) + currency at create time (independent of mentor 1:1 `sessionDurations` pricing).  
   - Duration must still be one the mentor offers (availability). Mentor 1:1 price is UI reference only.  
   - Platform fee split is unchanged (same `PLATFORM_FEE_RATE` / 30–70) on each seat.  
2. **Mentor** accepts → calendar mega event, status `confirmed` (listed publicly)  
3. **Mentee** joins → **child** Booking with `parentMegaSession`, copies parent `price`, same bank-transfer proof path as 1:1  
4. Admin verify on child → Meet/email as for 1:1; child confirmed; participants updated as before  

Reject deletes mega only when safe (no participants/children).  
Price is frozen on the parent at create; there is no post-create price edit.

---

## 10. Email System

| File | Role |
|------|------|
| `server/utils/email.js` | Resend SDK (`resend.emails.send` → `https://api.resend.com/emails`) |

**Live sends:**
- Forgot password (`isForgotPassword`)
- Booking confirmation (`isBookingConfirmation`) after **admin payment verify** (not on booking create)

**Dead code:** OTP HTML template (`isOTP`) — no caller.

**Sender:** `FROM_EMAIL`; key: `RESEND_API_KEY`  
**Logo:** inline CID attachment from `client/public/mentorick-logo.png`  
**Rule:** email failure must **not** fail verify (wrapped in `sendBookingConfirmationEmailsSafely`).

---

## 11. Frontend Architecture

| Concern | Location |
|---------|----------|
| Routes | `client/src/App.jsx` |
| Store | `client/src/store` (`auth` live; `ui` unused) |
| API | `client/src/api/axiosConfig.js`, `services.js` |
| Layout | `MainLayout` + `Sidebar` + `BrandLogo` |
| Booking UI | `components/booking/*` especially `BookingModal.jsx` |
| Bank payment UI | `components/payments/BankTransferPaymentPanel.jsx` |
| Lead time | `client/src/utils/bookingLeadTime.js` |
| SEO | `components/seo/*`, `utils/structuredData.js` |

**Auth gating:** route-level `Navigate` + axios 401 interceptor (public path allowlist).

**Role UX:**
- Mentee: book, bank proof + WhatsApp, mega join, bookings, profile  
- Mentor: availability (`/sessions`), mega approve, 70% earnings display  
- Admin: `/admin/mega-sessions`, `/admin/featured-mentors`, dashboard verification queue (confirm/reject proofs)  

---

## 12. Critical Edge Cases & Known Quirks

Treat these as landmines when changing money/auth/booking code:

1. **Proof expiry vs admin queue:** only `awaiting_proof` expires at 30m; `awaiting_verification` does **not** — admin may take longer; 24h lead time is the runway.  
2. **Meet only on verify:** do not create calendar/Meet on booking create; `verifyPayment` is the confirm path (idempotent if already paid).  
3. **1:1 calendar failure during verify:** booking may still confirm without Meet; repair later — don’t block confirm forever.  
4. **Email verification unfinished** for local signup.  
5. **Reviews not booking-gated** — only daily limit.  
6. **CORS fallback** `A \|\| B` with non-empty `A` makes `B` dead (`app.js`).  
7. **Featured mentors** are admin-curated (`isFeatured`); sliders no longer invent “top-rated” from random/sort alone. Ratings still come from `averageRating`.  
8. **Currency in booking modal often hardcoded USD.**  
9. **`Layout.jsx` dead/broken**; don’t revive without fixing.  
10. **AdminMegaSessions hooks order** risk when non-admin redirects early.  
11. **Google calendar callback** trusts `state` mentorId (unsigned).  
12. Mega mentees appear on parent `participants` only after admin verifies their child booking.

---

## 13. Env Vars (Names Only)

### Server
`NODE_ENV`, `PORT`, `MONGODB_URI`, `MONGODB_TEST_URI`, `JWT_SECRET`, `JWT_EXPIRE`,  
`CLIENT_URL`, `SERVER_URL`,  
`BANK_ACCOUNT_TITLE`, `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_IBAN`, `BANK_BRANCH`,  
`PAYMENT_PROOF_MINUTES`, `BOOKING_MIN_LEAD_HOURS`, `WHATSAPP_SUPPORT_NUMBER`, `PLATFORM_FEE_RATE`,  
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_AUTH_REDIRECT_URI`,  
`CLOUD_NAME`, `API_KEY`, `API_SECRET`, `CLOUDINARY_URL`,  
`REVIEW_DAILY_LIMIT_ENABLED`, `REVIEW_DAILY_LIMIT_MAX`,  
`RESEND_API_KEY`, `FROM_EMAIL`

### Client
`VITE_API_BASE_URL`, `VITE_SITE_URL`

---

## 14. Testing & Scripts

- **Jest:** only `server/utils/booking/__tests__` (availability/overlap engine). No full API e2e suite wired.  
- Scripts: `server/scripts/resetAppData.js`, `repairAvailabilityData.js`  
- **Do not** run production builds (`vite build` / package builds) unless the user explicitly asks.

---

## 15. Engineering Rules for This Repo

1. **Stay on the assigned feature branch** (`bank-transfer-13-nov` unless told otherwise).  
2. **Do not refactor booking/payment flows** unless the task requires it — they are delicate.  
3. Prefer **minimal additive changes**; bank transfer + admin verify is the confirmation/email source of truth (PayFast later beside it).  
4. Never commit secrets (`.env`).  
5. Never modify dependency manifests without explicit user approval.  
6. Do not “clean up” commented-out blocks you didn’t create.  
7. After large changes, update **this** context file.

---

## 16. Where to Look First (Cheat Sheet)

| If the task is about… | Start here |
|-----------------------|------------|
| Auth / cookies / Google login | `authController.js`, `googleAuthController.js`, `middleware/auth.js`, `App.jsx` |
| Availability slots | `server/utils/booking/*`, `availability.controller.js`, `AvailabilityPage` |
| Creating bookings | `bookingService.js`, `booking.controller.js`, `BookingModal.jsx` |
| Payments / fees / confirm | `paymentController.js`, `paymentConfig.js`, `paymentExpiryService.js`, `BankTransferPaymentPanel.jsx` |
| Meet links | `calendar.util.js`, GoogleToken model (created in `verifyPayment`) |
| Emails | `server/utils/email.js` |
| Mega sessions | `megaSessionRoutes.js`, booking controller mega methods, `MegaSessions.jsx`, `AdminMegaSessions.jsx` |
| Profiles / headshots | mentor/mentee profile controllers + Cloudinary middleware |
| Featured mentors | `MentorProfile.isFeatured`, `setMentorFeatured`, `AdminFeaturedMentors.jsx`, Homepage/`Mentors` sliders |
| Reviews | `review.controller.js`, `reviewStatsService.js` |

---

## 17. Current Initiative Notes

- Branch: **`bank-transfer-13-nov`**  
- **Done:** PayPal removed; bank transfer + screenshot + admin verify; 30m proof window; 24h lead time; WhatsApp CTA; Meet/email on verify; dashboards show 80/20; PayFast-ready payment shape.  
- Baseline includes booking confirmation emails (now triggered on admin verify).  
- Full folder backup exists before this initiative — prefer git + backup over destructive resets.

---

*End of agent context. Prefer re-reading this file at the start of each new work request.*
