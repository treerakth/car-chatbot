const db = require("../../config/db");

const saveRefreshToken = async (userId, token) => {
    return db.query("INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)", [userId, token]);
};

const getRefreshToken = async (token) => {
    const [result] = await db.query("SELECT * FROM refresh_tokens WHERE token = ?", [token]);
    return result.length ? result[0] : null;
};

const deleteRefreshToken = async (token) => {
    return db.query("DELETE FROM refresh_tokens WHERE token = ?", [token]);
};

const deleteTokensByUser = async (userId) => {
    return db.query("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);
};

module.exports = { saveRefreshToken, getRefreshToken, deleteRefreshToken, deleteTokensByUser };
