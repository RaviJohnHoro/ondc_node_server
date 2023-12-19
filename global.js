import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import search from "./search.js";
import select from "./select.js";
import init from "./init.js";
import confirm from "./confirm.js";
import status from "./status.js";
import track from "./track.js";
import cancel from "./cancel.js";

const app = express();
// Middleware to parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", search);
app.use("/", select);
app.use("/", init);
app.use("/", confirm);
app.use("/", status);
app.use("/", track);
app.use("/", cancel);


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT"],
  },
});

const size = 1;
const searchMap = new Map();

export { app, server, io, size, searchMap };