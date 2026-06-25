import bcrypt from 'bcrypt'
import User from "../model/User.js";
import jwt from 'jsonwebtoken'

// generate jwt token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '7d'})
}

// Register user
export const register = async (req, res) => {
    try {
        const {name, email, password} = req.body;

        if(!name || !email || !password) {
            return res.status(400).json({success: false, message: "All fields are required"})
        }

        // check if user exist
        const exisitngUser = await User.findOne({email})
        if(exisitngUser) return res.status(400).json({success: false, message: "User already exists"});

        const hashed = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashed
        })

        const token = generateToken(newUser._id)

        res.status(201).json({success: true, user, token, message: "User registered successfuly"})
    } catch (error) {
        console.error("Register error: ", error.message)
        res.status(500).json({success: false, message: "Server Error"})
    }
}

// Login user
export const login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({success: false, message: "All fields are required"})
        }

        // find user
        const user = await User.findOne({email})
        if(!user) return res.status(400).json({success: false, message: "Invalid email or credentials"});

        // check password
        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch) return res.status(400).json({success: false, message: "Invalid credentials"});

        const token = generateToken(user._id)

        res.status(201).json({success: true, user, token, message: "User login successfuly"})
    } catch (error) {
        console.error("Register error: ", error.message)
        res.status(500).json({success: false, message: "Server Error"})
    }
}

// Get current user
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if(!user) {
            return res.status(400).json({success: false, message: "User not found"})
        }

        res.json({success: true, user})
    } catch (error) {
        console.error("Get user error: ", error.message)
        res.status(500).json({success: false, message: "Server Error"})
    }
}