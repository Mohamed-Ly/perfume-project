// utils/responseHelper.js

exports.sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    data
  });
};

exports.sendFail = (res, data = {}, statusCode = 400) => {
  return res.status(statusCode).json({
    status: "fail",
    data
  });
};

exports.sendError = (res, message = "Something went wrong", statusCode = 500) => {
  return res.status(statusCode).json({
    status: "error",
    message
  });
};
