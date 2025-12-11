export default function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
  );
}
