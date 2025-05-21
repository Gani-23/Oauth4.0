const express = require("express");
const Product = require("../models/Shop");
const router = express.Router();

// 🔁 Bulk create products
router.post("/bulk", async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Please provide an array of products." });
    }
    const invalid = products.filter(p =>
      !p.title || !p.description || !p.imgSrc || !p.price || !p.stock || !p.sellerName || !p.sellerAddress || !p.category
    );
    if (invalid.length > 0) {
      return res.status(400).json({ error: "Missing required fields in some products.", invalid });
    }
    const created = await Product.insertMany(products);
    res.status(201).json(created);
  } catch (err) {
    console.error("Bulk create error:", err);
    res.status(500).json({ error: "Bulk creation failed." });
  }
});

// 🆕 Create a product
router.post("/", async (req, res) => {
  try {
    const { title, description, imgSrc, price, stock, sellerName, sellerAddress, category } = req.body;
    if (!title || !description || !imgSrc || !price || !stock || !sellerName || !sellerAddress || !category) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const product = new Product({ title, description, imgSrc, price, stock, sellerName, sellerAddress, category });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Create error:", err);
    res.status(400).json({ error: "Product creation failed." });
  }
});

// 📦 Get all products with filtering, sorting, pagination
router.get("/", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, minRating, sortBy = "createdAt", order = "desc", page = 1, limit = 10 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (minPrice || maxPrice) filter.price = { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) };
    if (minRating) filter.avgRating = { $gte: +minRating };

    const skip = (+page - 1) * +limit;
    const products = await Product.find(filter).sort({ [sortBy]: order === "asc" ? 1 : -1 }).skip(skip).limit(+limit);
    const total = await Product.countDocuments(filter);

    res.status(200).json({ total, page: +page, limit: +limit, products });
  } catch (err) {
    console.error("Fetch all error:", err);
    res.status(500).json({ error: "Error fetching products." });
  }
});

// 🔍 Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.status(200).json(product);
  } catch (err) {
    console.error("Find by ID error:", err);
    res.status(500).json({ error: "Error fetching product." });
  }
});

// ✏️ Update product
router.put("/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Product not found." });
    res.status(200).json(updated);
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ error: "Update failed." });
  }
});

// ❌ Delete product
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Product not found." });
    res.status(200).json({ message: "Product deleted." });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed." });
  }
});

// 👤 Get products by seller name
router.get("/seller/:sellerName", async (req, res) => {
  try {
    const products = await Product.find({ sellerName: req.params.sellerName });
    res.status(200).json({ total: products.length, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔎 Search products (title, description, category, sellerName)
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Search query required." });
    const products = await Product.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { sellerName: { $regex: q, $options: "i" } },
      ],
    });
    res.json({ total: products.length, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Products in stock
router.get("/available", async (req, res) => {
  try {
    const inStock = req.query.inStock === "true";
    const products = await Product.find(inStock ? { stock: { $gt: 0 } } : {});
    res.json({ total: products.length, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📁 All unique categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json({ total: categories.length, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🌟 Random featured products
router.get("/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const featured = await Product.aggregate([{ $sample: { size: limit } }]);
    res.json(featured);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🏆 Top sellers (by product count)
router.get("/top-sellers", async (req, res) => {
  try {
    const result = await Product.aggregate([
      { $group: { _id: "$sellerName", totalProducts: { $sum: 1 } } },
      { $sort: { totalProducts: -1 } },
      { $limit: 5 }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📊 Admin dashboard summary
router.get("/stats/summary", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const uniqueSellers = await Product.distinct("sellerName");
    const categories = await Product.distinct("category");
    res.json({ totalProducts, totalSellers: uniqueSellers.length, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⭐ Add or update a product rating
router.post("/:id/rate", async (req, res) => {
  try {
    const { userId, rating, review } = req.body;
    if (!userId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Valid userId and rating (1-5) are required." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });

    // Check if user already rated this product
    const existingRatingIndex = product.ratings.findIndex(r => r.userId.toString() === userId);
    
    if (existingRatingIndex >= 0) {
      // Update existing rating
      product.ratings[existingRatingIndex].rating = rating;
      if (review) product.ratings[existingRatingIndex].review = review;
      product.ratings[existingRatingIndex].createdAt = Date.now();
    } else {
      // Add new rating
      product.ratings.push({ userId, rating, review, createdAt: Date.now() });
    }

    await product.save();
    res.status(200).json(product);
  } catch (err) {
    console.error("Rating error:", err);
    res.status(500).json({ error: "Rating failed." });
  }
});

// 🌟 Get top-rated products
router.get("/top-rated", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const minRatings = parseInt(req.query.minRatings) || 1; // Minimum number of ratings required
    
    const products = await Product.find({ totalRatings: { $gte: minRatings } })
      .sort({ avgRating: -1 })
      .limit(limit);
    
    res.status(200).json({ total: products.length, products });
  } catch (err) {
    console.error("Top rated error:", err);
    res.status(500).json({ error: "Error fetching top-rated products." });
  }
});

// 📊 Get rating statistics for a product
router.get("/:id/ratings", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    
    // Count ratings by star value (1-5)
    const ratingCounts = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    
    product.ratings.forEach(r => {
      ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
    });
    
    res.status(200).json({
      productId: product._id,
      avgRating: product.avgRating,
      totalRatings: product.totalRatings,
      ratingCounts
    });
  } catch (err) {
    console.error("Ratings stats error:", err);
    res.status(500).json({ error: "Error fetching rating statistics." });
  }
});

// 📝 Get all reviews for a product
router.get("/:id/reviews", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    
    // Return only ratings that have reviews
    const reviews = product.ratings
      .filter(r => r.review && r.review.trim() !== "")
      .sort((a, b) => b.createdAt - a.createdAt);
    
    res.status(200).json({
      productId: product._id,
      totalReviews: reviews.length,
      reviews
    });
  } catch (err) {
    console.error("Reviews error:", err);
    res.status(500).json({ error: "Error fetching reviews." });
  }
});

// 🗑️ Delete a rating
router.delete("/:productId/ratings/:userId", async (req, res) => {
  try {
    const { productId, userId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found." });
    
    const initialRatingsLength = product.ratings.length;
    product.ratings = product.ratings.filter(r => r.userId.toString() !== userId);
    
    if (product.ratings.length === initialRatingsLength) {
      return res.status(404).json({ error: "Rating not found for this user." });
    }
    
    await product.save();
    res.status(200).json({ message: "Rating deleted successfully." });
  } catch (err) {
    console.error("Delete rating error:", err);
    res.status(500).json({ error: "Error deleting rating." });
  }
});

module.exports = router;