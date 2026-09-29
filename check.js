const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.vrzadvmrrioaushndyjk:GZLRKQ1DrV74vNab@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

client.connect()
  .then(() => client.query("SELECT id, vk_id FROM users WHERE vk_id ~ '^[0-9]+$'"))
  .then(res => {
    console.log("Numeric vk_ids:", res.rows);
    return client.query("SELECT id, vk_id FROM users LIMIT 10");
  })
  .then(res => {
    console.log("Sample vk_ids:", res.rows);
    client.end();
  })
  .catch(e => console.error(e));
