/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'

const { writeFile } = require('fs/promises')
const path = require('path')

const getDomain = function (url) {
  if (!url) {
    return null
  }
  try {
    return new URL(url).hostname
  } catch (error) {
    // invalid url
    return null
  }
}

let htaccess = `<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
</IfModule>

<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>

<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
</IfModule>

<IfModule mod_headers.c>
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

<IfModule mod_headers.c>
    Header always set X-Download-Options "noopen"
</IfModule>

<IfModule mod_headers.c>
    Header always set Expect-CT "max-age=86400, enforce"
</IfModule>

<IfModule mod_headers.c>
    Header always set Referrer-Policy "no-referrer-when-downgrade"
</IfModule>`

const domain = getDomain(process.env.NEXT_PUBLIC_ANALYTICS_URL)

if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && domain !== null) {
  htaccess += `
<IfModule mod_headers.c>
    Header always set Content-Security-Policy "script-src 'self' "${domain}"
</IfModule>`
}

// eslint-disable-next-line promise/catch-or-return
writeFile(path.resolve(__dirname, '../out/.htaccess'), htaccess).then(() =>
  // eslint-disable-next-line no-console
  console.info('Headers generated successfully'),
)