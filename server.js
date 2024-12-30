const express = require("express");
const yahooFinance = require("yahoo-finance2").default;
const axios = require('axios'); // Add this line at the top

const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // Enable CORS for frontend to communicate with this server
app.use(express.json()); // For parsing application/json

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

// Stock Market News Endpoint

app.get("/news", async (req, res) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
            q: 'stock market',
            apiKey: NEWS_API_KEY,  // Use your NewsAPI key
            pageSize: 5,
        }
    });

    res.json(response.data);
} catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Error fetching stock news." });
}
});

// Stock Symbol Search Endpoint
app.get("/search", async (req, res) => {
    const { query } = req.query;
    
    // Debugging log to check incoming request
  
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter." });
    }
  
    try {
      // Replace with the correct Yahoo Finance API call
      const results = await yahooFinance.search(query); // Replace with actual search function
      
      return res.json(results);
    } catch (err) {
      console.error("Error fetching stock suggestions:", err);
      return res.status(500).json({ error: "Error fetching stock suggestions." });
    }
  });
  

//Real-Time Stock Data Endpoint

app.get("/stocks", async (req, res) => {
  const symbols = req.query.symbols?.split(",").map((symbol) => symbol.trim()) || [];

  if (symbols.length === 0) {
    return res.status(400).json({ error: "No symbols provided." });
  }

  try {
    const stockDataPromises = symbols.map(async (symbol) => {
      try {
        console.log(`Fetching data for ${symbol}`);
        const data = await yahooFinance.quote(symbol);
        return {
          symbol: data.symbol,
          name: data.shortName,
          price: data.regularMarketPrice,
          change: data.regularMarketChange,
          changePercent: data.regularMarketChangePercent,
        };
      } catch (err) {
        console.error(`Error fetching data for ${symbol}:`, err.message);
        return { symbol, error: "Failed to fetch data" };
      }
    });

    const stockData = await Promise.all(stockDataPromises);

    const formattedData = stockData.filter((data) => !data.error);
    if (formattedData.length === 0) {
      return res.status(404).json({ error: "No valid stock data found." });
    }

    res.json(formattedData);
  } catch (err) {
    console.error("Error fetching stock data:", err.message);
    res.status(500).json({ error: "Error fetching stock data." });
  }
});
// // Stock Simulation endpoint (unchanged)
// app.get("/simulate", async (req, res) => {
//   const { symbol, amount, start_date, end_date } = req.query;

//   if (!symbol || !amount || !start_date || !end_date) {
//     return res.status(400).json({ error: "Missing required parameters." });
//   }

//   try {
//     // Fetch stock data from Yahoo Finance
//     const historicalData = await yahooFinance.historical(symbol, {
//       period1: start_date,
//       period2: end_date,
//       interval: "1d",
//     });

//     const startPrice = historicalData[0].close;
//     const endPrice = historicalData[historicalData.length - 1].close;

//     const growthRate = (endPrice - startPrice) / startPrice;
//     const simulatedValue = (amount * (1 + growthRate)).toFixed(2);

//     return res.json({ simulated_value: simulatedValue });
//   } catch (err) {
//     console.error("Error fetching stock data", err);
//     return res.status(500).json({ error: "Error fetching stock data." });
//   }
// });
app.get("/simulate", async (req, res) => {
  const { symbol, amount, start_date, end_date } = req.query;

  if (!symbol || !amount || !start_date || !end_date) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    // Fetch stock data from Yahoo Finance
    const historicalData = await yahooFinance.historical(symbol, {
      period1: start_date,
      period2: end_date,
      interval: "1d",
    });

    if (historicalData.length === 0) {
      return res.status(404).json({ error: "No historical data found for the given symbol." });
    }

    // Prepare data for chart
    const dates = historicalData.map((data) => data.date);
    const closingPrices = historicalData.map((data) => data.close);

    // Calculate growth and simulated value
    const startPrice = historicalData[0].close;
    const endPrice = historicalData[historicalData.length - 1].close;
    const growthRate = (endPrice - startPrice) / startPrice;
    const simulatedValue = (amount * (1 + growthRate)).toFixed(2);

    // Send the historical data along with the simulated value
    return res.json({
      simulated_value: simulatedValue,
      dates,
      closingPrices,
    });
  } catch (err) {
    console.error("Error fetching stock data", err);
    return res.status(500).json({ error: "Error fetching stock data." });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
