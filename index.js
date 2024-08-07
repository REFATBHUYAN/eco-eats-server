const express = require("express");
const app = express();
var cors = require("cors");
const nodemailer = require("nodemailer");
const moment = require("moment");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@clusterecoeats.wesj4vc.mongodb.net/?retryWrites=true&w=majority`;
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s3ihbep.mongodb.net/?retryWrites=true&w=majority`;
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dp83dff.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let orderCounter = 1;

// Middleware to increment the order counter for POST requests to /placeOrder
app.use((req, res, next) => {
  if (req.method === "POST" && req.path === "/send-email") {
    req.orderCounter = orderCounter++;
  }
  next();
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const orderCollection = client.db("ecoEatsData").collection("orders");
    const countersCollection = client.db("ecoEatsData").collection("counters");
    // const countersCollection = client.db("musicSite").collection("counters");
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
    app.get("/singleitem/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await orderCollection.findOne(filter);
      res.send(result);
    });
    app.get("/allorders", async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result);
    });

    app.get("/allordersstate", async (req, res) => {
      const totalOrderPrice = await orderCollection.aggregate([
        { $match: { status: { $ne: "canceled" } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]).toArray();

      // Get total canceled, shipped, pending orders and total number of products
      let orderStats = await orderCollection.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]).toArray();
      // console.log(orderStats) 

      if (!Array.isArray(orderStats)) {
        orderStats = [];
      }
      // console.log(totalOrderPrice) 

      // Response
      res.json({
        totalOrderPrice: totalOrderPrice[0]?.total || 0,
        totalCanceled:
          orderStats?.find((stat) => stat.status === "Cancelled")?.count || 0,
        totalShipped:
          orderStats?.find((stat) => stat.status === "Shipped")?.count || 0,
        totalPending:
          orderStats?.find((stat) => stat.status === "Pending")?.count || 0,
        totalProducts: await orderCollection.countDocuments(),
      });
    });

    app.post("/send-email", async (req, res) => {
      // const date = moment().format().split("T")[0];

      const {
        date,
        Food,
        address,
        deliveryType,
        totalPrice,
        orderedTime,
        name,
        phone,
        deliveryCharge,
      } = req.body;

      // Nodemailer configuration
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "web.ecoeatsbd@gmail.com", // replace with your Gmail email
          pass: process.env.EMAIL_PASS, // replace with your Gmail password
        },
      });

      // Email options
      const htmlBody = `
  <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          color: #94A3B8;
        }

        h3 {
          color: #22C55E;
        }
        h4 {
          color: #475569;
        }

        p {
          color: #475569;
          margin: 5px 0;
        }

        strong {
          
          font-weight: bold;
        }

        ul {
          list-style-type: none;
          padding: 0;
        }

        li {
          margin-bottom: 5px;
        }

        li p {
          margin: 5px 0;
        }

        /* Add your own color styles as needed */
      </style>
    </head>
    <body>
      <h3>EcoEats Order Details</h3>
      <p><strong>Customer Name:</strong> ${name}</p>
      <p><strong>Address:</strong> ${address}</p>
      <p><strong>Delivery Type:</strong> ${
        deliveryType === "ঢাকার ভেতরে"
          ? "Inside Dhaka - 80 tk"
          : "Outside Dhaka - 100 tk"
      }</p>
      <p><strong>Mobile:</strong> ${phone}</p>
      
      <p><strong>Ordered Items:</strong></p>
      <ul>
        ${Food.map(
          (item, i) => `
          <li>
            <h4><strong>${i + 1}. ${item.title} - ${item.weight}</strong></h4>
            <p><strong>Price:</strong> ${item.price}</p>
            <p><strong>Quantity:</strong> ${item.quantity}</p>
            <p><strong>Sub-Total:</strong> ${item.quantity * item.price} tk</p>
          </li>
        `
        ).join("")}
      </ul>
      
      <p><strong>Total Amount:</strong> ${totalPrice} + ${deliveryCharge} = <strong> ${
        deliveryCharge + totalPrice
      } tk </strong></p>
    </body>
  </html>
`;

      const mailOptions = {
        from: "web.ecoeatsbd@gmail.com",
        to: "web.ecoeatsbd@gmail.com", // replace with the recipient email
        // to: "refatbhuyan4@gmail.com, refatbubt@gmail.com, bm.lava@gmail.com", // replace with the recipient email
        subject: "EcoEats New Order",
        html: htmlBody,
        // text: item,
      };

      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send(error.toString());
        }
        res.status(200).send("Email sent: " + info.response);
      });

      // await countersCollection.updateOne(
      //   { _id: 'orderSerial' },
      //   { $setOnInsert: { value: 6320 } },
      //   { upsert: true }
      // );

      // Find and update the orderSerial counter within the /placeOrder route
      const result = await countersCollection.findOneAndUpdate(
        { _id: "orderSerial" },
        { $inc: { value: 1 } },
        { returnDocument: "after" }
      );

      function formatToFourDigits(number) {
        return String(number).padStart(5, "0");
      }
      // console.log(result)

      // send data to database
      const newOrder = {
        invoice: `WC${formatToFourDigits(result.value)}`,
        // invoice: `WC${formatToFourDigits(
        //   result1.length === 0 ? 1 : result1.length
        // )}`,
        date: date,
        time: orderedTime,
        name: name,
        phone: phone,
        address: address,
        deliveryType: deliveryType,
        totalPrice: totalPrice,
        food: Food,
        deliveryCharge: deliveryCharge,
        status: "Pending",
      };
      const insertedId = await orderCollection.insertOne(newOrder);
      // console.log(insertedId);
      res.send({ insertedId });
    });

    app.get("/orders/:date", async (req, res) => {
      const result = await orderCollection
        .find({ date: req.params.date })
        .toArray();
      res.send(result);
    });

    app.get("/singleorder/:id", async (req, res) => {
      const result = await orderCollection
        .find({ _id: new ObjectId(req.params.id) })
        .toArray();
      res.send(result);
    });

    app.patch("/delivered/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "Shipped",
        },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.patch("/pending/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "Pending",
        },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.patch("/cancelled/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "Cancelled",
        },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.delete("/deleteorder/:id", async (req, res) => {
      const id = req.params.id;

      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(filter);

      res.send(result);
    });
    app.put("/updateorder/:id", async (req, res) => {
      const id = req.params.id;
      const updatedOrder = req.body;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const result = await orderCollection.updateOne(filter, {
        $set: updatedOrder,
      });

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
