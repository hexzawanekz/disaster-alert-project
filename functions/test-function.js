/**
 * ไฟล์สำหรับทดสอบฟังก์ชัน Firebase ในเครื่องท้องถิ่น
 * วิธีใช้: node test-function.js
 */

// ตั้งค่า .env
require("dotenv").config({ path: "../.env" });

// โหลด Firebase Functions Test SDK
const firebaseFunctionsTest = require("firebase-functions-test")();

// จำลองค่า Firebase Config
firebaseFunctionsTest.mockConfig({
  line: {
    notify_token: process.env.LINE_NOTIFY_TOKEN || "test_token",
  },
  openweather: {
    api_key: process.env.OPENWEATHER_API_KEY || "test_key",
  },
  gistda: {
    api_key: process.env.GISTDA_API_KEY || "test_key",
  },
});

// โหลดฟังก์ชัน
const functions = require("./index");

// สร้างข้อมูลจำลองสำหรับ context
const context = {
  timestamp: new Date().toISOString(),
};

// เลือกฟังก์ชันที่ต้องการทดสอบ (เอาเครื่องหมาย // ออกเพื่อทดสอบฟังก์ชันที่ต้องการ)
async function runTests() {
  try {
    console.log("เริ่มการทดสอบ...");

    // ทดสอบฟังก์ชันแจ้งเตือนแผ่นดินไหว
    // await functions.checkEarthquakes(null, context);

    // ทดสอบฟังก์ชันแจ้งเตือนน้ำท่วม
    // await functions.checkFloodAlerts(null, context);

    // ทดสอบฟังก์ชันแจ้งเตือนไฟไหม้
    // await functions.checkFireAlerts(null, context);

    console.log("การทดสอบเสร็จสมบูรณ์");
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
  } finally {
    // ทำความสะอาด
    firebaseFunctionsTest.cleanup();
    process.exit(0);
  }
}

// เรียกใช้การทดสอบ
runTests();
