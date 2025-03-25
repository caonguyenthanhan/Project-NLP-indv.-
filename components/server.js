const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

app.get("/api/scrape", async (req, res) => {
  const { url, dataset } = req.query;
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const $ = cheerio.load(response.data);
    let data = [];

    if (dataset === "imdb") {
      $(".lister-item-content").each((i, el) => {
        const title = $(el).find("h3 a").text();
        const rating = $(el).find(".ratings-imdb-rating strong").text();
        const year = $(el).find(".lister-item-year").text().replace(/[()]/g, "");
        const director = $(el).find("p.text-muted a").first().text();
        data.push({ title, rating, year, director });
      });
    } else if (dataset === "books") {
      $(".product_pod").each((i, el) => {
        const title = $(el).find("h3 a").attr("title");
        const price = $(el).find(".price_color").text();
        const availability = $(el).find(".instock.availability").text().trim();
        data.push({ title, price, availability });
      });
    } else if (dataset === "ecommerce") {
      $(".product-item").each((i, el) => {
        const title = $(el).find(".product-title").text();
        const price = $(el).find(".product-price").text();
        const rating = $(el).find(".star-rating").attr("data-rating");
        data.push({ title, price, rating });
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Scraping failed" });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
