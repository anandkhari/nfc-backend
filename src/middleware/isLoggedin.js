const jwt = require('jsonwebtoken');

module.exports.isLoggedIn = (req, res, next) => {
  try {
    const token = req.cookies.token; // token from cookie

    console.log('--- isLoggedIn Debug ---');
    console.log('Cookies received:', req.cookies);

    if (!token) {
      console.log('❌ No token found in cookies.');
      return res.status(401).json({ message: 'Authentication failed: No token provided.' });
    }

    console.log('Raw token:', JSON.stringify(token)); // shows exact token string including spaces
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    let decoded;
    try {
      // Use trim to remove leading/trailing spaces
      decoded = jwt.verify(token.trim(), process.env.JWT_SECRET);
      console.log('✅ Token decoded successfully:', decoded);
    } catch (err) {
      console.error('❌ JWT verification failed:', err.message);

      // Distinguish between common JWT errors
      if (err.name === 'TokenExpiredError') {
        console.log('Token has expired at:', err.expiredAt);
      } else if (err.name === 'JsonWebTokenError') {
        console.log('Token is malformed or signature is invalid.');
      } else if (err.name === 'NotBeforeError') {
        console.log('Token is not active yet.');
      }

      return res.status(401).json({ message: 'Authentication failed: Invalid or expired token.' });
    }

    // Attach decoded payload to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Unexpected error in isLoggedIn middleware:', err);
    return res.status(500).json({ message: 'Internal server error during authentication.' });
  }
};
