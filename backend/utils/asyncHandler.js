const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next); // Utils para ahorrar escritura de codigo de try catch en cada controller

module.exports = asyncHandler;
