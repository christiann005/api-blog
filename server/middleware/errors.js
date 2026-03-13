function notFound(req, res, next) {
  res.status(404).json({ message: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = Number(err?.status || err?.statusCode) || 500;
  const message =
    status >= 500
      ? 'Server error'
      : (typeof err?.message === 'string' && err.message) || 'Request error';

  if (status >= 500) {
    // Avoid leaking internal details to clients, but still log for debugging.
    console.error(err);
  }

  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };

