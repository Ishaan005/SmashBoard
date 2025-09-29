interface CourtConfigProps {
  numCourts: number;
  setNumCourts: (n: number) => void;
  matchType: 'singles' | 'doubles';
  setMatchType: (type: 'singles' | 'doubles') => void;
}

export default function CourtConfig({ numCourts, setNumCourts, matchType, setMatchType }: CourtConfigProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Court Configuration
      </h2>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-gray-700 dark:text-gray-300">
            Number of Courts:
          </label>
          <select
            value={numCourts}
            onChange={(e) => setNumCourts(parseInt(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-gray-700 dark:text-gray-300">
            Match Type:
          </label>
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value as 'singles' | 'doubles')}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="doubles">Doubles (2v2)</option>
            <option value="singles">Singles (1v1)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
