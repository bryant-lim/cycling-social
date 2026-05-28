# Domestique Index

**Domestique Index** is a responsive web application built using Next.js and Supabase, designed specifically for road cyclists. The app enables riders to declare their pre-ride intensity intentions, confess their post-ride outcomes, unlock achievements, track their public trust score, and export shareable shame metrics for social media.

---

## Key Features

1. **Pre-Ride Declarations**: Declare your planned ride title, intensity targets (Chill, Tempo, Hard, Race), backlog date/time, notes, and a toggle for Coffee/Croissant spins.
2. **Post-Ride Confessions**: Submit your actual outcomes (Stayed Chill, Got Spicy, Everyone Attacked, I Lied) and post-ride summary confessions.
3. **Circular SVG Trust Dial**: A dynamic glowing progress circle widget representing the rider's active trust rating (0–100%) mapped directly from intention consistency.
4. **Unlocked Badges Grid Locker**: Collect and unlock custom funny cycling badges (Trustworthy Cyclist 😌, Certified Liar 🤥, Zone 2 Criminal 🚓, Coffee Ride Assassin 🥷, Chaos Rider 🌀, Sandbagger 🎒) based on logged outcomes.
5. **Ride History Deletion & Recalculation**: Safely delete ride entries (for both in-progress and completed sessions) with real-time chronological recomputations of your active trust score and badge collection to prevent data drift.
6. **Instagram Story Card Exports**: Export beautiful 9:16 vertical PNG layouts of either your overall Shame Profile or individual Ride Confessions with centered text alignments and zero domain watermarks.
7. **Offline Demo Mode**: Interactive offline sandbox environment using `localStorage` persistence to simulate complete features when Supabase credentials are not configured.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Vanilla CSS with Tailwind CSS configurations
- **Icons**: Lucide React
- **Database / Auth**: Supabase (PostgreSQL & Googe OAuth)
- **Canvas Rendering**: `html-to-image` client-side serializer

---

## Setup & Local Development

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/bryant-lim/cycling-social.git
cd cycling-social
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory and append your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

*Note: If these keys are left empty or omitted, the application automatically boots into the persistent **Demo Mode Sandbox**.*

### 3. Database Schema Setup

Copy the contents of the `schema.sql` file and execute it in your Supabase project's **SQL Editor** to construct the public tables, Google Auth sync triggers, and default seeds:
- `public.users` table
- `public.rides` table
- `public.user_badges` table
- `public.badges` seed data

### 4. Enable RLS Deletion Policies

Ensure that the Row Level Security (RLS) delete policies are executed in your Supabase SQL Editor to authorize deleting rides and recalculating credentials:

```sql
create policy "Users can delete their own rides"
  on public.rides for delete
  using (auth.uid() = user_id);

create policy "Users can delete their own earned badges"
  on public.user_badges for delete
  using (auth.uid() = user_id);
```

### 5. Running the Application

Start the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Building for Production

Compile and validate the static and dynamic module routes:

```bash
npm run build
```

---

## License

This project is open-source and available under the MIT License.
