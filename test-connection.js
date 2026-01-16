const https = require('https');

const url = 'https://figlerqhziwbzjbohohv.supabase.co';

console.log(`Attempting to fetch ${url}...`);

https.get(url, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);

  res.on('data', (d) => {
    // process.stdout.write(d);
  });
}).on('error', (e) => {
  console.error('Error:', e);
  if (e.cause) console.error('Cause:', e.cause);
});
