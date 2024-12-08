const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        default: 'buyer'
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Only hash password if it's modified and not a Google auth
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || this.password === 'google-auth') {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    try {
        console.log('Matching password for user:', this.email);
        console.log('Entered password:', enteredPassword);
        console.log('Stored hashed password:', this.password);
        
        if (this.googleId) {
            console.log('This is a Google user');
            return false;
        }
        
        const isMatch = await bcrypt.compare(enteredPassword, this.password);
        console.log('Password match result:', isMatch);
        return isMatch;
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);
