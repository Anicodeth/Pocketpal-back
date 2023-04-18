const express = require('express');
const mongoose = require('mongoose');
const { Configuration, OpenAIApi } = require("openai");
const cors = require('cors');
const router = express.Router();
const app = express();
const jwt = require('jsonwebtoken');
const { User } = require('./Models/user');


//Open Ai Api Configuration
const config = new Configuration({
  apiKey:  "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"
});

mongoose.connect('mongodb+srv://afmtoday:OlxwPFCF0rLMnA3e@cluster0.edrrjyh.mongodb.net/pocketpal?retryWrites=true&w=majority')
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Error connecting to MongoDB', err));


// Middleware to parse JSON request bodies
app.use(express.json());

// Endpoint for user sign-up
app.post('/signup', async (req, res) => {
  try {
    // Create a new user document based on the request body
    const user = new User(req.body);
    // Save the new user to the database
    await user.save();
    // Return a success message and the newly created user document
    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    // Return an error message if the user creation fails
    res.status(400).json({ error: error.message });
  }
});


app.post('/signin', async (req, res) => {
  try {
    // Check if the email and password are valid
    const { email, password } = req.body;
    const user = await User.findOne({email: email, password: password});
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Generate a JWT for the user
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "Ananya");

    // Return the user and token in the response
    res.json({ user, token });
  } catch (error) {
    // Return an error message if the sign-in fails
    res.status(401).json({ error: error.message });
  }
});


app.get('/profile', async (req, res) => {
  try {
    // Verify token
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "Ananya");
    
    // Get the requested budget for the authenticated user
    const profile = await User.findById(decoded.userId);;

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
   
    res.status(401).json({ error: 'Unauthorized' });
  }
});


app.post('/budgets/:month/:year/expenses',  (req, res) => {

  const token = req.header('Authorization').replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "Ananya");

  const { month, year } = req.params;
  const { name, amount, category } = req.body;
  
  // Find the user's budget for the given month and year
  User.findOne({ _id: decoded.userId, 'budgets.month': month, 'budgets.year': year })
    .then(user => {
 
      if (!user) {
        return res.status(404).json({ message: 'Budget not found for the given month and year' });
      }
      
      // Find the budget object within the user object
      const budget = user.budgets.find(b => b.month == month && b.year == year);

      console.log(budget);
      
      // Add the new expense to the budget object
      budget.expenses.push({ name, amount, category });
      console.log(budget);
      // Save the updated user object
      user.save().then(() => {
          res.status(200).json({ message: 'Expense added successfully' });
        })
        .catch(error => {
          console.log(error);
          res.status(500).json({ message: 'Internal server error' });
        });
    })
    .catch(error => {
      res.status(500).json({ message: 'Internal server error' });
    });
});


app.post('/budgets', async (req, res) => {

  const token = req.header('Authorization').replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "Ananya");

  try {
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const { month, year, balance } = req.body;

    const budget = {
      month: month,
      year: year,
      balance: balance,
  
    };

    user.budgets.push(budget);

     await user.save();

    res.status(201).send(budget);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error' });
  }
});



// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});


module.exports = app;