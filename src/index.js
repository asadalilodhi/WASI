require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('WASI is alive'));

app.listen(3000, () => {
  console.log('WASI server running on port 3000');
});