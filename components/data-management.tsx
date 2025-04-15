// components/data-management.tsx
import React, { useRef } from 'react';
import { Save, Upload } from 'lucide-react';

interface DataManagementProps {
  userId: string;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ userId, onExport, onImport, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-white text-lg font-semibold mb-1">Your Progress</h3>
          <p className="text-gray-400 text-sm">ID: {userId.substring(0, 8)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"
          >
            <Save className="w-4 h-4" /> Export
          </button>
          <button
            onClick={handleImportClick}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={onReset}
            className="bg-red-900/50 hover:bg-red-900/70 text-white px-3 py-1.5 rounded text-sm"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
