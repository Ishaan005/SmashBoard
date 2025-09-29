import Link from 'next/link';

interface CourtsHeaderProps {
  onClearAllCourts: () => void;
  onResetCourtSystem: () => void;
  onCopyToClipboard: () => void;
}

export default function CourtsHeader({ onClearAllCourts, onResetCourtSystem, onCopyToClipboard }: CourtsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
          Court Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage court allocations, queues, and match scheduling
        </p>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
        <button
          onClick={onClearAllCourts}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Clear All Courts
        </button>
        <button
          onClick={onResetCourtSystem}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Reset System
        </button>
        <button
          onClick={onCopyToClipboard}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Copy to WhatsApp
        </button>
        <Link 
          href="/"
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
