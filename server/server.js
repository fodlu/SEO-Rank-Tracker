import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import express from 'express';
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js';

connectDB()
const app = express();

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.send('Server is running'))

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=> console.log(`Server is running on PORT ${PORT}`))