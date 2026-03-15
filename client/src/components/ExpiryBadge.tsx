import React from 'react';

interface ExpiryBadgeProps {
  expiryDate: string | null;
  alertDaysBefore?: number;
}

const ExpiryBadge: React.FC<ExpiryBadgeProps> = ({ expiryDate, alertDaysBefore = 7 }) => {
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let badgeColor = '';
  let badgeText = '';
  let textColor = 'text-white';

  if (daysUntilExpiry < 0) {
    badgeColor = 'bg-black';
    badgeText = 'EXPIRED';
  } else if (daysUntilExpiry === 0) {
    badgeColor = 'bg-red-600';
    badgeText = 'EXPIRES TODAY';
  } else if (daysUntilExpiry <= 3) {
    badgeColor = 'bg-red-500';
    badgeText = `${daysUntilExpiry}d left`;
  } else if (daysUntilExpiry <= 7) {
    badgeColor = 'bg-yellow-500';
    badgeText = `${daysUntilExpiry}d left`;
    textColor = 'text-black';
  } else if (daysUntilExpiry <= 14) {
    badgeColor = 'bg-blue-500';
    badgeText = `${daysUntilExpiry}d left`;
  } else {
    badgeColor = 'bg-green-500';
    badgeText = `${daysUntilExpiry}d left`;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${badgeColor} ${textColor}`}>
      {badgeText}
    </span>
  );
};

export default ExpiryBadge;