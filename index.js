const express = require("express");
const app = express();
var cors = require("cors");
const nodemailer = require("nodemailer");
const port = 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// POST endpoint to handle email sending
app.post("/send-email", (req, res) => {
  //   const { name, email, message } = req.body;
  const {
    Food,
    TotalAmount,
    address,
    delivaryType,
    totalPrice,
    name,
    phone,
    quantity,
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
Delivery Type: ${delivaryType}
Mobile: ${phone}
Ordered Item:

    ${Food?.map(
      (food, i) => `
              ${i + 1}. ${food.title}
              ${food.weight}
              Price:${food.priceInBd}
              Quantity: ${food.quantity}
    `
    )}
Total Amount: ${totalPrice}`;

  const mailOptions = {
    from: "refatbhuyan4@gmail.com",
    to: "refatbhuyan4@gmail.com, refatbubt@gmail.com, bm.lava@gmail.com", // replace with the recipient email
    subject: "New Orders",
    text: item,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).send("Email sent: " + info.response);
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
