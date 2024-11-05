const express = require("express");
const Product = require("../models/Shop"); // Import the Product model (assuming 'Shop' is your model)
const router = express.Router();

// Create multiple products (bulk insertion)
router.post("/bulk", async (req, res) => {
  try {
    const products = req.body; // Expecting an array of product objects

    // Validate input format
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Please provide an array of products." });
    }

    // Additional validation (optional)
    const invalidProducts = products.filter(product =>
      !product.title || !product.description || !product.imgSrc || !product.price
    );

    if (invalidProducts.length > 0) {
      return res.status(400).json({ error: "Some products are missing required fields.", invalidProducts });
    }

    // Insert products into the database
    const createdProducts = await Product.insertMany(products);
    res.status(201).json(createdProducts);
  } catch (error) {
    console.error("Error creating bulk products:", error);
    res.status(500).json({ error: "An error occurred while creating bulk products." });
  }
});

// Create a new product
router.post("/", async (req, res) => {
  try {
    const { title, description, imgSrc, price } = req.body;

    // Validate required fields
    if (!title || !description || !imgSrc || !price) {
      return res.status(400).json({ error: "All fields are required (title, description, imgSrc, price)." });
    }

    const newProduct = new Product({ title, description, imgSrc, price });
    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({ error: "An error occurred while creating the product." });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching products." });
  }
});

// Get a specific product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "An error occurred while fetching the product." });
  }
});

// Update a product
router.put("/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({ error: "An error occurred while updating the product." });
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "An error occurred while deleting the product." });
  }
});

// Export the router with a descriptive name
// Export the router directly
module.exports = router;
