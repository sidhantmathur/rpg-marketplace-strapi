export default function RatingBadge({
    avg,
    count,
  }: {
    avg: number;
    count: number;
  }) {
    if (!count) return null;
    return (
      <span className="inline-flex items-center gap-1 text-sm">
        <svg
          width={14}
          height={14}
          viewBox="0 0 20 20"
          className="fill-yellow-400"
        >
          <polygon points="10 1 12.6 7 19 7.3 14 11.6 15.6 18 10 14.3 4.4 18 6 11.6 1 7.3 7.4 7" />
        </svg>
        {avg.toFixed(1)} ({count})
      </span>
    );
  }
  