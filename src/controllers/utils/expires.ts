// set expiration for old links

export function expiresIn() {
  const d = new Date();
  d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000);

  return d;
}
