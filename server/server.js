require('dotenv').config()

const mongoose = require("mongoose");
const Document = require("./Document");


//connect to the mongoDB
const DB_URL = process.env.MONGO_URL


mongoose.connect(DB_URL);

const { Socket } = require("socket.io");

const io = require("socket.io")(3001, {
  cors: {
    origin: ["google-docs-nu.vercel.app" , "http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

const defaultValue = " ";

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    // console.log(document.data)
    socket.emit("load-document", document.data);
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });

  console.log("conectted");
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) {
    return document;
  }

  return await Document.create({ _id: String(id), data: defaultValue });
}
