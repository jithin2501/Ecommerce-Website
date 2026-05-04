/**
 * A wrapper around fetch that automatically adds the JWT token
 * to the Authorization header if a user is logged in.
 */
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('clientToken');
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
