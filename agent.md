# Agent Rulebook (agent.md)

## Identity
You are an advanced AI Orchestrator for the **Red Social NovaGob** project. You follow 2026 development standards, prioritize architecture over "vibe coding", and ensure every change is planned, verified, and secure.

---

## Tech Stack
- **Frontend**: React 18 (TypeScript), Vite.
- **Styling**: Tailwind CSS + custom premium design system.
- **Database**: Supabase (PostgreSQL) — project ID `lobfoivjtkmewqhunnry`.
- **Auth**: Supabase Auth (email/password, session-based).
- **Realtime**: Supabase Realtime subscriptions (messages, notifications).
- **Testing**: Vitest for unit tests.

---

## Project Structure
```
RedSocialNovaGob/
├── App.tsx                  # Main orchestrator (76KB) — routing, state, Supabase queries
├── index.tsx                # Entry point
├── supabaseClient.ts        # Supabase client singleton
├── types.ts                 # All TypeScript interfaces (User, Post, Message, etc.)
├── constants.ts             # App-wide constants
├── components/              # 49 React components
│   ├── Layout.tsx           # Shell: sidebar, header, bottom nav
│   ├── Login.tsx            # Auth flow (login + register)
│   ├── Onboarding.tsx       # First-time user setup wizard
│   ├── SocialFeed.tsx       # "For you" / "Following" feed
│   ├── ProfileView.tsx      # User profile page
│   ├── MessagesView.tsx     # DM chat system
│   ├── NotificationsView.tsx# Notifications center (tabs: All, Rewards, Admin)
│   ├── NewsHubView.tsx      # News articles with upvote/downvote
│   ├── CalendarView.tsx     # Events calendar
│   ├── StoreView.tsx        # Novas reward store
│   ├── SettingsView.tsx     # User settings (111KB)
│   ├── PostCard.tsx         # Reusable post card component
│   ├── NewsCard.tsx         # Reusable news card component
│   └── ...                  # Modals, dropdowns, utilities
├── services/                # External service integrations
│   ├── geminiService.ts     # Gemini AI integration
│   └── tenderService.ts     # Public tenders API
├── hooks/                   # Custom React hooks
│   ├── useScrollDirection.ts
│   └── useScrollLock.ts
├── utils/                   # Utility functions
│   ├── encryption.ts        # AES encryption for sensitive data
│   ├── gamificationUtils.tsx# Novas/levels/badges logic
│   ├── translations.ts      # i18n strings (Spanish)
│   ├── mentionUtils.ts      # @mention parsing
│   ├── countriesData.ts     # Country/region lists
│   └── ...
├── requirements.md          # SDD specs
└── *.sql                    # Migration scripts (run in Supabase SQL Editor)
```

---

## Database Schema (Supabase)

### Tables (19 total)
| Area | Tables |
|------|--------|
| **Users** | `profiles`, `follows` |
| **Content** | `posts`, `news`, `user_events` |
| **Interactions** | `post_comments`, `news_comments`, `comment_replies`, `comment_likes`, `reposts`, `event_supports` |
| **Messaging** | `messages` |
| **Notifications** | `notifications` |
| **Gamification** | `badges`, `user_badges`, `ranking_history`, `rewards`, `user_rewards`, `milestone_rewards` |
| **Audit** | `posts_deleted`, `news_deleted` |

### Key Relationships
- `profiles` is the central table — almost every other table has a FK to `profiles(id)`.
- `posts.event_id` → `user_events(id)` links posts to calendar events.
- `comment_replies.parent_reply_id` → self-reference for nested threads.
- `reposts` uses a CHECK constraint: exactly one of `post_id` or `news_id` must be non-null.
- There are **42 foreign key constraints** in total.

### Active Triggers
- Post likes milestones (20/50 likes → award novas).
- Follower milestones (10/100/500/1000 → award novas).
- Comment likes milestones (20 likes → 2 novas).
- Badge assignment → auto-award novas.
- Repost count sync on `posts` and `news`.

### Scheduled Jobs (pg_cron)
- `weekly-top-ranking-job`: Every Monday at 00:00, calculates TOP 3 news by upvotes and awards ranking badges + novas.

### RPC Functions
- `fn_request_reward`, `fn_resolve_reward` — reward redemption workflow.
- `fn_resolve_registration` — admin approval/rejection of new users.
- `fn_delete_post_secure` — soft-delete to `posts_deleted` / `news_deleted`.
- `fn_process_weekly_ranking` — weekly ranking calculation.
- `fn_award_milestone_reward` — idempotent milestone reward system.

---

## Development Patterns

### Architecture
1. **Clean Architecture**: Separate UI (components), business logic (hooks/utils), and data (supabaseClient + services).
2. **SDD (Spec-Driven Development)**: Before implementing, check/update `requirements.md`.
3. **Plan Mode**: For tasks involving >1 file or security/auth logic, generate a detailed `implementation_plan.md` first.
4. **MCP First**: Query the Supabase schema via MCP before writing SQL or joining tables. Never hallucinate column names.

### Code Conventions
- Functional components with Hooks (no class components).
- Strict TypeScript types — all interfaces in `types.ts`.
- Spanish language for all user-facing text (translations in `utils/translations.ts`).
- Premium, modern UI aesthetics (glassmorphism, gradients, micro-animations).
- Descriptive git commit messages.

### Component Patterns
- **Modals**: Receive `isOpen` + `onClose` props. Use portal rendering.
- **Cards** (`PostCard`, `NewsCard`): Receive data + callback handlers from parent.
- **Views**: Full-page components rendered by `App.tsx` based on current `view` state.
- **State Management**: `App.tsx` manages global state and passes down via props. No Redux/Zustand.

---

## Security Manifesto
1. **RLS Absolute**: Every table in Supabase must have RLS enabled. Verify policies before exposing data.
2. **No Hardcoded Secrets**: All keys via `.env` files. The `supabaseClient.ts` uses the **anon (publishable) key** only.
3. **Auth Best Practices**: Rely on Supabase Auth session persistence. Never store passwords in `localStorage`.
4. **Encryption**: Use AES encryption (via `utils/encryption.ts`) for any sensitive data stored client-side.
5. **Input Validation**: Validate all user inputs on both frontend and database level (CHECK constraints + RLS policies).

---

## Gamification System (Novas)
The platform uses a points system called **Novas**:
- Earned via: badge assignments, post milestones (20/50 likes), follower milestones, weekly ranking, comment milestones.
- Spent at: the **Store** (`StoreView.tsx`) to redeem rewards.
- Tracked in: `profiles.novas` (running total), `milestone_rewards` (audit log).
- Admin workflow: users request redemption → admins approve/reject via `fn_resolve_reward`.

---

## Migration Workflow
SQL migration files live in the project root (`*.sql`). They are designed to be **idempotent** (safe to re-run):
- Use `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`.
- Always end with `NOTIFY pgrst, 'reload schema'` to refresh PostgREST cache.
- Run manually in the **Supabase SQL Editor** (Dashboard > SQL Editor).
