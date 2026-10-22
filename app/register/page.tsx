'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    businessName: '',
    subdomain: '',
    whatsappNumber: '',
    ownerMomoNumber: '',
    ownerMomoNetwork: 'MTN',
    referralCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/vendors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      router.push('/');
    } catch (err) {
      setError('Network error. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F7F3] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-[#d5e2da]">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#0B2E21]">Register your shop</h1>
          <p className="text-[#4b5f55] mt-2">Get your shop online by lunchtime</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0B2E21] mb-1">Business name</label>
            <input
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              required
              className="w-full border border-[#d5e2da] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFC83D]"
              placeholder="Mama Jollof"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0B2E21] mb-1">Shop link</label>
            <div className="flex">
              <input
                name="subdomain"
                value={form.subdomain}
                onChange={handleChange}
                required
                className="flex-1 border border-[#d5e2da] rounded-l-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFC83D]"
                placeholder="mamajollof"
              />
              <span className="bg-[#F2F7F3] border border-l-0 border-[#d5e2da] rounded-r-xl px-4 py-3 text-sm text-[#4b5f55] flex items-center">
                .seepay.shop
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0B2E21] mb-1">WhatsApp number</label>
            <input
              name="whatsappNumber"
              value={form.whatsappNumber}
              onChange={handleChange}
              required
              className="w-full border border-[#d5e2da] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFC83D]"
              placeholder="0241234567"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0B2E21] mb-1">MoMo number</label>
            <input
              name="ownerMomoNumber"
              value={form.ownerMomoNumber}
              onChange={handleChange}
              required
              className="w-full border border-[#d5e2da] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFC83D]"
              placeholder="0241234567"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0B2E21] mb-1">MoMo network</label>
            <select
              name="ownerMomoNetwork"
              value={form.ownerMomoNetwork}
              onChange={handleChange}
              className="w-full border border-[#d5e2da] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFC83D]"
            >
              <option>MTN</option>
              <option>VODAFONE</option>
              <option>AIRTELTIGO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0B2E21] mb-1">Referral code (optional)</label>
            <input
              name="referralCode"
              value={form.referralCode}
              onChange={handleChange}
              className="w-full border border-[#d5e2da] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFC83D]"
              placeholder="AGENT01"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B2E21] text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-[#14543f] disabled:opacity-60 transition"
          >
            {loading ? 'Creating your shop...' : 'Create my shop'}
          </button>
        </form>

        <p className="text-center text-sm text-[#4b5f55] mt-6">
          Already have a shop? <a href="/" className="text-[#0B2E21] font-semibold underline">Go home</a>
        </p>
      </div>
    </div>
  );
}