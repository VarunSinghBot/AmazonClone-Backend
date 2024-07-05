const mongoose = require("mongoose");

const OrderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        type: Object,
        required: true
    },
    contactDetails: {
        type: String,
        required: true
    },
    orderedItems: {
        type: Array, 
        ref: 'Product', 
        required: true
    },
    totalPrice: { 
        type: Number, 
        required: true 
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
