"use client";
import { useState } from "react";
import StarRatingInput from "./StarRatingInput";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  targetId: string;
  authorId: string;
  onSuccess: () => void;
}

interface ReviewFormState {
  rating: number;
  comment: string;
  isLoading: boolean;
  error: string | null;
}

interface ReviewResponse {
  success: boolean;
  error?: string;
}

export default function ReviewModal({
  open,
  onClose,
  sessionId,
  targetId,
  authorId,
  onSuccess,
}: ReviewModalProps) {
  const [formState, setFormState] = useState<ReviewFormState>({
    rating: 5,
    comment: "",
    isLoading: false,
    error: null,
  });

  const handleSubmit = async () => {
    setFormState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          targetId,
          authorId,
          rating: formState.rating,
          comment: formState.comment,
        }),
      });

      const data = await res.json() as ReviewResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit review");
      }

      onSuccess();
      onClose();
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }));
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-sm">
        <h3 className="font-semibold mb-2">Rate this DM</h3>
        <StarRatingInput 
          value={formState.rating} 
          onChange={(rating) => setFormState(prev => ({ ...prev, rating }))} 
          size={24} 
        />
        <textarea
          value={formState.comment}
          onChange={(e) => setFormState(prev => ({ ...prev, comment: e.target.value }))}
          className="border p-2 rounded w-full mt-2"
          placeholder="Optional feedback"
          rows={3}
        />

        {formState.error && (
          <p className="text-red-500 text-sm mt-2">{formState.error}</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button 
            onClick={onClose} 
            className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
            disabled={formState.isLoading}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-3 py-1 text-sm rounded disabled:opacity-50"
            onClick={() => void handleSubmit()}
            disabled={formState.isLoading}
          >
            {formState.isLoading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
