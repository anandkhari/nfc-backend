const mongoose = require('mongoose')

const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true }, // Sparse allows nulls while enforcing uniqueness on non-null values
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', AdminSchema);

