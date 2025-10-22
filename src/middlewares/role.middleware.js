// role.middleware.js
export const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission.' });
    }
    next();
  };
};

export function assignRole(req, res, next) {
  req.body.role = req.body.role || 'student'; // default to student
  next();
}
