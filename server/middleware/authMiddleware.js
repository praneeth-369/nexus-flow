import { DEFAULT_USERS } from '../routes/authRoutes.js';

/**
 * Extracts and normalizes the client's role from request headers or auth token.
 */
export function extractRole(req) {
  // 1. Direct header
  const headerRole = req.headers['x-user-role'];
  if (headerRole) return headerRole.trim();

  // 2. Authorization Bearer token (e.g. "nexus-jwt-usr-1-...")
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const match = token.match(/nexus-jwt-(usr-\d+)/);
    if (match) {
      const user = DEFAULT_USERS.find(u => u.id === match[1]);
      if (user) return user.role;
    }
  }

  // 3. Query param fallback
  if (req.query.role) return req.query.role;

  // Default to Lead if not specified
  return 'Project Lead';
}

/**
 * Middleware factory ensuring the requester has at least one of the allowed roles.
 * If user has Viewer role, write requests will be rejected with 403 Forbidden.
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const role = extractRole(req);
    const normalizedRole = role.toLowerCase();

    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    const isAuthorized = normalizedAllowed.some(allowed => {
      if (allowed === 'admin' || allowed === 'lead' || allowed === 'project lead') {
        return normalizedRole.includes('lead') || normalizedRole.includes('admin');
      }
      if (allowed === 'editor' || allowed === 'member' || allowed === 'team member') {
        return normalizedRole.includes('member') || normalizedRole.includes('lead') || normalizedRole.includes('editor') || normalizedRole.includes('admin');
      }
      return normalizedRole === allowed;
    });

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Action denied. The current role ("${role}") does not have permissions for this operation. Requires: ${allowedRoles.join(' or ')}.`,
        currentRole: role,
        requiredRoles: allowedRoles,
      });
    }

    req.userRole = role;
    next();
  };
}

export const requireEditor = requireRole(['Project Lead', 'Team Member']);
export const requireLead = requireRole(['Project Lead']);
