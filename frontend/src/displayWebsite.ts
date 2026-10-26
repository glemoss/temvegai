// The website as people write it: without the protocol, `www.` and the
// trailing slash, so "https://www.mandarina.com.br/" reads
// "mandarina.com.br". Works on the text instead of `URL`, which would
// lower case the host and encode accented domains.
export function displayWebsite(url: string): string {
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
}
