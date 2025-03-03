const jwt = require("jsonwebtoken");

//  ตรวจสอบว่า SECRET_KEY ถูกตั้งค่าใน .env หรือไม่
if (!process.env.SECRET_KEY) {
    console.error(" ERROR: SECRET_KEY is not set in .env file");
    process.exit(1); // หยุดการทำงานของเซิร์ฟเวอร์ทันที
}

const SECRET_KEY = process.env.SECRET_KEY;

//  Middleware ตรวจสอบ JWT Token
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const token = authHeader.split(" ")[1].trim();
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: Token is empty" });
        }

        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    return res.status(401).json({ error: "Token expired", refreshRequired: true });
                }
                return res.status(403).json({ error: "Invalid token" });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

//  Middleware ตรวจสอบสิทธิ์ Admin
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
};

//  Middleware ตรวจสอบสิทธิ์ Super Admin
const isSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "super_admin") {
        return res.status(403).json({ error: "Forbidden: Super Admin access required" });
    }
    next();
};

module.exports = { verifyToken, isAdmin, isSuperAdmin };
