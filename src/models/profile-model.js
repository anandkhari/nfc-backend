const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-schema for individual phone numbers
const PhoneSchema = new Schema({
    type: { type: String, trim: true },
    number: { type: String, trim: true },
}, { _id: false });

// Sub-schema for individual email addresses
const EmailSchema = new Schema({
    type: { type: String, trim: true },
    address: { type: String, trim: true },
}, { _id: false });

// Sub-schema for individual social media links
const SocialLinkSchema = new Schema({
    platform: { type: String, required: true },
    link: { type: String, required: true, trim: true },
    handle: { type: String, trim: true },
}, { _id: false });

// Main Profile Schema
const ProfileSchema = new Schema({
    // Link the profile to the admin (one admin can have multiple profiles)
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
        // removed unique: true
    },
    
    // Each customer must have a unique NFC link
    nfcLink: { 
        type: String, 
        required: true, 
        unique: true 
    },

    // --- Core Profile Info ---
    name: {
        type: String,
        required: true,
        trim: true,
    },
    profileImageUrl: {
        type: String,
        default: '',
    },
    title: { 
        type: String,
        trim: true,
    },
    company: {
        type: String,
        trim: true,
    },
    jobTitle: { 
        type: String,
        trim: true,
    },

    // --- Contact Details ---
    phones: [PhoneSchema], 
    emails: [EmailSchema],   
    website: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    addressLink: {
        type: String,
        trim: true,
    },

    // --- Social Media & Gallery ---
    socials: [SocialLinkSchema],
    galleryImages: [{
        type: String,
    }],

    // --- Theme & Layout Settings ---
    theme: {
        template: { type: String, default: 'template2' },
        showGallery: { type: Boolean, default: true },
        showSocials: { type: Boolean, default: true },
        primaryColor: { type: String, default: '#007A8A' },
        accentColor: { type: String, default: '#00AEEF' },
        iconColor: { type: String, default: '#00AEEF' },
        titleTextColor: { type: String, default: '#FFFFFF' },
        bioTextColor: { type: String, default: '#E5E7EB' },
        fontFamily: { type: String, default: "'Inter', sans-serif" },
    },

}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);
