import { getDb, migrate } from './index.js';

const db = getDb();
migrate(db);
console.log('Database migrated successfully');
db.close();
