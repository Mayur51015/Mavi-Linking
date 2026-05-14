const mongoose = require('mongoose');

async function cleanUp() {
  await mongoose.connect('mongodb://localhost:27017/mavi-linking');
  const db = mongoose.connection.db;
  
  const result = await db.collection('rankings').deleteMany({ userId: "69fc9cf908cb5ce93b3d169c" });
  console.log(`Deleted ${result.deletedCount} orphaned ranking record(s).`);

  // Just to be safe, delete by object id too if it was stored that way
  let queryId;
  try {
    queryId = new mongoose.Types.ObjectId("69fc9cf908cb5ce93b3d169c");
    const result2 = await db.collection('rankings').deleteMany({ userId: queryId });
    console.log(`Deleted ${result2.deletedCount} orphaned ranking record(s) using ObjectId.`);
  } catch(e) {}

  process.exit(0);
}

cleanUp();
