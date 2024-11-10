// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const { Server } = require("socket.io");
const initializePassport = require("./passport-config");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
initializePassport(passport);

// MongoDB csatlakozás
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Route-ok
app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

app.get("/chat", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/");
  res.render("chat", { user: req.user });
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => {
  res.redirect("/chat");
});

// Socket.IO - valós idejű üzenetküldés
io.on("connection", (socket) => {
  console.log("Felhasználó csatlakozott:", socket.id);

  socket.on("chat message", (msg) => {
    io.emit("chat message", { user: socket.id, msg });
  });

  socket.on("disconnect", () => {
    console.log("Felhasználó lecsatlakozott:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
