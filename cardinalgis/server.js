// Start the web server.  Settings come from environment variables:
//   PORT          port to listen on (default 3000; hosting platforms set this for you)
//   DATA_DIR      folder for the SQLite database file (default ./storage)
//   EDITOR_TOKEN  if set, people must enter this key to add/edit/delete data
const path = require('path');
const { openDatabase } = require('./src/db');
const { createApp } = require('./src/app');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'storage');
const EDITOR_TOKEN = process.env.EDITOR_TOKEN || '';

const db = openDatabase(path.join(DATA_DIR, 'mining.db'));
const app = createApp({ db, editorToken: EDITOR_TOKEN });

app.listen(PORT, () => {
  console.log(`CardinalGIS running at http://localhost:${PORT}`);
  console.log(`Database: ${path.join(DATA_DIR, 'mining.db')}`);
  console.log(EDITOR_TOKEN ? 'Editing is protected by EDITOR_TOKEN.' : 'WARNING: EDITOR_TOKEN not set — anyone can edit data.');
});
