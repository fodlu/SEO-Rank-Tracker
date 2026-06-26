import bcrypt from "bcrypt";
import User from "../model/User.js";
import jwt from "jsonwebtoken";

// generate jwt token
const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register user
export const register = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password) {
			return res
				.status(400)
				.json({ success: false, message: "All fields are required" });
		}

		// check if user exist
		const exisitngUser = await User.findOne({ email });
		if (exisitngUser)
			return res
				.status(400)
				.json({ success: false, message: "User already exists" });

		const hashed = await bcrypt.hash(password, 10);

		const newUser = await User.create({
			name,
			email,
			password: hashed,
		});

		const token = generateToken(newUser._id);

		res.status(201).json({
			success: true,
			user: {
				id: newUser._id,
				name: newUser.name,
				email: newUser.email,
			},
			token,
			message: "User registered successfully",
		});
	} catch (error) {
		console.error("Register error: ", error.message);
		res.status(500).json({ success: false, message: "Server Error" });
	}
};

// Login user
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// 1. Validate input existence
		if (!email || !password) {
			return res
				.status(400)
				.json({ success: false, message: "All fields are required" });
		}

		// 2. Locate user and explicitly exclude sensitive fields if your schema defaults include it
		const user = await User.findOne({ email });
		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid credentials" });
		}

		// 3. Verify password hash
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid credentials" });
		}

		// 4. Generate authorization token
		const token = generateToken(user._id);

		// 5. Sanitize user data before sending response
		const { password: _, ...sanitizedUser } = user._doc || user;

		// 6. Return standard 200 OK status
		return res.status(200).json({
			success: true,
			user: sanitizedUser,
			token,
			message: "User login successfully"
		});

	} catch (error) {
		// Corrected contextual error logging
		console.error("Login error: ", error.message);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
};


// Get current user
export const getUser = async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("-password");
		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: "User not found" });
		}

		res.json({ success: true, user });
	} catch (error) {
		console.error("Get user error: ", error.message);
		res.status(500).json({ success: false, message: "Server Error" });
	}
};
