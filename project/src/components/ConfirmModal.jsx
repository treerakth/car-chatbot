import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${
        darkMode ? 'bg-[#31254F] text-white' : 'bg-white text-gray-900'
      } rounded-lg p-6 max-w-sm w-full mx-4`}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-[#9810FA] text-white hover:bg-[#8228E5]'
                : 'bg-[#9810FA] text-white hover:bg-[#8228E5]'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;