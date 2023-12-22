import { app, server, io, size, searchMap, userMap } from './global.js';
import { v4 as uuidv4 } from 'uuid';
import { createAuthorizationHeader } from "ondc-crypto-sdk-nodejs";
import fetch from "node-fetch";
import config from "./config.js";
import strings from "./strings.js";
import ejs from 'ejs';

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get('/messageId/:messageId/bppId/:bppId', (req, res) => {
  const messageId = req.params.messageId;
  const bppId = req.params.bppId;

  if (messageId || bppId) {
    if(searchMap.get(messageId)){
      var dataList = searchMap.get(messageId);

      const matchingData = dataList.find(data => {
        const context = JSON.parse(data).context;
        return context && context.bpp_id === bppId;
      });

      if (matchingData) {
        //console.log(`matching data: ${matchingData}`);
        res.render('index', { matchingData: JSON.parse(matchingData) });
        //res.send({ "data": JSON.parse(matchingData) });
      } else {
        res.send({ "data": "Data not found for the specified bppId" });
      }

      //res.send({"data": JSON.stringify(data)});
    }else{
      res.send({"messageId": "Data not found"});
    }
    
  } else {
    res.status(404).send('Required params missing');
  }
});

app.post("/send",async (req, res)  => {
  var body = req.body;
  console.log("Search: ", body);

  const jsonData = req.body;

  var message = jsonData.message;
  var userPhone= jsonData.user_phone;
  var userId = jsonData.user_phonenumber_id;

  

  // if (!jsonData.context || !jsonData.context.message_id) {
  //   console.log("Invalid json");
  // }

  var messageId = uuidv4();
  searchMap.set(messageId, []);

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
      "message_id": messageId,
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
      res.send(data);
    })
    .catch((error) => {
      res.send(error);
    });
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle joining a custom room
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
    if (!searchMap.get(room)) {
      searchMap.set(room, []);
    }
  });

  // Handle messages
  socket.on("message", (data) => {
    // Broadcast the message to all users in the same room
    io.to(data.room).emit("message", data);
  });

  socket.on("leaveRoom", (data) => {
    const roomId = data.roomId;
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room: ${roomId}`);
    searchMap.delete(roomId);
    userMap.delete(roomId);
  });

  socket.on("loadMore", (data) => {
    var messageId = data.messageId;

    var index = data.index;
    if (
      messageId !== undefined &&
      messageId !== null &&
      index !== undefined &&
      index !== null
    ) {
      var list = searchMap.get(messageId);
      var maxLength = index + size < list.length ? index + size : list.length;
      if (index < maxLength) {
        for (let i = index; i < maxLength; i += 1) {
          io.to(messageId).emit("message", list[i]);
        }
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
