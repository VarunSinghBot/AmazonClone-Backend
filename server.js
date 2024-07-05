require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Product = require('./product.model.js');
const User = require("./user.model.js");
const Order = require("./order.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();


// Middleware
app.use(express.json());
//Cross Origins
app.use(cors());


// Middleware for verifying JWT tokens
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get token from Authorization header
  
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token.' });
    }
};

// Connection port .env
const port = process.env.PORT || 3000;
// Connection for MongoDB .env
const connection_url = process.env.MONGO_URL;
;(async () => {
    try {
        await mongoose.connect(connection_url);
        console.log('MongoDB connected successfully');
        
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
})();


// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB'); // Connection event handler
});
  
mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err); // Connection error event handler
});
  
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from DB'); // Disconnection event handler
});

// API Routes
app.get('/', (req, res) => res.status(200).send(('Hello World!')));

// Route to add an order
app.post('/order/add', authenticateJWT, async (req, res) => {
    const { address, contactDetails, orderedItems, totalPrice} = req.body;
    console.log({ address, contactDetails, orderedItems });

    try {
        if (!address || !contactDetails || !orderedItems) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newOrder = new Order({
            user: req.user.id,
            address,
            contactDetails,
            orderedItems,
            totalPrice
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order created successfully', newOrder });
    } catch (error) {
        console.error('Error adding order:', error);
        res.status(500).json({ error: 'Failed to add order' });
    }
});

// Route to fetch orders for a user
app.get('/order/user/', authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.id;
      const orders = await Order.find({ user: userId }).populate('user').populate('orderedItems.product');
      res.status(200).json({ orders });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ error: 'Failed to fetch user orders' });
    }
  });

// Route to handle search for products
app.get('/product/search', async (req, res) => {
    const searchQuery = req.query.search;
  
    try {
      // Perform case-insensitive search by title using regex
      const regex = new RegExp(searchQuery, 'i');
      const searchedProducts = await Product.find({ title: regex });
  
      res.status(200).json(searchedProducts);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ error: 'Failed to search products' });
    }
});


// Route for signup - to push the User data to the Database
app.post('/user/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        };

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({message:"User created successfully",newUser});

    } catch (error){
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Failed to add user' });
    }
});

// Route for User Login - to check from the user database
app.post('/user/login', async (req, res) => {
    const { email, password } = req.body;
    console.log({email});
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token, user });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Failed to login user' });
    }
});


// Route to push the data to the DataBase
app.post('/product/add', async (req, res) => {
    const productDetail = req.body;
    console.log("Product Detail >>>>", productDetail);

    try {
        const newProduct = new Product(productDetail);
        await newProduct.save();
        res.status(201).send(newProduct);
    } catch (error) {
        console.error('Error saving product:', error);
        if (error instanceof mongoose.Error.ValidationError) {
            // Handle Mongoose validation errors
            res.status(400).json({ error: error.message });
        } else {
            // Handle other errors
            res.status(500).json({ error: 'Failed to save product' });
        }
    }
});

// Route to retrieve the data from the DataBase
app.get('/product/get', async (req, res) => {
    try {
        const products = await Product.find({}, { title: 1, url: 1, price: 1, rate: 1 });
        res.status(200).json(products);
    } catch (err) {
        console.error('Error retrieving products:', err);
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
});

// Start the server
app.listen(port, () => console.log(`Listening on port: ${port}`));
