// Inserts sample products. Run with: npm run seed
// Skips seeding if the products collection already has data.
import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";
import Product from "./models/product.model.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const img = (id) => `https://images.unsplash.com/photo-${id}?w=600`;

const products = [
  { name: "Noise Cancelling Headphones", description: "Wireless over-ear headphones with active noise cancellation and 30-hour battery life.", price: 4999, category: "Electronics", image: img("1505740420928-5e560c06d30e"), stock: 25 },
  { name: "Mechanical Keyboard", description: "RGB mechanical keyboard with blue switches and aluminium frame.", price: 2999, category: "Electronics", image: img("1587829741301-dc798b83add3"), stock: 10 },
  { name: "Smartphone 5G", description: "6.5-inch AMOLED display, 128GB storage and a 50MP triple camera.", price: 18999, category: "Electronics", image: img("1511707171634-5f897ff02aa9"), stock: 8 },
  { name: "Instant Camera", description: "Retro instant camera that prints photos in seconds.", price: 6499, category: "Electronics", image: img("1526170375885-4d8ecf77b99f"), stock: 0 },
  { name: "Classic Wrist Watch", description: "Minimal analog watch with leather strap and water resistance.", price: 2499, category: "Fashion", image: img("1523275335684-37898b6baf30"), stock: 15 },
  { name: "Running Sneakers", description: "Lightweight breathable running shoes with cushioned sole.", price: 3499, category: "Fashion", image: img("1542291026-7eec264c27ff"), stock: 20 },
  { name: "Polarized Sunglasses", description: "UV400 polarized sunglasses with a sturdy metal frame.", price: 1299, category: "Fashion", image: img("1572635196237-14b3f281503f"), stock: 3 },
  { name: "Cotton T-Shirt", description: "Soft 100% cotton crew-neck t-shirt for everyday wear.", price: 599, category: "Fashion", image: img("1521572163474-6864f9cf17ab"), stock: 50 },
  { name: "Travel Backpack", description: "Water-resistant 30L backpack with laptop compartment.", price: 1899, category: "Fashion", image: img("1553062407-98eeb64c6a62"), stock: 12 },
  { name: "The Art of Fiction", description: "A bestselling novel collection loved by readers worldwide.", price: 399, category: "Books", image: img("1544947950-fa07a98d237f"), stock: 30 },
  { name: "Book Lover's Bundle", description: "A stack of five classic paperbacks for your reading list.", price: 1499, category: "Books", image: img("1512820790803-83ca734da794"), stock: 7 },
  { name: "Legal Thriller Novel", description: "A gripping courtroom thriller you won't be able to put down.", price: 449, category: "Books", image: img("1589829085413-56de8ae18c73"), stock: 18 },
  { name: "Modern Table Lamp", description: "Minimal desk lamp with warm light for your study or bedroom.", price: 1599, category: "Home", image: img("1507473885765-e6ed057f782c"), stock: 14 },
  { name: "Ceramic Coffee Mug", description: "Handcrafted 350ml ceramic mug, microwave safe.", price: 349, category: "Home", image: img("1514228742587-6b1558fcca3d"), stock: 40 },
  { name: "Comfort Sofa", description: "Three-seater fabric sofa with plush cushions.", price: 24999, category: "Home", image: img("1555041469-a586c61ea9bc"), stock: 2 },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Product.countDocuments();
  if (existing > 0) {
    console.log(`Products collection already has ${existing} products. Skipping seed.`);
  } else {
    await Product.insertMany(products);
    console.log(`Inserted ${products.length} products.`);
  }

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
