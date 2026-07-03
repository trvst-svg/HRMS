// backend/src/server.js
const dotenv = require("dotenv");
dotenv.config();

const app = require("./app"); // <- uses src/app.js

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
