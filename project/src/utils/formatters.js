export const maskUserId = (userId) => {
  if (!userId) return '';
  const start = userId.slice(0, 2);
  const end = userId.slice(-6);
  return `${start}${'*'.repeat(10)}${end}`;
};

export const maskName = (name) => {
  if (!name) return '';
  const visibleLength = name.length - 4;
  const visiblePart = name.slice(0, visibleLength);
  return `${visiblePart}${'*'.repeat(4)}`;
};

export const maskPhone = (phone) => {
  if (!phone) return '';
  const start = phone.slice(0, 3);
  const end = phone.slice(-3);
  return `${start}${'*'.repeat(4)}${end}`;
};

export const formatThaiDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    calendar: 'buddhist',
  });
};