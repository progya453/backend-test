// class AppError extends Error {
//   constructor(message, statusCode) {
//     super(message);

//     this.statusCode = statusCode;
//     this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
//     this.isOperational = true; // Marks errors we created intentionally

// // class AppError extends Error {
// //   constructor(message, statusCode) {
// //     super(message);

// //     this.statusCode = statusCode;
// //     this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
// //     this.isOperational = true; // Marks errors we created intentionally

// //     Error.captureStackTrace(this, this.constructor);
// //   }
// // }

// // module.exports = { AppError };


class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Add this wrapper function
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = { AppError, catchAsync }; // Export both
