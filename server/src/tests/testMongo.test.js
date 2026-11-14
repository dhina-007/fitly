
const { MongoClient } = require('mongoose/node_modules/mongodb');
test('MongoClient in Jest', async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  console.log('Connected in Jest!');
  await client.close();
});
