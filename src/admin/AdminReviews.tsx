import React, { useEffect, useState } from 'react';
import { Check, RefreshCcw, Star, Trash2, Undo2, X } from 'lucide-react';
import { getAdminToken, handleAdminAuthError } from './adminAuth';
import { requestAdminConfirm } from './adminDialogs';

type AdminReview = {
  id: string;
  productId: string;
  productName: string | null;
  productSlug: string | null;
  authorName: string;
  authorEmail: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  createdAt: string;
};

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusBadge = (status: string) => status === 'approved'
  ? 'bg-[#eaf5ee] text-[#316942]'
  : status === 'rejected'
    ? 'bg-[#f1f1f1] text-[#666]'
    : 'bg-[#fff3d9] text-[#8a641e]';

const Stars = ({ rating }: { rating: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 text-[#202020]" fill={star <= rating ? 'currentColor' : 'none'} strokeWidth={1.5} />)}
  </span>
);

export const AdminReviews = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReviews = async (status = filter) => {
    setLoading(true);
    setError('');
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const response = await fetch(`/api/admin/reviews${query}`, { headers: { Authorization: `Bearer ${getAdminToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load reviews.');
      setReviews(Array.isArray(data) ? data : []);
    } catch (loadError) {
      if (handleAdminAuthError(loadError)) return;
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReviews(filter); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    setError('');
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update review.');
      setReviews((current) => filter && status !== filter ? current.filter((review) => review.id !== id) : current.map((review) => review.id === id ? { ...review, status } : review));
    } catch (updateError) {
      if (handleAdminAuthError(updateError)) return;
      setError((updateError as Error).message);
    }
  };

  const deleteReview = async (id: string) => {
    const confirmed = await requestAdminConfirm({ title: 'Delete this review?', message: 'This review will be permanently removed. This action cannot be undone.' });
    if (!confirmed) return;
    setError('');
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getAdminToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete review.');
      setReviews((current) => current.filter((review) => review.id !== id));
    } catch (deleteError) {
      if (handleAdminAuthError(deleteError)) return;
      setError((deleteError as Error).message);
    }
  };

  const pendingCount = reviews.filter((review) => review.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Content</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em] text-[#202020]">Reviews</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Moderate customer reviews. Only approved reviews are visible on the storefront.</p>
        </div>
        <button type="button" onClick={() => void loadReviews()} disabled={loading} className="commerce-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-semibold hover:bg-[#f7f7f7] disabled:opacity-50"><RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((option) => <button key={option.value} type="button" onClick={() => setFilter(option.value)} className={`commerce-focus rounded-full border px-4 py-2 text-xs font-semibold ${filter === option.value ? 'border-[#202020] bg-[#202020] text-white' : 'border-[#dedede] bg-white hover:border-[#aaa]'}`}>{option.label}{option.value === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}</button>)}
      </div>

      {error && <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {loading ? <div className="rounded-[12px] border border-[#e3e3e3] bg-white p-10 text-center text-sm text-[#777]">Loading reviews...</div> : reviews.length === 0 ? <div className="rounded-[12px] border border-[#e3e3e3] bg-white p-10 text-center text-sm text-[#777]">No reviews found for this filter.</div> : <div className="space-y-3">
        {reviews.map((review) => <article key={review.id} className="rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3"><Stars rating={review.rating} /><span className="font-semibold">{review.authorName}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${statusBadge(review.status)}`}>{review.status}</span></div>
              <p className="mt-2 text-xs leading-5 text-[#777]">{review.productName || 'Unknown product'} · {review.authorEmail || 'No email'} · {new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {review.title && <h2 className="mt-4 text-base font-semibold">{review.title}</h2>}
          {review.body && <p className="mt-2 text-sm leading-6 text-[#666]">{review.body}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {review.status !== 'approved' && <button type="button" onClick={() => void updateStatus(review.id, 'approved')} className="commerce-focus inline-flex items-center gap-2 rounded-[8px] bg-[#202020] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#383838]"><Check className="h-4 w-4" /> Approve</button>}
            {review.status !== 'rejected' && <button type="button" onClick={() => void updateStatus(review.id, 'rejected')} className="commerce-focus inline-flex items-center gap-2 rounded-[8px] border border-[#dedede] bg-white px-3.5 py-2.5 text-xs font-semibold hover:bg-[#f7f7f7]"><X className="h-4 w-4" /> Reject</button>}
            {review.status !== 'pending' && <button type="button" onClick={() => void updateStatus(review.id, 'pending')} className="commerce-focus inline-flex items-center gap-2 rounded-[8px] border border-[#dedede] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#666] hover:bg-[#f7f7f7]"><Undo2 className="h-4 w-4" /> Reset</button>}
            <button type="button" onClick={() => void deleteReview(review.id)} className="commerce-focus inline-flex items-center gap-2 rounded-[8px] border border-red-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>
          </div>
        </article>)}
      </div>}
    </div>
  );
};
