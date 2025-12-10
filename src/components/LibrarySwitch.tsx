import React from 'react';

type Props = {
  libraryMode: 'personal' | 'shared';
  onSwitch: (mode: 'personal' | 'shared') => void;
  sharedDisabled?: boolean;
  disabledReason?: string;
};

const LibrarySwitch: React.FC<Props> = ({ libraryMode, onSwitch, sharedDisabled, disabledReason }) => {
  return (
    <div className="absolute top-3 left-3 z-20 flex overflow-hidden rounded-xl border border-white/15 bg-black/70 backdrop-blur px-2 py-2 shadow-lg">
      <button
        onClick={() => onSwitch('personal')}
        className={`px-4 py-2 text-sm font-bold rounded-lg ${
          libraryMode === 'personal' ? 'bg-[#ff4655] text-white' : 'text-gray-100 hover:text-white hover:bg-white/10'
        }`}
      >
        个人库
      </button>
      <button
        onClick={() => onSwitch('shared')}
        disabled={sharedDisabled}
        className={`px-4 py-2 text-sm font-bold ${
          libraryMode === 'shared' ? 'bg-emerald-500 text-white' : 'text-gray-100 hover:text-white hover:bg-white/10'
        } ${sharedDisabled ? 'opacity-50 cursor-not-allowed' : ''} rounded-lg`}
        title={sharedDisabled ? disabledReason : '切换到共享库（只读，可复制到个人库）'}
      >
        共享库
      </button>
    </div>
  );
};

export default LibrarySwitch;
