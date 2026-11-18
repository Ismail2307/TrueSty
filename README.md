# TrueSty — Clean Architecture v2.0

## Features
1. **AI Problem Diagnosis**: Identifies which specialist/master the client needs to call based on their problem description.
2. **Transparent Price Comparison**: Lists matching masters with individual quotes alongside the market average, lowest, and highest prices.
3. **Secure Payment Integration**: Built-in booking & payment confirmation flow (`/api/bookings` & `/api/bookings/:id/pay`).
4. **Verified-Payer-Only Reviews**: Reviews are strictly blocked unless the client has a paid booking record (`payment_status === 'paid'`).

## Quick Start
1. `npm install`
2. Copy `.env.example` to `.env` and optionally add `GROQ_API_KEY` and Supabase credentials (runs out-of-the-box in demo mode without keys).
3. Run `npm run dev:all` and open `http://localhost:5173`.
