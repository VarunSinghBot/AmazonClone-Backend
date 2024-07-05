const mongoose = require("mongoose");

const ProductSchema = mongoose.Schema({
  title: { 
    type: String,
    required: true
  },
  url: { 
    type: String,
    required: true
  },
  price: { 
    type: Number,
    required: true
   },
  rate: { 
    type: Number,
    required: true,
    min: 0,
    max: 5
  }
},{timestamps: true});

module.exports = mongoose.model("Product", ProductSchema);