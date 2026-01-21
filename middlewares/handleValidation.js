// middlewares/handleValidation.js
const { validationResult } = require("express-validator");
const { sendFail } = require("../utils/responseHelper");

exports.handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach(err => {
      formattedErrors[err.param] = err.msg;
    });
    return sendFail(res, { message: "فشل التحقق من البيانات", errors: formattedErrors }, 422);
  }
  next();
};
