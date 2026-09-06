export async function tracker(action = '', body) {
  const response = await fetch(`/api/tracker${action ? `?action=${action}` : ''}`, {
    credentials: 'same-origin',
    ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'Unable to save your choice. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}
