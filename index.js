const express = require("express");
const app = express();
require("dotenv/config");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const api = process.env.API_URL;
// sample
const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["https://team-dev.web.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  //
});

const corsOption = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOption));
app.use(express.json());
app.use(morgan("tiny"));

app.use(function (req, res, next) {
  req.io = io;
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "x-access-token");

  next();
});

// Deklarasi Route
const ServerRoutes = require("./routes/ServerRoutes");
const UserRoutes = require("./routes/UserRoutes");

app.use(`${api}/servers`, ServerRoutes);
app.use(`${api}/users`, UserRoutes);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "TeamDev",
  })
  .then(() => {
    console.log("Database is ready...");
  })
  .catch((error) => {
    console.log(error);
  });

httpServer.listen(process.env.PORT || 5000, () => {
  console.log("Listening on PORT 5000");
});
