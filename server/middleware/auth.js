import jwt from 'jsonwebtoken';
import process from 'process';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// HTTP middleware for protecting routes
export const authenticateToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Socket.IO middleware for authenticating socket connections
export const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    socket.email = decoded.email;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};
