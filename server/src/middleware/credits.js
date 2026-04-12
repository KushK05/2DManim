const checkCredits = async (req, res, next) => {
  // Local prototype mode does not block generation by credits.
  next();
};

export default checkCredits;
