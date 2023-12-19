import express from "express";
import { createAuthorizationHeader } from "ondc-crypto-sdk-nodejs";
import fetch from "node-fetch";
import config from "./config.js";
import strings from "./strings.js";
import { io } from './global.js';
import fs from 'fs';

const router = express.Router();

router.post("/on_track", async (req, res) => {
  console.log("on_track body:", req.body);
  const jsonData = req.body;
  const filePath = 'on_track_response.txt';

  if (!jsonData.context || !jsonData.context.message_id) {
    console.log("Invalid json");
  } else {
    var messageId = jsonData.context.message_id;
    io.to(messageId).emit("message", JSON.stringify(jsonData));

    fs.writeFile(filePath, JSON.stringify(jsonData), (err) => {
        if (err) {
          console.error('Error writing to file:', err);
        } else {
          console.log(`Data has been written to the on_track ${messageId} file successfully!`);
        }
      });

  }
  if(jsonData.message){
    jsonData.message = { "ack": { "status": "ACK" } };
  }else{
    jsonData.message = { "ack": { "status": "NACK" } };
  }
  res.send(JSON.stringify(jsonData));
});

router.post("/track", async (req, res) => {

  var body = req.body;
  console.log("track: ", body);
  const header = await createAuthorizationHeader({
    message: body,
    privateKey: config.privateKey,
    bapId: config.bapId,
    bapUniqueKeyId: config.bapUniqueKeyId,
  });

  
  var bppUri = body.context.bpp_uri;
  var cleanedBppUri = bppUri.replace(/\/$/, '');
  var url = `${cleanedBppUri}/${strings.confirm}`;

  var headers = {
    "Content-Type": "application/json",
    Authorization: header,
  };

  fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.send(error);
    });
});

export default router;
//module.exports = router;
