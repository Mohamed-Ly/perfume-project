// middlewares/verifyToken.js
const jwt = require("jsonwebtoken");
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET_KEY;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  

  if (!token) {
    return res.status(401).json({ message: "Token is missing" });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });

    req.user = user; // حفظ بيانات المستخدم في req
    next();
  });
};

module.exports = verifyToken;
