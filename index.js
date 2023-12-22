const express = require("express");
const app = express();
var cors = require("cors");
const nodemailer = require("nodemailer");
const port = 5000;

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
    foodPrice,
    name,
    phone,
    quantity,
  } = req.body;

  // Nodemailer configuration
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "refatbubt@gmail.com", // replace with your Gmail email
      pass: "hgya gguk ynon spnk", // replace with your Gmail password
    },
  });

  // Email options
  const mailOptions = {
    from: "refatbhuyan4@gmail.com",
    to: "refatbhuyan4@gmail.com", // replace with the recipient email
    subject: "New Form Submission",
    text: `Name of Customer: ${name}\nAddress: ${address}\nPhone: ${phone}\nOrdered Food: ${Food}\nFoodPrice: ${foodPrice}\nDelivary Type: ${delivaryType}\nQuantity: ${quantity}\nTotal Amount: ${TotalAmount}`,
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
