/** Helpers de roles para el frontend */

export function userRoles(user) {
  const roles = user?.roles;
  if (Array.isArray(roles) && roles.length) return roles;
  if (user?.role) return [user.role];
  return [];
}

export function hasRole(user, ...needed) {
  const roles = userRoles(user);
  return needed.some((r) => roles.includes(r));
}

export function isAdmin(user) {
  return hasRole(user, "admin") || String(user?.email || "").toLowerCase() === "admin@local";
}

export function isManager(user) {
  return isAdmin(user) || hasRole(user, "manager");
}

export function isCashierOnly(user) {
  if (isManager(user)) return false;
  return hasRole(user, "cashier");
}

/** Ruta inicial según rol */
export function homePathForUser(user) {
  if (isCashierOnly(user)) return "/admin/rapido";
  return "/admin/dashboard";
}
