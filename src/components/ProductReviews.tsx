import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { StarRating, StarRatingInput } from './StarRating';

type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
};

type ReviewSummary = { average: number; count: number };

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
};

export function ProductReviews({ slug, productId }: { slug: string; productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews`);
      if (!response.ok) throw new Error('Failed to load reviews');
      const data = await response.json();
      setReviews(data.reviews || []);
      setSummary(data.summary || { average: 0, count: 0 });
    } catch {
      setReviews([]);
      setSummary({ average: 0, count: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (rating < 1) {
      setError('Please choose a star rating.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, slug, name: name.trim(), email: email.trim(), rating, title: title.trim(), body: body.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not submit your review.');

      setFeedback(data.message || 'Thank you! Your review was submitted.');
      setShowForm(false);
      setRating(0);
      setName('');
      setEmail('');
      setTitle('');
      setBody('');
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative z-10 mt-10 overflow-hidden rounded-[2.2rem] border border-[#e4e4e4] bg-white/75 p-7 shadow-sm backdrop-blur-sm md:p-10">
      <div className="flex flex-col gap-4 border-b border-[#e4e4e4] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-sans text-3xl text-[#202020]">Customer Reviews</h2>
          {summary.count > 0 ? (
            <div className="mt-3 flex items-center gap-3">
              <StarRating value={summary.average} size={20} />
              <span className="text-sm font-bold text-[#202020]">{summary.average.toFixed(1)}</span>
              <span className="text-sm text-[#666]">
                ({summary.count} {summary.count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#666]">Be the first to share your thoughts on this gift.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setShowForm((open) => !open); setFeedback(''); }}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#202020] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#404040]"
        >
          <MessageCircle className="h-4 w-4" /> Write a Review
        </button>
      </div>

      {feedback && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-800">
          {feedback}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-2xl border border-[#e4e4e4] bg-[#fafafa] p-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#202020]">Your rating</label>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-2xl border border-[#dedede] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/15" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (optional, not shown)" className="rounded-2xl border border-[#dedede] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/15" />
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="rounded-2xl border border-[#dedede] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/15" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Tell others what you loved..." className="rounded-2xl border border-[#dedede] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/15" />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting} className="rounded-full bg-[#202020] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#404040] disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <p className="text-xs text-[#666]">Reviews appear after a quick approval.</p>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-5">
        {loading ? (
          <p className="text-sm text-[#666]">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          !showForm && <p className="text-sm text-[#666]">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-[#e4e4e4] bg-white/80 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <StarRating value={review.rating} size={15} />
                  <span className="font-bold text-[#202020]">{review.authorName}</span>
                </div>
                <span className="text-xs text-[#666]">{formatDate(review.createdAt)}</span>
              </div>
              {review.title && <p className="mt-3 font-sans text-lg text-[#202020]">{review.title}</p>}
              {review.body && <p className="mt-2 text-sm leading-relaxed text-[#666]">{review.body}</p>}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
