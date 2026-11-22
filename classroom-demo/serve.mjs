import { createPantriServer } from './server/http.mjs';

const port = Number(process.env.PANTRI_DEMO_PORT ?? 5173);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error('PANTRI_DEMO_PORT must be an integer from 0 through 65535.');
  process.exitCode = 1;
} else {
  try {
    const server = createPantriServer();
    server.once('error', error => {
      console.error('PANTRI could not start: ' + error.code);
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => {
      console.log('PANTRI running at http://127.0.0.1:' + server.address().port);
    });
  } catch {
    console.error('PANTRI could not open its data file. Check the configured data directory.');
    process.exitCode = 1;
  }
}
