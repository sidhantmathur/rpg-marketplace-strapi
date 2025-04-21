'use client';
import { useState } from 'react';
import StarRatingInput from './StarRatingInput';

export default function ReviewModal({
  open,
  onClose,
  sessionId,
  targetId,
  authorId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  targetId: string;
  authorId: string;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-sm">
        <h3 className="font-semibold mb-2">Rate this DM</h3>
        <StarRatingInput value={rating} onChange={setRating} size={24} />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="border p-2 rounded w-full mt-2"
          placeholder="Optional feedback"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 text-sm">Cancel</button>
          <button
            className="bg-blue-600 text-white px-3 py-1 text-sm rounded"
            onClick={async () => {
              const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId,
                  targetId,
                  authorId,
                  rating,
                  comment,
                }),
              });
              if (res.ok) {
                onSuccess();
                onClose();
              } else {
                alert('Error saving review');
              }
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
