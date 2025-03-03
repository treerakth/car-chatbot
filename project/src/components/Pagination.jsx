import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, darkMode }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-lg ${
          darkMode
            ? 'bg-[#31254F] text-white disabled:bg-gray-700'
            : 'bg-gray-200 text-gray-700 disabled:bg-gray-100'
        } disabled:cursor-not-allowed`}
      >
        Previous
      </button>
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-lg ${
            currentPage === page
              ? darkMode
                ? 'bg-[#9810FA] text-white'
                : 'bg-[#9810FA] text-white'
              : darkMode
                ? 'bg-[#31254F] text-white'
                : 'bg-gray-200 text-gray-700'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-lg ${
          darkMode
            ? 'bg-[#31254F] text-white disabled:bg-gray-700'
            : 'bg-gray-200 text-gray-700 disabled:bg-gray-100'
        } disabled:cursor-not-allowed`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;