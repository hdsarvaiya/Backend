const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Schema } = mongoose;
const path = require('path');
const fs = require('fs');
const port = process.env.PORT || 3000; // Use Render's dynamic port

const app = express();

// MongoDB connection URI
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://hdsarvaiya142004:bG4prFr61oI9vRB1@cluster0.wykyqsn.mongodb.net/Heheheheh';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const conn = mongoose.connection;

conn.once('open', () => {
  console.log("Connected to MongoDB");
});

// Define the schema for storing base64 encoded images
const imageSchema = new Schema({
  imageData: { type: String, required: true }, // Store image as base64 string
});

const ImageModel = mongoose.model('Image', imageSchema);

// Increase the limit for body parser to handle large image uploads
app.use(bodyParser.json({ limit: '50mb' })); // Allow up to 50MB for JSON payload
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Route to handle image upload
app.post('/uploadImages', async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData || imageData.length === 0) {
      return res.status(400).json({ message: 'No images received' });
    }

    // Save images to MongoDB as base64 string
    for (let i = 0; i < imageData.length; i++) {
      const newImage = new ImageModel({
        imageData: imageData[i], // Storing the base64 encoded string
      });

      await newImage.save(); // Save image document in MongoDB
    }

    console.log(`Successfully uploaded ${imageData.length} images`);
    res.status(200).json({ message: 'Images successfully uploaded to MongoDB' });
  } catch (error) {
    console.error("Error uploading images: ", error);
    res.status(500).json({ message: 'Error uploading images', error });
  }
});

app.get('/', async (req, res) => {
    try {
      // Fetch all images from MongoDB
      const images = await ImageModel.find();
  
      if (!images || images.length === 0) {
        return res.status(404).json({ message: 'No images found' });
      }
  
      // Serve the images directly on the HTML page
      res.status(200).send(`
        <html>
          <head>
            <title>Image Gallery</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
              }
              img {
                max-width: 100%;
                height: auto;
                margin: 20px;
              }
              .gallery {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
              }
              .gallery img {
                margin: 10px;
                max-width: 300px;
              }
            </style>
          </head>
          <body>
            <h1>Image Gallery</h1>
            <div class="gallery">
              ${images.map(img => `<img src="data:image/jpeg;base64,${img.imageData}" alt="Uploaded Image" />`).join('')}
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error fetching images: ', error);
      res.status(500).json({ message: 'Error fetching images', error });
    }
  });
  
  // Serve static files like HTML, CSS, etc.
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Serve the index.html file at the root
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
