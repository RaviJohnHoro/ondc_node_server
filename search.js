import express from "express";
import { createAuthorizationHeader } from "ondc-crypto-sdk-nodejs";
import fetch from "node-fetch";
//import bodyParser from "body-parser";
import config from "./config.js";
import strings from "./strings.js";
import { io, size, searchMap } from './global.js';
// import axios from 'axios';
// import got from 'got';
// import pkg from 'tweetnacl-util';
// import base64 from 'base64-js';
// import nacl from 'tweetnacl';
// import * as blake from 'blakejs';
// import _sodium from "libsodium-wrappers";
// import pkg from "libsodium-wrappers";
// const { base64_variants } = pkg;

// const { decodeBase64, encodeBase64 } = pkg;
const router = express.Router();

router.post("/on_search", async (req, res) => {
  console.log("on_search body:", req.body);
  const jsonData = req.body;
  if (!jsonData.context || !jsonData.context.message_id) {
    console.log("Invalid json");
  } else {
    const messageId = jsonData.context.message_id;
    if (searchMap.get(messageId)) {
      io.to(messageId).emit("message", JSON.stringify(jsonData));
      // searchMap.get(messageId).push(JSON.stringify(jsonData));
      // if (searchMap.get(messageId).length <= size) {
      //   io.to(messageId).emit("message", JSON.stringify(jsonData));
      // }
    }
  }
  if(jsonData.message){
    jsonData.message = { "ack": { "status": "ACK" } };
  }else{
    jsonData.message = { "ack": { "status": "NACK" } };
  }
  res.send(JSON.stringify(jsonData));
});


router.post("/search", async (req, res) => {
  var body = req.body;
  console.log("Search: ", body);

  const header = await createAuthorizationHeader({
    message: body,
    privateKey: config.privateKey,
    bapId: config.bapId,
    bapUniqueKeyId: config.bapUniqueKeyId,
  });


  // const created = Math.floor(Date.now() / 1000);
  // const expires = (created + 3600); 

  // const hash = crypto.createHash('blake2b512');
  // hash.update(JSON.stringify(body));
  // const digest_base64 = hash.digest('base64');

  
  // const sodium = _sodium;

  // const digest = sodium.crypto_generichash(64, sodium.from_string(body));
  // const digest_base64 = sodium.to_base64(digest, base64_variants.ORIGINAL);
  // console.log("base64-digest", digest_base64);

  // const signing_string = `(created): ${created}
  // (expires): ${expires}
  // digest: BLAKE-512=${digest_base64}`;

  // const signing_string = "(created): ".concat(created, "\n(expires): ").concat(expires, "\ndigest: BLAKE-512=").concat(digest_base64);

  // const signedMessage = sodium.crypto_sign_detached(signing_string, sodium.from_base64(`${config.privateKey}`, base64_variants.ORIGINAL));
  // const _signedMessage = sodium.to_base64(signedMessage, base64_variants.ORIGINAL);
  // const subscriberId = `${config.bapId}`;
  // const uniqueKeyId = `${config.bapUniqueKeyId}`;
  // const header = `Signature keyId="${subscriberId}|${uniqueKeyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${_signedMessage}"`;

  // //const header = await createAuthorizationHeader(body);

  var url = `${config.baseUrl}/${strings.search}`;

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
