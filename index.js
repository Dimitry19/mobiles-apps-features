const express = require('express')
const path = require('path');
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error.middleware");
const notFoundMiddleware = require("./middlewares/notFound.middleware");

const adminApi = require("./routes/admin");

const app = express();
app.use(cors());
app.use(express.json());

require("dotenv").config();

// Configurer session mémoire
const sessionSecret = process.env.SESSION_SECRET;
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

const port = process.env.PORT || 8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

//Routes
const { readdirSync } = require("fs");
readdirSync("./routes").map((file) =>
  app.use("/", require("./routes/" + file))
);
app.use("/admin", adminApi);

// Health API
app.get("/api/health", (req, res) => {
  res.json({
    status: "UP",
    version: "1.0.0",
    node: process.version,
    environment: process.env.NODE_ENV || "development",
    uptime: Math.floor(process.uptime()),
  });
});

// 404
app.use(notFoundMiddleware);

// Errors
app.use(errorMiddleware);

// Route principale
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
