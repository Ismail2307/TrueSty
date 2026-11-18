// Clean single source of truth (Demo fallback + Supabase support)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const DEMO_MASTERS = [
  { id: 'm1', name: 'Rustam Karimov', specialty: 'Appliance & Washing Machine Repair', category: 'Appliances', city: 'Tashkent', price: 150000, rating: 4.9, completed_jobs: 142, verified: true },
  { id: 'm2', name: 'Azizbek Tursunov', specialty: 'Appliance & Washing Machine Repair', category: 'Appliances', city: 'Tashkent', price: 120000, rating: 4.7, completed_jobs: 98, verified: true },
  { id: 'm3', name: 'Dilshod Mirzayev', specialty: 'Appliance & Washing Machine Repair', category: 'Appliances', city: 'Tashkent', price: 185000, rating: 5.0, completed_jobs: 215, verified: true },
  { id: 'm4', name: 'Sardor Alimov', specialty: 'Master Plumber & Leak Specialist', category: 'Plumbing', city: 'Tashkent', price: 110000, rating: 4.8, completed_jobs: 176, verified: true },
  { id: 'm5', name: 'Bobur Khasanov', specialty: 'Master Plumber & Leak Specialist', category: 'Plumbing', city: 'Tashkent', price: 140000, rating: 4.9, completed_jobs: 130, verified: true },
  { id: 'm6', name: 'Otabek Rakhimov', specialty: 'Certified Electrician', category: 'Electrical', city: 'Tashkent', price: 130000, rating: 4.8, completed_jobs: 164, verified: true },
  { id: 'm7', name: 'Jamshid Yusupov', specialty: 'Certified Electrician', category: 'Electrical', city: 'Tashkent', price: 160000, rating: 4.9, completed_jobs: 190, verified: true },
  { id: 'm8', name: 'Timur Abdullayev', specialty: 'AC & Climate Technician', category: 'HVAC', city: 'Tashkent', price: 220000, rating: 4.9, completed_jobs: 112, verified: true },
  { id: 'm9', name: 'Farrukh Nazarov', specialty: 'AC & Climate Technician', category: 'HVAC', city: 'Tashkent', price: 195000, rating: 4.6, completed_jobs: 84, verified: true },
];

export const DEMO_BOOKINGS = [];
export const DEMO_REVIEWS = [
  { id: 'r1', master_id: 'm1', client_name: 'Malika S.', rating: 5, comment: 'Fixed our leaking washing machine pump in 40 minutes. Fair price!', verified_payment: true, created_at: '2026-10-12' },
  { id: 'r2', master_id: 'm3', client_name: 'Jasur K.', rating: 5, comment: 'Very professional, explained everything clearly before starting.', verified_payment: true, created_at: '2026-11-01' },
];

export function analyzeProblemAndMasters(problemText, city = 'Tashkent') {
  const q = (problemText || '').toLowerCase();
  let category = 'Plumbing';
  let recommendedMasterType = 'Master Plumber';

  if (q.includes('wash') || q.includes('стирал') || q.includes('machine') || q.includes('fridge') || q.includes('холод')) {
    category = 'Appliances';
    recommendedMasterType = 'Appliance Repair Specialist';
  } else if (q.includes('wire') || q.includes('light') || q.includes('socket') || q.includes('электр') || q.includes('свет') || q.includes('розет')) {
    category = 'Electrical';
    recommendedMasterType = 'Certified Electrician';
  } else if (q.includes('ac') || q.includes('air') || q.includes('conditioner') || q.includes('кондиц') || q.includes('охлаж')) {
    category = 'HVAC';
    recommendedMasterType = 'HVAC / Air Conditioning Technician';
  }

  const matched = DEMO_MASTERS.filter(
    (m) => m.category === category && m.city.toLowerCase() === city.toLowerCase()
  ).sort((a, b) => a.price - b.price);

  const fallbackList = matched.length ? matched : DEMO_MASTERS.slice(0, 3);
  const prices = fallbackList.map((m) => m.price);
  const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    recommended_master_type: recommendedMasterType,
    category,
    city,
    market_summary: {
      average_price: avgPrice,
      min_price: minPrice,
      max_price: maxPrice,
      currency: 'UZS',
      sample_count: fallbackList.length,
    },
    masters: fallbackList,
  };
}
