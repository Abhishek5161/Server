const express = require("express");
const app = express();
const mongoose = require("mongoose");
const PORT = 5000;
const { URI } = require("./keys");

const cors = require('cors')

app.use(cors())

app.options('*', cors());


mongoose
  .connect(URI)
  .then(() => console.log("Connect to Database.."))
  .catch((err) => console.log("Connection failed", err));

require("./models/user");
require('./models/post')
app.use(express.json());
app.use(require("./routes/auth"));
app.use(require("./routes/post"));




app.listen(PORT, () => {
  console.log(`Server Runnung on Port ${PORT}`);
});
