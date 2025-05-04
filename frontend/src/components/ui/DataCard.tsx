import React from 'react';

interface DataCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content inside the card */
  children: React.ReactNode;
}

/**
 * DataCard component: Wraps content in a styled card with consistent padding, shadow, and border radius.
 */
const DataCard: React.FC<DataCardProps> = ({ children, className = '', ...rest }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-card p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default DataCard; 