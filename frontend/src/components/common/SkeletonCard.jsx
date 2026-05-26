export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card p-5 animate-pulse space-y-3">
      <div className="shimmer h-5 w-2/3 rounded-lg" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`shimmer h-3 rounded-lg ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}
