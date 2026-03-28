import dotenv from "dotenv";
import { connectDB } from "../src/config/db.js";
import Device from "../src/models/Device.js";
import HeroSlide from "../src/models/HeroSlide.js";
import Review from "../src/models/Review.js";

dotenv.config();
await connectDB(process.env.MONGO_URI);

async function run() {
  await Device.deleteMany({});
  await HeroSlide.deleteMany({});
  await Review.deleteMany({});

  const devices = await Device.insertMany([
    {
      name: "iPhone 14 Pro",
      brand: "Apple",
      price: 150000,
      feature: "128GB, Excellent",
      condition: "New",
      availability: "In Stock",
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1661961112954-793bcee664f5?auto=format&fit=crop&w=900&q=80"
      ],
      thumbnail: "https://images.unsplash.com/photo-1661961112954-793bcee664f5?auto=format&fit=crop&w=900&q=80"
    },
    {
      name: "Samsung Galaxy S23",
      brand: "Samsung",
      price: 120000,
      feature: "128GB, Excellent",
      condition: "New",
      availability: "Limited",
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=900&q=80"
      ],
      thumbnail: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=900&q=80"
    },
    {
      name: "OnePlus 11",
      brand: "OnePlus",
      price: 90000,
      feature: "256GB, Great",
      condition: "New",
      availability: "Out of Stock",
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80"
      ],
      thumbnail: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80"
    },
    {
      name: "iPhone 13",
      brand: "Apple",
      price: 95000,
      feature: "128GB, Good condition",
      condition: "Used",
      availability: "In Stock",
      featured: false,
      images: [
        "https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?auto=format&fit=crop&w=900&q=80"
      ],
      thumbnail: "https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?auto=format&fit=crop&w=900&q=80"
    }
  ]);

  const slides = await HeroSlide.insertMany([
    {
      title: "Sell Your Phone Fast",
      subtitle: "Get the best price in Nepal",
      ctaText: "Sell Now",
      ctaLink: "/sell",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
      order: 1,
      active: true
    },
    {
      title: "Buy Premium Phones",
      subtitle: "New & used devices with warranty options",
      ctaText: "Browse Phones",
      ctaLink: "/buy",
      image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=1400&q=80",
      order: 2,
      active: true
    }
  ]);

  const reviews = await Review.insertMany([
    { name: "Suman", rating: 5, message: "Super fast service and great price!" },
    { name: "Aasha", rating: 4, message: "Easy process. Would recommend." },
    { name: "Bikash", rating: 5, message: "Very professional team." }
  ]);

  console.log("✅ Seeded:", { devices: devices.length, slides: slides.length, reviews: reviews.length });
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
