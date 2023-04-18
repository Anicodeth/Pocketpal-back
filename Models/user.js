const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const personSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  budgets: [
    {
      month: { type: Number, required: true },
      year: { type: Number, required: true },
      balance: { type: Number, required: true },
      expenses: [
        {
          name: { type: String, required: true },
          amount: { type: Number, required: true },
          category: { type: String, required: true }
        }
      ]
    }
  ]
});

const User = mongoose.model('Person', personSchema);

module.exports = { User };