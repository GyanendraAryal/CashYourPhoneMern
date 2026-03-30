import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function scan() {
  await mongoose.connect(process.env.MONGO_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  for (const coll of collections) {
    const name = coll.name;
    const docs = await mongoose.connection.db.collection(name).find({}).toArray();
    
    docs.forEach(doc => {
      const str = JSON.stringify(doc);
      if (str.includes('[object Object]')) {
        console.log(`❌ Corruption found in collection [${name}], ID: ${doc._id}`);
      }
    });
  }
  
  process.exit(0);
}

scan();
