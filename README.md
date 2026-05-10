# NextTutor

A modern, full-stack tutor discovery platform built with **Next.js 16**, **Supabase**, and **Google Maps**. Students find verified tutors nearby, book sessions, leave reviews, and manage everything from a clean dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostGIS-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

- **Auth** -- Magic link and phone OTP via Supabase Auth
- **Profiles** -- Separate tutor and student profiles with rich detail
- **Discovery** -- Search tutors by subject, location, rating, and price
- **Location** -- Google Places autocomplete, geocoding, distance-based search, interactive maps with service radius
- **Sessions** -- Request, accept/decline, start, complete, cancel -- full lifecycle
- **Reviews** -- Star ratings, text reviews with profanity filter, helpful votes
- **Dashboard** -- Role-specific stats, activity feed, clickable navigation
- **Security** -- Row-level security (RLS) policies on every table
- **Responsive** -- Mobile-first design with sidebar and bottom nav

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth (magic link + OTP) |
| Maps | Google Maps JavaScript API |
| Styling | Tailwind CSS 4 + custom design system |
| Deployment | Vercel (recommended) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google Cloud](https://console.cloud.google.com) project with Maps JavaScript API, Places API, and Geocoding API enabled

### Installation

```bash
git clone https://github.com/aditya-gupta-me/NextTutor.git
cd NextTutor
npm install
cp .env.example .env.local
```
