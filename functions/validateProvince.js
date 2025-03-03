const { GoogleGenerativeAI } = require("@google/generative-ai");
const provincesAlias = require("./provincesAlias");

// Initialize Google Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function validateProvince(province) {
    try {
        // แปลง input เป็น lowercase และตัดช่องว่างหน้า/หลัง
        const normalizedProvince = province.trim().toLowerCase();

        // ✅ เช็คจาก provincesAlias ก่อน
        if (provincesAlias[normalizedProvince]) {
            return { valid: true, province: provincesAlias[normalizedProvince] };
        }

        // ✅ ถ้าตรงกับชื่อจังหวัดอยู่แล้ว ให้ใช้ได้เลย
        const prompt = `โปรดตรวจสอบว่า "${province}" เป็นชื่อจังหวัดในประเทศไทยที่ถูกต้องและตรงเป๊ะหรือไม่ ถ้าใช่ กรุณาตอบกลับด้วยชื่อจังหวัดนั้นอย่างเดียว โดยไม่มีข้อความเพิ่มเติม ถ้าไม่ใช่ กรุณาตอบว่า "null" เท่านั้น`;

        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const textResponse = response.response.text().trim();

        if (textResponse.toLowerCase() === "null") {
            // ✅ ถ้าไม่ถูกต้อง ขอให้ AI แนะนำจังหวัดที่ใกล้เคียงที่สุด
            const suggestPrompt = `โปรดแนะนำชื่อจังหวัดในประเทศไทยที่ใกล้เคียงกับ "${province}" มากที่สุด โดยพิจารณาทั้งชื่อเต็ม ชื่อย่อ และคำสะกดผิด หากพบหลายตัวเลือก ให้เลือกจังหวัดที่ใกล้เคียงที่สุดเพียงหนึ่งชื่อ และตอบกลับเฉพาะชื่อจังหวัดเท่านั้น (ห้ามมีข้อความอื่นเพิ่มเติม)`;

            const suggestResponse = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: suggestPrompt }] }]
            });

            const suggestedProvince = suggestResponse.response.text().trim();
            return { valid: false, suggestion: suggestedProvince };
        }

        return { valid: true, province: textResponse };
    } catch (error) {
        console.error("Error validating province:", error);
        return { valid: false, suggestion: null };
    }
}

module.exports = { validateProvince };
