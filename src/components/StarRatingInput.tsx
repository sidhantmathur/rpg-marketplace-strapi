"use client";
import { useState } from "react";

export default function StarRatingInput({
  value,
  onChange,
  size = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          onClick={() => onChange(n)}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          width={size}
          height={size}
          className={`cursor-pointer ${n <= value ? "fill-yellow-400" : "fill-gray-300"}`}
        >
          <polygon points="10 1 12.6 7 19 7.3 14 11.6 15.6 18 10 14.3 4.4 18 6 11.6 1 7.3 7.4 7" />
        </svg>
      ))}
    </div>
  );
}
