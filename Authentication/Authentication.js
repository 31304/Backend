const jwt = require('jsonwebtoken');
function authenticateUser(req, res, next) {
  const { token } = req.headers;
    console.log(token);
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.id = decoded.id;
        req.role = decoded.role;
        req.email = decoded.email;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}
module.exports = authenticateUser;
