import React, { useState, useEffect } from 'react';

export default function App() {
  const [problem, setProblem] = useState('');
  const [city, setCity] = useState('Tashkent');
  const [loading, setLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeBookingForReview, setActiveBookingForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const fetchBookingsAndReviews = async () => {
    try {
      const [bRes, rRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/reviews'),
      ]);
      if (bRes.ok) setBookings((await bRes.json()).bookings || []);
      if (rRes.ok) setReviews((await rRes.json()).reviews || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBookingsAndReviews();
  }, []);

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!problem.trim()) return;
    setLoading(true);
    setStatusMessage('');
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, city }),
      });
      const data = await res.json();
      setDiagnosisResult(data);
    } catch (err) {
      setStatusMessage('Error connecting to AI server.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAndPay = async (master) => {
    setStatusMessage('');
    try {
      // Step 1: Create Booking
      const createRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          master_id: master.id,
          service_name: master.specialty,
          quoted_price: master.price,
        }),
      });
      const { booking } = await createRes.json();

      // Step 2: Process Secure Payment (Escrow)
      const payRes = await fetch(`/api/bookings/${booking.id}/pay`, {
        method: 'POST',
      });
      if (payRes.ok) {
        setStatusMessage(`Payment of ${master.price.toLocaleString()} UZS completed for ${master.name}! Verified review unlocked.`);
        await fetchBookingsAndReviews();
      }
    } catch (err) {
      setStatusMessage('Payment failed. Please try again.');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!activeBookingForReview) return;
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: activeBookingForReview.id,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage(data.error || 'Could not post review.');
      } else {
        setStatusMessage('Thank you! Your verified-payer review has been published.');
        setActiveBookingForReview(null);
        setComment('');
        await fetchBookingsAndReviews();
      }
    } catch (err) {
      setStatusMessage('Error submitting review.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white font-bold flex items-center justify-center">
              T
            </div>
            <span className="font-extrabold text-xl tracking-tight">TrueSty</span>
          </div>
          <span className="text-xs font-medium bg-brand-50 text-brand-700 px-3 py-1 rounded-full">
            100% Transparent Prices & Verified Reviews
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-10">
        {/* Hero / AI Problem Input */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Describe your problem. AI finds the right master & fair market price.
          </h1>
          <p className="text-slate-600 mb-6">
            No hidden fees. Compare every master’s price against the real market average, pay securely, and leave verified reviews.
          </p>

          <form onSubmit={handleDiagnose} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g., My washing machine is leaking water and won't spin..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 bg-white text-slate-700 font-medium"
            >
              <option value="Tashkent">Tashkent</option>
              <option value="Samarkand">Samarkand</option>
              <option value="Bukhara">Bukhara</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Find Master & Compare Prices'}
            </button>
          </form>

          {statusMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              {statusMessage}
            </div>
          )}
        </section>

        {/* AI Diagnosis & Market Price Comparison */}
        {diagnosisResult && (
          <section className="space-y-6">
            {/* Step 1: AI Master Recommendation & Market Benchmark */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-brand-600">
                    Step 1: AI Diagnosis
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">
                    Call a: {diagnosisResult.recommended_master_type}
                  </h2>
                </div>
                <div className="bg-slate-100 px-4 py-2 rounded-xl text-right">
                  <div className="text-xs text-slate-500">Market Average Price</div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {diagnosisResult.market_summary.average_price.toLocaleString()} UZS
                  </div>
                </div>
              </div>

              <p className="text-slate-700 leading-relaxed mb-4">
                {diagnosisResult.ai_advice}
              </p>

              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-center">
                <div>
                  <div className="text-xs text-slate-500">Lowest Price</div>
                  <div className="font-bold text-emerald-600">
                    {diagnosisResult.market_summary.min_price.toLocaleString()} UZS
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Market Average</div>
                  <div className="font-bold text-slate-900">
                    {diagnosisResult.market_summary.average_price.toLocaleString()} UZS
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Highest Price</div>
                  <div className="font-bold text-amber-600">
                    {diagnosisResult.market_summary.max_price.toLocaleString()} UZS
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Master Price Comparison Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  Step 2: Compare Verified Masters & Pay Securely
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {diagnosisResult.masters.map((m) => {
                  const diff = m.price - diagnosisResult.market_summary.average_price;
                  const isBelowAvg = diff <= 0;
                  return (
                    <div
                      key={m.id}
                      className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-slate-900">{m.name}</span>
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                            ★ {m.rating} ({m.completed_jobs} jobs)
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{m.specialty} • {m.city}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-extrabold text-slate-900">
                            {m.price.toLocaleString()} UZS
                          </div>
                          <div className={`text-xs font-medium ${isBelowAvg ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {isBelowAvg
                              ? `${Math.abs(diff).toLocaleString()} UZS below avg`
                              : `${diff.toLocaleString()} UZS above avg`}
                          </div>
                        </div>

                        <button
                          onClick={() => handleBookAndPay(m)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                        >
                          Hire & Pay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Your Paid Bookings & Verified Review Unlock */}
        {bookings.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Your Bookings & Payment Status
            </h3>
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200"
                >
                  <div>
                    <div className="font-bold text-slate-900">{b.master_name} — {b.service_name}</div>
                    <div className="text-sm text-slate-500">
                      Amount: {b.quoted_price.toLocaleString()} UZS • Payment:{' '}
                      <span className="uppercase font-semibold text-emerald-600">{b.payment_status}</span>
                    </div>
                  </div>
                  {b.payment_status === 'paid' && (
                    <button
                      onClick={() => setActiveBookingForReview(b)}
                      className="text-sm font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 px-4 py-2 rounded-lg"
                    >
                      Leave Verified Review
                    </button>
                  )}
                </div>
              ))}
            </div>

            {activeBookingForReview && (
              <form onSubmit={handleSubmitReview} className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900">
                  Reviewing {activeBookingForReview.master_name} (Verified Payer)
                </h4>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Rating (1–5):</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share honest feedback about service quality and punctuality..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                  >
                    Publish Verified Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBookingForReview(null)}
                    className="text-slate-600 px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Verified Reviews Feed */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Verified Client Reviews (100% Paid Services Only)
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{r.client_name}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    ✓ Verified Payment
                  </span>
                </div>
                <div className="text-amber-500 text-sm mb-2">{'★'.repeat(r.rating)}</div>
                <p className="text-sm text-slate-700">{r.comment}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
