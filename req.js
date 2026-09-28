const https = require('https');
const data = JSON.stringify({
  url: 'https://smarthouse-backend.onrender.com/api/max/webhook',
  update_types: ['message_created', 'bot_started'],
  secret: 'smarthouse_hackathon_secret'
});

const options = {
  hostname: 'platform-api2.max.ru',
  path: '/subscriptions',
  method: 'POST',
  rejectUnauthorized: false,
  headers: {
    'Authorization': 'f9LHodD0cOKlk715vvXi0yQtmBz8Mf2tTnp_3KDz7S1xRn9QgkbIGOahyq_Jwzfjvq6IYqUcJYGP71NdAXY5',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let resData = '';
  res.on('data', d => resData += d);
  res.on('end', () => console.log('Response:', res.statusCode, resData));
});
req.on('error', error => console.error(error));
req.write(data);
req.end();
