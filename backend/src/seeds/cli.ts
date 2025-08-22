import mongoose from 'mongoose';
import { run } from './seed.js';

async function main() {
  await run();
  // eslint-disable-next-line no-console
  console.log('[seed] Completed successfully');
}

main()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] Failed:', err);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  });
