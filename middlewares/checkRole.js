// middlewares/checkRole.js
module.exports = function checkRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user; // نفترض أنك وضعت المستخدم في req.user بعد التحقق من التوكن
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }

    next(); // ✅ المستخدم له صلاحية، نتابع
  };
};
