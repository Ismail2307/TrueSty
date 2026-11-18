import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeProblemAndMasters, DEMO_BOOKINGS, DEMO_REVIEWS, DEMO_MASTERS } from './data.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TrueSty Clean API' });
});

// 2. AI Diagnosis + Market Price Comparison + Master Matching
app.post('/api/diagnose', async (req, res) => {
  try {
    const { problem, city = 'Tashkent' } = req.body;
    if (!problem || !problem.trim()) {
      return res.status(400).json({ error: 'Please describe your problem.' });
    }

    const analysis = analyzeProblemAndMasters(problem, city);

    // Optional LLM enhancement if GROQ_API_KEY or GEMINI_API_KEY is configured
    let aiExplanation = `Based on your problem ("${problem}"), you should call a **${analysis.recommended_master_type}**. In ${city}, the average market price is **${analysis.market_summary.average_price.toLocaleString()} UZS** (ranging from ${analysis.market_summary.min_price.toLocaleString()} to ${analysis.market_summary.max_price.toLocaleString()} UZS).`;

    if (process.env.GROQ_API_KEY) {
      try {
        const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: 'You are TrueSty AI. First clearly state what kind of master the client needs to call, then summarize the market price comparison concisely and transparently. Reply in the same language as the user.'
              },
              {
                role: 'user',
                content: `Client problem: "${problem}". Recommended master type: ${analysis.recommended_master_type}. Market average: ${analysis.market_summary.average_price} UZS (min ${analysis.market_summary.min_price}, max ${analysis.market_summary.max_price}). Masters available: ${analysis.masters.map(m => `${m.name} (${m.price} UZS, rating ${m.rating})`).join(', ')}.`
              }
            ],
            temperature: 0.3,
          }),
        });
        if (llmRes.ok) {
          const data = await llmRes.json();
          if (data.choices?.[0]?.message?.content) {
            aiExplanation = data.choices[0].message.content;
          }
        }
      } catch (e) {
        console.warn('LLM fallback to deterministic summary:', e.message);
      }
    }

    res.json({
      ai_advice: aiExplanation,
      ...analysis,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Payment & Escrow Booking Creation
app.post('/api/bookings', (req, res) => {
  const { client_id = 'guest_client', master_id, service_name, quoted_price } = req.body;
  const master = DEMO_MASTERS.find((m) => m.id === master_id);
  if (!master) {
    return res.status(404).json({ error: 'Master not found' });
  }

  const booking = {
    id: 'bk_' + Date.now(),
    client_id,
    master_id,
    master_name: master.name,
    service_name: service_name || master.specialty,
    quoted_price: Number(quoted_price || master.price),
    payment_status: 'pending',
    booking_status: 'requested',
    created_at: new Date().toISOString(),
  };

  DEMO_BOOKINGS.push(booking);
  res.json({ booking });
});

// 4. Confirm Payment (Escrow Release / Payment Webhook Simulation)
app.post('/api/bookings/:id/pay', (req, res) => {
  const booking = DEMO_BOOKINGS.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  booking.payment_status = 'paid';
  booking.booking_status = 'completed';
  res.json({ success: true, booking });
});

// 5. Get Client Bookings
app.get('/api/bookings', (req, res) => {
  res.json({ bookings: DEMO_BOOKINGS });
});

// 6. Verified-Payer-Only Review Submission
app.post('/api/reviews', (req, res) => {
  const { booking_id, rating, comment, client_name = 'Verified Client' } = req.body;
  const booking = DEMO_BOOKINGS.find((b) => b.id === booking_id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }
  if (booking.payment_status !== 'paid') {
    return res.status(403).json({
      error: 'Only clients who have completed and paid for the service can leave a review.',
    });
  }
  if (DEMO_REVIEWS.some((r) => r.booking_id === booking_id)) {
    return res.status(400).json({ error: 'You have already reviewed this paid booking.' });
  }

  const review = {
    id: 'rev_' + Date.now(),
    booking_id,
    master_id: booking.master_id,
    client_name,
    rating: Number(rating),
    comment,
    verified_payment: true,
    created_at: new Date().toISOString().split('T')[0],
  };

  DEMO_REVIEWS.unshift(review);
  res.json({ success: true, review });
});

app.get('/api/reviews', (req, res) => {
  res.json({ reviews: DEMO_REVIEWS });
});

app.listen(PORT, () => {
  console.log(`TrueSty Clean Server running on http://localhost:${PORT}`);
});
