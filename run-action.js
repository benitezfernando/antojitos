require('dotenv').config({ path: '.env.local' });
const { updateProductoConReceta } = require('./.next/server/app/actions.js'); // Not easy to require Next.js internals

// Let's just create a raw script that imports the source file if we run it with ts-node or tsx.
