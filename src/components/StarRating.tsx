import React, { useState } from 'react';
import { Star } from 'lucide-react';

type StarRatingProps = {
  value: number;
  size?: number;
  className?: string;
};

// Read-only star display supporting half-star averages.
export function StarRating({ value, size = 16, className = '' }: StarRatingProps) {
  const rounded = Math.max(0, Math.min(5, value));

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`Rated ${rounded} out of 5`}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, rounded - index));
        return (
          <span key={index} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-boutique-brown/25" strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-boutique-wood" fill="currentColor" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
};

// Interactive star picker for submitting a rating.
export function StarRatingInput({ value, onChange, size = 28, className = '' }: StarRatingInputProps) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            strokeWidth={1.5}
            className={star <= active ? 'text-boutique-wood' : 'text-boutique-brown/25'}
            fill={star <= active ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  );
}
