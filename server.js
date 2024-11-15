const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Schema } = mongoose;
const path = require('path');
const fs = require('fs');
const port = 3000;  // Updated port to 5500

const app = express();

// MongoDB connection URI
const mongoURI = 'mongodb+srv://hdsarvaiya142004:bG4prFr61oI9vRB1@cluster0.wykyqsn.mongodb.net/mernstack';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true , serverSelectionTimeoutMS: 5000,});

const conn = mongoose.connection;

conn.once('open', () => {
  console.log("Connected to MongoDB");
});
const formDataSchema = new Schema({
  selectedSpecies: String,
  selectedBreed: String,
  selectedBreedType: String,
  selectedBodyColor: String, // Added body color
  selectedLeftHorn: String, // Added left horn option
  selectedRightHorn: String, // Added right horn option
  selectedTailSwitch: String, // Added tail switch state
  selectedAge: Number,
  selectedMilkYield: Number, // Added milk yield field
  selectedLactation: Number,
  selectedCalvingMonth: String,
  selectedMilkYield : Number ,
  remarks: String, // Add remarks field
  createdAt: { type: Date, default: Date.now },
});

const FormDataModel = mongoose.model('FormData', formDataSchema);

// Define the schema for storing base64 encoded images
const imageSchema = new Schema({
  imageData: { type: String, required: true }, // Store image as base64 string
});

const ImageModel = mongoose.model('Image', imageSchema);

// Increase the limit for body parser to handle large image uploads
app.use(bodyParser.json({ limit: '50mb' })); // Allow up to 50MB for JSON payload
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.post('/api/submit', async (req, res) => {
  try {
    const {
      selectedSpecies,
      selectedBreed,
      selectedBreedType,
      selectedBodyColor,
      selectedLeftHorn,
      selectedRightHorn,
      selectedTailSwitch,
      selectedAge,
      selectedLactation,
      selectedCalvingMonth,
      selectedMilkYield,
      remarks,
    } = req.body;

    // Create a new document with the received form data
    const newFormData = new FormDataModel({
      selectedSpecies,
      selectedBreed,
      selectedBreedType,
      selectedBodyColor,
      selectedLeftHorn,
      selectedRightHorn,
      selectedTailSwitch,
      selectedAge,
      selectedLactation,
      selectedCalvingMonth,
      selectedMilkYield,
      remarks,
    });

    // Save the form data to MongoDB
    await newFormData.save();

    console.log('Form data saved successfully:', newFormData);
    res.status(200).json({ message: 'Form data successfully submitted' });
  } catch (error) {
    console.error('Error saving form data:', error);
    res.status(500).json({ message: 'Error saving form data', error });
  }
});

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
  
  // Route to fetch form data from MongoDB
// Route to fetch form data from MongoDB and display it in table format
app.get('/api/formData', async (req, res) => {
  try {
    const formData = await FormDataModel.find(); // Fetch all form data from the database
    
    // Check if data exists
    if (!formData || formData.length === 0) {
      return res.status(404).send('No form data found.');
    }

    // Generate HTML table with form data
    let tableRows = formData.map((data) => {
      return `
        <tr>
          <td>${data.selectedSpecies}</td>
          <td>${data.selectedBreed}</td>
          <td>${data.selectedBreedType}</td>
          <td>${data.selectedBodyColor}</td> <!-- Added Body Color -->
          <td>${data.selectedLeftHorn}</td> <!-- Added Left Horn -->
          <td>${data.selectedRightHorn}</td> <!-- Added Right Horn -->
          <td>${data.selectedTailSwitch}</td> <!-- Added Tail Switch -->
          <td>${data.selectedAge}</td>
          <td>${data.selectedLactation}</td>
          <td>${data.selectedCalvingMonth}</td>
          <td>${data.selectedMilkYield}</td> <!-- Added Milk Yield -->
          <td>${data.remarks}</td> <!-- Added Milk Yield -->
        </tr>
      `;
    }).join('');

    // Return the table with form data
    res.status(200).send(`
      <html>
        <head>
          <title>Form Data</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th, td {
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
            }
          </style>
        </head>
        <body>
          <h1>Form Data Table</h1>
          <table>
            <thead>
              <tr>
                <th>Species</th>
                <th>Breed</th>
                <th>Breed Type</th>
                <th>Body Color</th> <!-- Added Body Color Column -->
                <th>Left Horn</th> <!-- Added Left Horn Column -->
                <th>Right Horn</th> <!-- Added Right Horn Column -->
                <th>Tail Switch</th> <!-- Added Tail Switch Column -->
                <th>Age</th>
                <th>Lactation</th>
                <th>Calving Month</th>
                <th>Milk Yield</th> <!-- Added Milk Yield Column -->
                <th>Remarks</th> <!-- Added Milk Yield Column -->
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error fetching form data: ', error);
    res.status(500).json({ message: 'Error fetching form data', error });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
