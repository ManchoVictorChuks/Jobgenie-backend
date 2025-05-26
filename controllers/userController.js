const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, phoneNumber, gender } = req.body;

        // Validate required fields
        if (!fullName || !email || !password || !phoneNumber || !gender) {
            return res.status(400).json({ 
                message: process.env.FORM_INCOMPLETE_ERROR || "Please fill all required fields"
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Use a stronger salt rounds (12 is recommended)
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const userData = {
            fullName,
            email,
            password: hashedPassword, // Store the hashed password
            phoneNumber,
            gender
        };

        const newUser = await User.create(userData);

        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: "User registered successfully",
            user: userResponse
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: "Error registering user: " + error.message });
    }
};

// Update login function to use async/await properly
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "24h" }
    );

    res.status(200).json({ 
      token, 
      user: userResponse 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error occurred" });
  }
};

const getTestUser = async (req, res) => {
  try {
    const testUser = await User.findOne({ name: 'victor' });
    if (testUser) {
      res.json({ email: testUser.email, name: testUser.name });
    } else {
      // Create test user if it doesn't exist
      const testUser = await User.create({
        name: 'victor',
        email: 'victor.test@example.com',
        password: 'test123456'
      });
      res.json({ email: testUser.email, name: testUser.name });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserByUsername = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { fullName, phoneNumber, gender } = req.body;
        const user = await User.findOne({ username: req.params.username });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update only allowed fields
        if (fullName) user.fullName = fullName;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (gender) user.gender = gender;

        const updatedUser = await user.save();
        res.json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserFiles = async (req, res) => {
    try {
        const { userId } = req.params;
        const files = req.files || {};
        const updates = {};

        if (files.cv) {
            const cvUrl = await uploadToStorage(files.cv[0]);
            updates.cv = {
                url: cvUrl,
                filename: files.cv[0].originalname,
                uploadedAt: new Date()
            };
        }

        if (files.resume) {
            const resumeUrl = await uploadToStorage(files.resume[0]);
            updates.resume = {
                url: resumeUrl,
                filename: files.resume[0].originalname,
                uploadedAt: new Date()
            };
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true }
        );

        res.json({ message: 'Files updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  registerUser,
  loginUser,
  getTestUser,
  getUserByUsername,
  updateUser,
  updateUserFiles
};
