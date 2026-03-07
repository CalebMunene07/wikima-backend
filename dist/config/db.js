"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // required for Render PostgreSQL
    },
});
const connectDB = async () => {
    try {
        const client = await exports.pool.connect();
        const result = await client.query("SELECT NOW()");
        console.log("✅ PostgreSQL connected at:", result.rows[0].now);
        client.release();
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1); // stop the server if DB fails
    }
};
exports.connectDB = connectDB;
