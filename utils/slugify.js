// utils/slugify.js
module.exports = function slugify(input = "") {
  return String(input)
    .toLowerCase()
    .trim()
    // استبدال مسافات/أحرف خاصة بشرطة
    .replace(/[\s\_]+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9\-]+/g, '') // يسمح بحروف عربية أو لاتينية وأرقام و "-"
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '');
};
