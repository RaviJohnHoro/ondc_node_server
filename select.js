import express from "express";
import { createAuthorizationHeader } from "ondc-crypto-sdk-nodejs";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import config from "./config.js";
import strings from "./strings.js";
import { io } from './global.js';
import fs from 'fs';

const router = express.Router();

router.post("/on_select", async (req, res) => {
  console.log("on_select body:", req.body);
  const jsonData = req.body;
  // const filePath = 'on_select_response.txt';

  // fs.writeFile(filePath, JSON.stringify(jsonData), (err) => {
  //   if (err) {
  //     console.error('Error writing to file:', err);
  //   } else {
  //     console.log('Data has been written to the file successfully!');
  //   }
  // });

  if (!jsonData.context || !jsonData.context.message_id) {
    console.log("Invalid json");
  } else {
    var messageId = jsonData.context.message_id;
    io.to(messageId).emit("message", JSON.stringify(jsonData));
  }
  if(jsonData.message){
    jsonData.message = { "ack": { "status": "ACK" } };
  }else{
    jsonData.message = { "ack": { "status": "NACK" } };
  }
  res.send(JSON.stringify(jsonData));
});

router.post("/select", async (req, res) => {

  var body = req.body;
  console.log("Select: ", body);
  const header = await createAuthorizationHeader({
    message: body,
    privateKey: config.privateKey,
    bapId: config.bapId,
    bapUniqueKeyId: config.bapUniqueKeyId,
  });

  var bppUri = body.context.bpp_uri;
  var cleanedBppUri = bppUri.replace(/\/$/, '');
  var url = `${cleanedBppUri}/${strings.select}`;

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
