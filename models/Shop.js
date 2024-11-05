const mongoose = require("mongoose");

// Define the schema for the Product model
const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    imgSrc: {
      type: String,
      required: true, // Assuming all products have an image URL
    },
    price: {
      type: Number,
      required: true,
      min: 0, // Price should be a positive value
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);
module.exports = mongoose.model('Product', productSchema);




