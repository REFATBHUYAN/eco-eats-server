const express = require("express");
const app = express();
var cors = require("cors");
const nodemailer = require("nodemailer");
const moment = require('moment');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dp83dff.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const orderCollection = client.db("musicSite").collection("orders");
    // best electronics code
    app.get("/musics", async (req, res) => {
      const result = await musicCollection.find().toArray();
      res.send(result);
    });
    app.post("/musics", async (req, res) => {
      const toy = req.body;
      const result = await musicCollection.insertMany(toy);
      res.send(result);
    });
    app.get("/search/:title", async (req, res) => {
      const result = await musicCollection
        .find({ title: { $regex: req.params.title, $options: "i" } })
        .toArray();
      res.send(result);
    });

    // eco eats code here below

    // POST endpoint to handle email sending
    app.post("/send-email", async (req, res) => {
      //   const { name, email, message } = req.body;
      // const date = new Date().toISOString().split("T")[0];
      const date = moment().format().split("T")[0];
      console.log(date);
      const {
        Food,
        address,
        deliveryType,
        totalPrice,
        name,
        phone,
        deliveryCharge,
      } = req.body;

      // Nodemailer configuration
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "refatbubt@gmail.com", // replace with your Gmail email
          pass: process.env.EMAIL_PASS, // replace with your Gmail password
        },
      });

      // Email options

      const item = `
    Customer Name: ${name}
    Address: ${address} 
    Delivery Type: ${
      deliveryType === "ঢাকার ভেতরে"
        ? "Inside Dhaka - 80 tk"
        : "Outside Dhaka - 100 tk"
    }
    Mobile: ${phone}
    Ordered Item:
        ${Food?.map(
          (food, i) => `
                  ${i + 1}. ${food.title} - ${food.weight}
                  Price: ${food.price} tk
                  Quantity: ${food.quantity}
                  Subtotal: ${food.quantity * food.price} tk
        `
        )}
    Total Amount: ${totalPrice} + ${deliveryCharge} = ${
        deliveryCharge + totalPrice
      } tk`;

      const mailOptions = {
        from: "refatbhuyan4@gmail.com",
        to: "refatbhuyan4@gmail.com", // replace with the recipient email
        // to: "refatbhuyan4@gmail.com, refatbubt@gmail.com, bm.lava@gmail.com", // replace with the recipient email
        subject: "EcoEats New Order",
        text: item,
      };

      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send(error.toString());
        }
        res.status(200).send("Email sent: " + info.response);
      });

      // send data to database
      const newOrder = {
        date: date,
        name: name,
        phone: phone,
        address: address,
        deliveryType: deliveryType,
        totalPrice: totalPrice,
        food: Food,
        deliveryCharge: deliveryCharge,
        status: "Pending",
      };
      const result = await orderCollection.insertOne(newOrder);
      res.send(result);
    });

    app.get("/orders/:date", async (req, res) => {
      const result = await orderCollection.find({ date: req.params.date }).toArray();
      res.send(result);
    });

    app.patch("/update/:id", async (req, res) => {
      
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "Delivered",
        },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.send(result);
      
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
