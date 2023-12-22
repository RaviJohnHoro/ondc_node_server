import express from "express";
import { createAuthorizationHeader } from "ondc-crypto-sdk-nodejs";
import fetch from "node-fetch";
//import bodyParser from "body-parser";
import config from "./config.js";
import strings from "./strings.js";
import { io, size, searchMap, userMap } from './global.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const router = express.Router();

router.post("/on_search", async (req, res) => {
  console.log("on_search body:", req.body);
  const jsonData = req.body;
  if (!jsonData.context || !jsonData.context.message_id) {
    console.log("Invalid json");
  } else {
    const messageId = jsonData.context.message_id;
    if (searchMap.get(messageId)) {
      console.log("######### inside searchmap");
      //io.to(messageId).emit("message", JSON.stringify(jsonData));
      var user = userMap.get(messageId);
      console.log("user data::::", user);
      searchMap.get(messageId).push(JSON.stringify(jsonData));
      if (searchMap.get(messageId).length <= size) {
        //console.log("######### inside searchmap");
        // io.to(messageId).emit("message", JSON.stringify(jsonData));

        if (jsonData.message && jsonData.message.catalog && jsonData.message.catalog["bpp/providers"].length > 0) {
          // Access the catalog and items
          
          //const items = catalog["bpp/providers"][0];

          if(jsonData.message && jsonData.message.catalog){
            const bppId = jsonData.context.bpp_id;
            const catalog = jsonData.message.catalog;
            const providerName = jsonData.message.catalog["bpp/providers"][0]["descriptor"]["name"];
            let data = JSON.stringify({
              message: "",
              user_phone: user.userPhone,
              user_phonenumber_id: user.userPhoneNumberId,
              shop_name:providerName,
              shop_url:`https://www.gamatics.in/api/messageId/${messageId}/bppId/${bppId}`
            });
    
            console.log("dataaaa:::::", data);
          
            // let config = {
            //   method: "post",
            //   maxBodyLength: Infinity,
            //   url: "https://ulai.in/whatsappengine/sendOndcShopUrl",
            //   headers: {
            //     "Content-Type": "application/json",
            //   },
            //   data: data,
            // };
          
            // await axios
            //   .request(config)
            //   .then((response) => {
            //     console.log(JSON.stringify(response.data));
            //     return { message: "sent" };
            //   })
            //   .catch((error) => {
            //     console.log(error);
            //   });
        
          // Iterate through items and print name and price
          // items.forEach( async item => {
          //   const itemName = item.descriptor.name;
          //   const itemPrice = item.price.value;
          //   console.log(`Item Name: ${itemName}, Price: ${itemPrice} ${item.price.value}`);
          //   let data = JSON.stringify({
          //     message: `${itemName} ::: ${itemPrice}`,
          //     user_phone: user.userPhone,
          //     user_phonenumber_id: user.userPhoneNumberId,
          //   });
    
          //   console.log("on_search", data);
          
          //   let config = {
          //     method: "post",
          //     maxBodyLength: Infinity,
          //     url: "https://ulai.in/whatsappengine/sendMessageToWhatsapp",
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //     data: data,
          //   };
          
          //   await axios
          //     .request(config)
          //     .then((response) => {
          //       console.log(JSON.stringify(response.data));
          //       return { message: "sent" };
          //     })
          //     .catch((error) => {
          //       console.log(error);
          //     });
              
          // });
          }else{
            console.log("###### null catalog");
          }

          
        } else {
          console.log("No bpp providers found in the catalog.");
        }

        console.log("here");

        


      }
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

  const jsonData = req.body;

  var message = jsonData.message;
  var userPhone= jsonData.user_phone;
  var userId = jsonData.user_phonenumber_id;

  // if (!jsonData.context || !jsonData.context.message_id) {
  //   console.log("Invalid json");
  // }

  var body = {
    "context": {
      "domain": "nic2004:52110",
      "country": "IND",
      "city": "*",
      "action": "search",
      "core_version": "1.1.0",
      "bap_id": "gamatics.in",
      "bap_uri": "https://gamatics.in/api/",
      "transaction_id": "252cc06b-3a38-4b70-bbf7-985650ea1c0e",
      "message_id": "uuid",
      "timestamp": "2023-11-22T19:18:31.731Z  ",
      "ttl": "P1M"
      },
      "message": {
      "intent": {
        "item": {
            "descriptor": {
            "name": message
          }
        }
      },
      "fulfillment": {
        "type": "Delivery",
        "end": {
          "location": {"gps": "12.9357527 77.5823452"}
        }
      }
    }
  };

  var messageId = uuidv4();

  userMap.set(messageId, req.body);

  const header = await createAuthorizationHeader({
    message: body,
    privateKey: config.privateKey,
    bapId: config.bapId,
    bapUniqueKeyId: config.bapUniqueKeyId,
  });


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
      //res.send(data);
    })
    .catch((error) => {
      //res.send(error);
    });
});

export default router;
//module.exports = router;
