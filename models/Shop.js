const mongoose = require("mongoose");

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
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    sellerName: {
      type: String,
      required: true,
      trim: true,
    },
    sellerAddress: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    ratings: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        review: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    avgRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate avgRating whenever a rating is added or updated
productSchema.pre("save", function (next) {
  if (this.ratings && this.ratings.length > 0) {
    const totalScore = this.ratings.reduce((sum, item) => sum + item.rating, 0);
    this.avgRating = totalScore / this.ratings.length;
    this.totalRatings = this.ratings.length;
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);