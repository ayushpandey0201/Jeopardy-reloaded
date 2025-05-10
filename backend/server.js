const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:8080', // Update this to your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow credentials if needed
}));
app.use(express.json());

// MongoDB Connection with updated options
console.log('Attempting to connect to MongoDB...');
const MONGODB_URI = 'mongodb+srv://ayushpandeyad23:MKt2TSaP1FzmhYzv@cluster0.qwwluzh.mongodb.net/jeopardy_db?retryWrites=true&w=majority';
console.log('Connection URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
.then(() => {
  console.log('Successfully connected to MongoDB Atlas');
})
.catch((err) => {
  console.error('MongoDB connection error details:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Game Schema
const questionSchema = new mongoose.Schema({
  id: String,
  text: String,
  difficulty: String,
  visited: Boolean
});

const categorySchema = new mongoose.Schema({
  id: String,
  name: String,
  questions: [questionSchema]
});

const gameSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  categories: [categorySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);
    
    const user = await User.findOne({ username });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // In a real application, you would compare hashed passwords
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      message: 'Login successful',
      token,
      user: {
        username: user.username,
        id: user._id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Registration attempt for username:', username);

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Create new user
    const user = new User({ username, password });
    await user.save();
    console.log('User registered successfully:', username);

    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Game routes
app.post('/api/games', authenticateToken, async (req, res) => {
  try {
    const { categories, name } = req.body;
    const userId = req.user.userId;

    const game = new Game({
      userId,
      name,
      categories
    });

    await game.save();
    console.log('Game saved successfully for user:', userId);

    res.status(201).json({ success: true, message: 'Game saved successfully', game });
  } catch (error) {
    console.error('Save game error:', error);
    res.status(500).json({ success: false, message: 'Failed to save game' });
  }
});

app.get('/api/games', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const games = await Game.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, games });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve games' });
  }
});

// Add DELETE endpoint for games
app.delete('/api/games/:gameId', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.userId;

    // Find and delete the game, ensuring it belongs to the user
    const game = await Game.findOneAndDelete({ _id: gameId, userId });

    if (!game) {
      return res.status(404).json({ 
        success: false, 
        message: 'Game not found or you do not have permission to delete it' 
      });
    }

    console.log('Game deleted successfully:', gameId);
    res.json({ success: true, message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete game' });
  }
});

// Add PUT endpoint for updating questions
app.put('/api/games/:gameId/questions/:questionId', authenticateToken, async (req, res) => {
  try {
    const { gameId, questionId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    // Find the game and ensure it belongs to the user
    const game = await Game.findOne({ _id: gameId, userId });
    if (!game) {
      return res.status(404).json({ 
        success: false, 
        message: 'Game not found or you do not have permission to edit it' 
      });
    }

    // Update the question text
    let questionUpdated = false;
    game.categories.forEach(category => {
      category.questions.forEach(question => {
        if (question.id === questionId) {
          question.text = text;
          questionUpdated = true;
        }
      });
    });

    if (!questionUpdated) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found' 
      });
    }

    // Save the updated game
    await game.save();
    console.log('Question updated successfully:', questionId);

    res.json({ 
      success: true, 
      message: 'Question updated successfully',
      game 
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ success: false, message: 'Failed to update question' });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
console.log('Attempting to start server on port:', PORT);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 