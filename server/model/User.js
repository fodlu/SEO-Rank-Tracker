import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		requires: true,
		trim: true,
	},
	email: {
		type: String,
		unique: true,
		lowercase: true,
		requires: true,
		trim: true,
	},
	password: {
		type: String,
		requires: true,
	},
    plan: {
        type: String,
        enum: ["Free", "Pro"],
        default: "Free"
    },
    analysisCount: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: null
    }
}, {timestamps: true});

const User = mongoose.model("User", userSchema)

export default User;