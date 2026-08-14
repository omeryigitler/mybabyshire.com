import React, { useEffect, useState } from 'react';
import { Check, Star, Trash2, Undo2, X } from 'lucide-react';
import { getAdminToken, handleAdminAuthError } from './adminAuth';
import { requestAdminConfirm } from './adminDialogs';
import { PageHeader } from './ui';

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

const statusBadge = (status: string) => {
  if (status === 'approved') return 'bg-green-100 text-green-800';
  if (status === 'rejected') return 'bg-gray-100 text-gray-600';
  return 'bg-amber-100 text-amber-800';
};

const Stars = ({ rating }: { rating: number }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className="h-4 w-4 text-boutique-wood" fill={star <= rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
    ))}
  </span>
);

export const AdminReviews = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReviews = async (status: string) => {
    setLoading(true);
    setError('');
    try {
      const token = getAdminToken();
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const response = await fetch(`/api/admin/reviews${query}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load reviews.');
      setReviews(data);
    } catch (loadError) {
      if (handleAdminAuthError(loadError)) return;
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update review.');
      setReviews((current) => filter && status !== filter ? current.filter((review) => review.id !== id) : current.map((review) => (review.id === id ? { ...review, status } : review)));
    } catch (updateError) {
      if (handleAdminAuthError(updateError)) return;
      setError((updateError as Error).message);
    }
  };

  const deleteReview = async (id: string) => {
    const confirmed = await requestAdminConfirm({
      title: 'Delete this review?',
      message: 'This review will be permanently removed. This action cannot be undone.',
    });
    if (!confirmed) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
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
      <PageHeader eyebrow="Customer voice" icon={Star} title="Reviews" description={<>Approve, reject, or remove customer reviews. Only approved reviews appear on the storefront.{pendingCount > 0 && filter !== 'approved' && filter !== 'rejected' && <span className="ml-1 font-bold text-boutique-brown">{pendingCount} waiting for approval.</span>}</>} />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((option) => <button key={option.value} type="button" onClick={() => setFilter(option.value)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${filter === option.value ? 'bg-boutique-brown text-white shadow-sm' : 'border border-boutique-brown/10 bg-white/80 text-boutique-brown-light hover:bg-[#fffaf3]'}`}>{option.label}</button>)}
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>}

      {loading ? <p className="text-sm text-boutique-brown-light">Loading reviews...</p> : reviews.length === 0 ? <div className="rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-10 text-center text-sm text-boutique-brown-light shadow-sm">No reviews found for this filter.</div> : <div className="space-y-4">
        {reviews.map((review) => <div key={review.id} className="rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-[0_16px_40px_rgba(58,37,26,0.07)] backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><Stars rating={review.rating} /><span className="font-bold text-boutique-brown">{review.authorName}</span><span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${statusBadge(review.status)}`}>{review.status}</span></div><p className="mt-2 text-xs text-boutique-brown-light">On <span className="font-bold text-boutique-brown">{review.productName || 'Unknown product'}</span>{review.authorEmail && <> · {review.authorEmail}</>}{' · '}{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p></div></div>
          {review.title && <p className="mt-3 font-serif text-lg text-boutique-brown">{review.title}</p>}
          {review.body && <p className="mt-2 text-sm leading-relaxed text-boutique-brown-light">{review.body}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {review.status !== 'approved' && <button type="button" onClick={() => updateStatus(review.id, 'approved')} className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700"><Check className="h-4 w-4" /> Approve</button>}
            {review.status !== 'rejected' && <button type="button" onClick={() => updateStatus(review.id, 'rejected')} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/15 bg-white px-4 py-2 text-xs font-bold text-boutique-brown hover:bg-boutique-bg"><X className="h-4 w-4" /> Reject</button>}
            {review.status !== 'pending' && <button type="button" onClick={() => updateStatus(review.id, 'pending')} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/15 bg-white px-4 py-2 text-xs font-bold text-boutique-brown-light hover:bg-boutique-bg"><Undo2 className="h-4 w-4" /> Reset</button>}
            <button type="button" onClick={() => deleteReview(review.id)} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>
          </div>
        </div>)}
      </div>}
    </div>
  );
};
