const isValidDateFormat = (date) => {
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!date.match(datePattern)) return false;

    const [day, month, year] = date.split('/').map(Number);
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2400) return false;
    const testDate = new Date(year - 543, month - 1, day);
    return (
        testDate.getFullYear() === year - 543 &&
        testDate.getMonth() === month - 1 &&
        testDate.getDate() === day
    );
};

// ฟังก์ชันสำหรับแปลงวันที่จาก "DD/MM/YYYY" (ปี พ.ศ.) เป็น Date object (ระบบ Gregorian)
const convertThaiDateToGregorian = (dateString) => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year - 543, month - 1, day);
};

module.exports = { isValidDateFormat, convertThaiDateToGregorian };
