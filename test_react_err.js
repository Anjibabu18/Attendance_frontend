const https = require('https');
https.get('https://legacy.reactjs.org/docs/error-decoder.html?invariant=310', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const match = data.match(/The full text of the error you just encountered is:.*?<p>([^<]+)<\/p>/s);
    if (match) {
      console.log('Error 310:', match[1].trim());
    } else {
      console.log('Could not parse error message');
      // just find "invariant=310" in the text
    }
  });
});
