const mongoose = require('mongoose');

async function checkData() {
  await mongoose.connect('mongodb://localhost:27017/mavi-linking');
  const db = mongoose.connection.db;
  
  const rankings = await db.collection('rankings').find({ tier: 'Elite Developer' }).toArray();

  for (const rank of rankings) {
    let queryId = rank.userId;
    try {
      if (typeof queryId === 'string') {
        queryId = new mongoose.Types.ObjectId(queryId);
      }
    } catch(e) {}
    
    const user = await db.collection('users').findOne({ _id: queryId });
    console.log(`User for rank ${rank._id} (with ObjectId conversion):`);
    console.log(JSON.stringify(user, null, 2));

    const userStr = await db.collection('users').findOne({ _id: String(rank.userId) });
    console.log(`User for rank ${rank._id} (with String conversion):`);
    console.log(JSON.stringify(userStr, null, 2));
  }
  
  process.exit(0);
}

checkData();
