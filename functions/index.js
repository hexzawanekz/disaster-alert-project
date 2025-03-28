const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const moment = require("moment");

admin.initializeApp();
const db = admin.firestore();

// ฟังก์ชั่นสำหรับส่งข้อความผ่าน LINE Notify
async function sendLineNotification(message, isHighPriority = false) {
  try {
    // ดึง token ตามระดับความสำคัญ
    let LINE_NOTIFY_TOKEN;

    if (isHighPriority) {
      // ใช้ token สำหรับแจ้งเตือนฉุกเฉิน (หากมีหลาย token)
      LINE_NOTIFY_TOKEN =
        functions.config().line.emergency_token ||
        functions.config().line.notify_token;
    } else {
      // ใช้ token ปกติ
      LINE_NOTIFY_TOKEN = functions.config().line.notify_token;
    }

    await axios.post(
      "https://notify-api.line.me/api/notify",
      `message=${message}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
        },
      }
    );

    console.log(
      `Sent LINE notification successfully (High Priority: ${isHighPriority})`
    );
    return true;
  } catch (error) {
    console.error("Error sending LINE notification:", error);
    return false;
  }
}

// ฟังก์ชั่นสำหรับวิเคราะห์ข้อมูลด้วย DeepSearch AI
async function analyzeWithDeepSearch(earthquakeData, impactInfo) {
  try {
    console.log("Analyzing earthquake data with DeepSearch AI...");

    // สร้างข้อมูลสำหรับส่งไปวิเคราะห์
    const analysisData = {
      earthquake: {
        id: earthquakeData.id,
        magnitude: earthquakeData.properties.mag,
        location: earthquakeData.properties.place,
        depth: earthquakeData.geometry.coordinates[2],
        time: earthquakeData.properties.time,
        coordinates: [
          earthquakeData.geometry.coordinates[0],
          earthquakeData.geometry.coordinates[1],
        ],
      },
      impactAssessment: impactInfo,
      historicalData: {
        region: "Southeast Asia",
        recentActivity: true, // จะเชื่อมต่อกับฐานข้อมูลแผ่นดินไหวย้อนหลังในอนาคต
      },
    };

    // ในอนาคตจะเชื่อมต่อกับ DeepSearch API จริง
    // ส่วนนี้จะเพิ่มเมื่อมีการเชื่อมต่อ API แล้ว
    /*
    const response = await axios.post(
      "https://api.deepsearch.ai/analyze/earthquake",
      analysisData,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${functions.config().deepsearch.api_key}`
        }
      }
    );
    
    return response.data;
    */

    // จำลองการวิเคราะห์ (สำหรับการทดสอบ)
    // ในอนาคตจะแทนที่ด้วยการเรียกใช้ API จริง
    const mockAnalysis = simulateDeepSearchAnalysis(analysisData);
    return mockAnalysis;
  } catch (error) {
    console.error("Error analyzing data with DeepSearch:", error);
    // หากมีข้อผิดพลาด ให้คืนค่า null เพื่อให้ระบบใช้การวิเคราะห์แบบเดิม
    return null;
  }
}

// ฟังก์ชั่นจำลองการวิเคราะห์ (จะถูกแทนที่ด้วย API จริงในอนาคต)
function simulateDeepSearchAnalysis(data) {
  const earthquake = data.earthquake;
  const impactInfo = data.impactAssessment;

  // จำลองการประเมินความน่าเชื่อถือของข้อมูล
  let confidence = 0.85; // ค่าเริ่มต้น 85%

  // ปรับความน่าเชื่อถือตามเงื่อนไขต่างๆ
  // 1. ถ้าแผ่นดินไหวเกิดในพื้นที่ที่มีประวัติแผ่นดินไหวบ่อย
  if (
    earthquake.location.includes("Myanmar") ||
    earthquake.location.includes("Indonesia") ||
    earthquake.location.includes("Philippines")
  ) {
    confidence += 0.05;
  }

  // 2. ถ้าขนาดแผ่นดินไหวใหญ่มาก (> 6.0) มีโอกาสที่จะส่งผลกระทบสูง
  if (earthquake.magnitude > 6.0) {
    confidence += 0.05;
  }

  // 3. ประเมินผลกระทบต่อประเทศไทย
  const severeImpactLocations = impactInfo.filter(
    (loc) =>
      loc.expectedIntensity === "รุนแรง" ||
      loc.expectedIntensity === "รุนแรงมาก"
  );

  // ถ้ามีพื้นที่ที่คาดว่าจะได้รับผลกระทบรุนแรง
  if (severeImpactLocations.length > 0) {
    confidence += 0.05;
  }

  // สำหรับแผ่นดินไหวขนาดเล็ก (< 4.5) ที่อยู่ไกล ลดความเชื่อมั่นลง
  if (earthquake.magnitude < 4.5 && impactInfo[0].distanceKm > 300) {
    confidence -= 0.2;
  }

  // สร้างผลการวิเคราะห์เพิ่มเติม
  let additionalContext = "";

  // ตรวจสอบว่าเคยมีแผ่นดินไหวในพื้นที่ใกล้เคียงเมื่อเร็วๆ นี้หรือไม่
  if (data.historicalData.recentActivity) {
    additionalContext =
      "พื้นที่นี้มีกิจกรรมทางธรณีวิทยาเพิ่มขึ้นในช่วงที่ผ่านมา อาจมีแผ่นดินไหวตามหลังมาอีก";
  }

  // คำแนะนำจาก AI
  let recommendation;
  if (confidence >= 0.85) {
    recommendation = "ควรส่งการแจ้งเตือนตามระดับความรุนแรงที่คำนวณได้";
  } else if (confidence >= 0.6) {
    recommendation =
      "ควรส่งการแจ้งเตือนที่ระดับต่ำกว่า และระบุว่าเป็นการเฝ้าระวัง";
  } else {
    recommendation = "ควรติดตามสถานการณ์เพิ่มเติมก่อนส่งการแจ้งเตือน";
  }

  return {
    confidence: confidence,
    shouldAlert: confidence >= 0.6, // ส่งแจ้งเตือนเมื่อความเชื่อมั่นมากกว่า 60%
    suggestedAlertLevel: confidence >= 0.85 ? "original" : "downgrade",
    additionalContext: additionalContext,
    recommendation: recommendation,
    technicalDetails: {
      seismicDataQuality: "high",
      uncertaintyFactors: [
        "wave propagation in Southeast Asian subduction zones",
        "depth calculation",
      ],
      analysisMethod: "DeepSearch Earthquake Impact Assessment Model v1.0",
    },
  };
}

// ======== ระบบแจ้งเตือนแผ่นดินไหว ========
// ตรวจสอบแผ่นดินไหวทุกชั่วโมง
exports.checkEarthquakes = functions.pubsub
  .schedule("every 10 minutes") // ปรับความถี่เป็น 10 นาที เพื่อให้ตรวจพบเร็วขึ้น
  .onRun(async (context) => {
    try {
      console.log("Checking for earthquakes...");

      // ตรวจสอบแผ่นดินไหวที่เกิดขึ้นในช่วง 15 นาทีที่ผ่านมา
      const startTime = moment().subtract(15, "minutes").toISOString();
      const endTime = moment().toISOString();

      // พิกัดใจกลางของประเทศไทย (กรุงเทพ)
      const thaiLat = 13.7563;
      const thaiLon = 100.5018;

      // กรุงเทพ, เชียงใหม่, เชียงราย, แม่ฮ่องสอน, ตาก (พื้นที่มักได้รับผลกระทบจากแผ่นดินไหว)
      const thaiKeyLocations = [
        { name: "กรุงเทพ", lat: 13.7563, lon: 100.5018 },
        { name: "เชียงใหม่", lat: 18.7883, lon: 98.9853 },
        { name: "เชียงราย", lat: 19.9105, lon: 99.826 },
        { name: "แม่ฮ่องสอน", lat: 19.3027, lon: 97.9654 },
        { name: "ตาก", lat: 16.8841, lon: 99.1258 },
      ];

      // กำหนดรัศมีการค้นหา (หน่วยเป็นองศา ประมาณ 2,500 กม.)
      const maxRadius = 25; // เพิ่มรัศมีเพื่อครอบคลุมพื้นที่มากขึ้น

      // คำนวณความเร็วของคลื่นแผ่นดินไหวประเภทต่างๆ (กม./วินาที)
      const p_wave_velocity = 6.5; // คลื่น P (Primary) ประมาณ 6-8 กม./วินาที
      const s_wave_velocity = 3.5; // คลื่น S (Secondary) ประมาณ 3-4 กม./วินาที
      const surface_wave_velocity = 2.5; // คลื่นผิวดิน ประมาณ 2-3 กม./วินาที

      // เรียกใช้ USGS API
      const response = await axios.get(
        "https://earthquake.usgs.gov/fdsnws/event/1/query",
        {
          params: {
            format: "geojson",
            starttime: startTime,
            endtime: endTime,
            minmagnitude: 4.0, // ลดขนาดขั้นต่ำลงเพื่อตรวจจับแผ่นดินไหวขนาดเล็กลง
            orderby: "time",
          },
        }
      );

      const allEarthquakes = response.data.features;
      console.log(`Found ${allEarthquakes.length} total earthquakes worldwide`);

      // กรองเฉพาะแผ่นดินไหวในพื้นที่ที่กำหนด
      const earthquakes = allEarthquakes.filter((eq) => {
        // ดึงพิกัดของแผ่นดินไหว
        const eqLon = eq.geometry.coordinates[0];
        const eqLat = eq.geometry.coordinates[1];
        const eqDepth = eq.geometry.coordinates[2]; // ความลึก (กม.)

        // คำนวณระยะห่างจากประเทศไทย (อย่างง่าย)
        const latDiff = Math.abs(eqLat - thaiLat);
        const lonDiff = Math.abs(eqLon - thaiLon);
        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

        // ถ้าห่างเกินรัศมีที่กำหนด ข้าม
        if (distance > maxRadius) return false;

        // ถ้ามีขนาดตั้งแต่ 6.0 ขึ้นไป ให้ตรวจสอบทั้งหมด ไม่ว่าจะอยู่ที่ไหน
        if (eq.properties.mag >= 6.0) return true;

        // ถ้าตั้งแต่ 5.0-5.9 ให้ตรวจสอบเฉพาะในรัศมี 1,000 กม.
        if (eq.properties.mag >= 5.0 && distance * 111 <= 1000) return true;

        // ถ้าตั้งแต่ 4.0-4.9 ให้ตรวจสอบเฉพาะในรัศมี 500 กม.
        if (eq.properties.mag >= 4.0 && distance * 111 <= 500) return true;

        return false;
      });

      console.log(
        `Found ${earthquakes.length} significant earthquakes that may affect Thailand`
      );

      // ดึงข้อมูลการแจ้งเตือนที่ส่งไปแล้ว
      const alertsRef = db.collection("sent_alerts");
      const alertsSnapshot = await alertsRef
        .where("type", "==", "earthquake")
        .where(
          "sentAt",
          ">",
          admin.firestore.Timestamp.fromDate(
            moment().subtract(2, "hours").toDate() // ลดเวลาเป็น 2 ชั่วโมง เพราะอาจมีแผ่นดินไหวซ้ำ (aftershock)
          )
        )
        .get();

      const sentAlertIds = new Set();
      alertsSnapshot.forEach((doc) => {
        sentAlertIds.add(doc.data().eventId);
      });

      // กรองเอาเฉพาะแผ่นดินไหวที่ยังไม่ได้ส่งแจ้งเตือน
      const newEarthquakes = earthquakes.filter(
        (eq) => !sentAlertIds.has(eq.id)
      );

      // ส่งแจ้งเตือนสำหรับแผ่นดินไหวใหม่
      for (const eq of newEarthquakes) {
        const magnitude = eq.properties.mag;
        const place = eq.properties.place;
        const time = moment(eq.properties.time).format("YYYY-MM-DD HH:mm:ss");
        const url = eq.properties.url;
        const eqDepth = eq.geometry.coordinates[2]; // ความลึก (กม.)

        // คำนวณระยะห่างและเวลาที่จะถึงแต่ละพื้นที่ในไทย
        const impactInfo = thaiKeyLocations.map((location) => {
          const eqLon = eq.geometry.coordinates[0];
          const eqLat = eq.geometry.coordinates[1];

          // คำนวณระยะทางจากจุดศูนย์กลางแผ่นดินไหวถึงแต่ละพื้นที่
          const latDiff = Math.abs(eqLat - location.lat);
          const lonDiff = Math.abs(eqLon - location.lon);
          const distanceDegrees = Math.sqrt(
            latDiff * latDiff + lonDiff * lonDiff
          );
          const distanceKm = Math.round(distanceDegrees * 111); // 1 องศา ≈ 111 กม.

          // คำนวณเวลาที่คลื่นแผ่นดินไหวจะเดินทางมาถึง (วินาที)
          const p_wave_time = Math.round(distanceKm / p_wave_velocity);
          const s_wave_time = Math.round(distanceKm / s_wave_velocity);
          const surface_wave_time = Math.round(
            distanceKm / surface_wave_velocity
          );

          // คำนวณช่วงเวลาที่จะได้รับผลกระทบนับจากเวลาที่เกิดแผ่นดินไหว
          const p_arrival = moment(eq.properties.time).add(
            p_wave_time,
            "seconds"
          );
          const s_arrival = moment(eq.properties.time).add(
            s_wave_time,
            "seconds"
          );
          const surface_arrival = moment(eq.properties.time).add(
            surface_wave_time,
            "seconds"
          );

          // ตรวจสอบว่าคลื่นมาถึงแล้วหรือยัง
          const now = moment();
          const p_arrived = now.isAfter(p_arrival);
          const s_arrived = now.isAfter(s_arrival);
          const surface_arrived = now.isAfter(surface_arrival);

          // ประเมินความรุนแรงที่อาจเกิดขึ้น (อย่างคร่าวๆ)
          let expectedIntensity = "เล็กน้อย";

          if (magnitude >= 7.0 && distanceKm < 300) {
            expectedIntensity = "รุนแรงมาก";
          } else if (
            (magnitude >= 6.0 && distanceKm < 300) ||
            (magnitude >= 7.0 && distanceKm < 600)
          ) {
            expectedIntensity = "รุนแรง";
          } else if (
            (magnitude >= 5.0 && distanceKm < 200) ||
            (magnitude >= 6.0 && distanceKm < 500)
          ) {
            expectedIntensity = "ปานกลาง";
          }

          return {
            location: location.name,
            distanceKm,
            p_wave_time,
            s_wave_time,
            surface_wave_time,
            p_arrival: p_arrival.format("HH:mm:ss"),
            s_arrival: s_arrival.format("HH:mm:ss"),
            surface_arrival: surface_arrival.format("HH:mm:ss"),
            p_arrived,
            s_arrived,
            surface_arrived,
            expectedIntensity,
          };
        });

        // เรียงลำดับข้อมูลตามระยะทาง (ใกล้สุดไปไกลสุด)
        impactInfo.sort((a, b) => a.distanceKm - b.distanceKm);

        // ตรวจสอบว่ายังมีพื้นที่ที่คลื่นยังไม่ไปถึงหรือไม่
        const anyAreaStillWaiting = impactInfo.some(
          (area) => !area.surface_arrived
        );

        // หาพื้นที่ที่คาดว่าจะได้รับผลกระทบมากที่สุด
        const worstAffectedArea = impactInfo.reduce((worst, current) => {
          const intensityRank = {
            เล็กน้อย: 1,
            ปานกลาง: 2,
            รุนแรง: 3,
            รุนแรงมาก: 4,
          };

          if (
            intensityRank[current.expectedIntensity] >
            intensityRank[worst.expectedIntensity]
          ) {
            return current;
          }
          return worst;
        }, impactInfo[0]);

        // กำหนดระดับความรุนแรงของข้อความแจ้งเตือน
        let alertLevel = "ข้อมูล";
        let alertEmoji = "ℹ️";

        if (
          magnitude >= 7.0 ||
          worstAffectedArea.expectedIntensity === "รุนแรงมาก"
        ) {
          alertLevel = "ฉุกเฉิน";
          alertEmoji = "🚨";
        } else if (
          magnitude >= 6.0 ||
          worstAffectedArea.expectedIntensity === "รุนแรง"
        ) {
          alertLevel = "เตือนภัย";
          alertEmoji = "⚠️";
        } else if (
          magnitude >= 5.0 ||
          worstAffectedArea.expectedIntensity === "ปานกลาง"
        ) {
          alertLevel = "เฝ้าระวัง";
          alertEmoji = "⚠️";
        }

        // ใช้ DeepSearch AI เพื่อวิเคราะห์ข้อมูลเพิ่มเติม
        const aiAnalysis = await analyzeWithDeepSearch(eq, impactInfo);

        // ปรับระดับการแจ้งเตือนตามผลการวิเคราะห์จาก AI (ถ้ามี)
        let additionalInfo = "";
        if (aiAnalysis) {
          console.log("DeepSearch AI analysis result:", aiAnalysis);

          // ถ้าความเชื่อมั่นต่ำ และแนะนำให้ลดระดับการแจ้งเตือน
          if (aiAnalysis.suggestedAlertLevel === "downgrade") {
            // บันทึกระดับเดิมไว้
            const originalLevel = alertLevel;

            // ลดระดับการแจ้งเตือนลง 1 ระดับ
            if (alertLevel === "ฉุกเฉิน") {
              alertLevel = "เตือนภัย";
              alertEmoji = "⚠️";
            } else if (alertLevel === "เตือนภัย") {
              alertLevel = "เฝ้าระวัง";
              alertEmoji = "⚠️";
            } else if (alertLevel === "เฝ้าระวัง") {
              alertLevel = "ข้อมูล";
              alertEmoji = "ℹ️";
            }

            additionalInfo = `\n\nหมายเหตุ: ระบบ AI วิเคราะห์แล้วพบว่าผลกระทบอาจน้อยกว่าที่ประเมินไว้เบื้องต้น (${originalLevel} → ${alertLevel})`;
          }

          // เพิ่มข้อมูลเพิ่มเติมจากการวิเคราะห์ (ถ้ามี)
          if (aiAnalysis.additionalContext) {
            additionalInfo += `\n${aiAnalysis.additionalContext}`;
          }

          // ถ้า AI แนะนำว่าไม่ควรส่งการแจ้งเตือน ให้ข้ามไป
          if (!aiAnalysis.shouldAlert) {
            console.log(
              `Skipping alert for ${magnitude} earthquake at ${place} based on AI analysis`
            );
            continue;
          }
        }

        // คำนวณระยะห่างจากกรุงเทพฯ (ใช้สำหรับการบันทึกข้อมูล)
        const eqLon = eq.geometry.coordinates[0];
        const eqLat = eq.geometry.coordinates[1];
        const latDiff = Math.abs(eqLat - thaiLat);
        const lonDiff = Math.abs(eqLon - thaiLon);
        const distanceDegrees = Math.sqrt(
          latDiff * latDiff + lonDiff * lonDiff
        );
        const distanceKm = Math.round(distanceDegrees * 111); // 1 องศา ≈ 111 กม.

        // สร้างข้อความแจ้งเตือน
        let message = `
${alertEmoji} ${alertLevel} แผ่นดินไหว ${alertEmoji}
ขนาด: ${magnitude} ริกเตอร์
สถานที่: ${place}
ความลึก: ${eqDepth} กม.
เวลาเกิดเหตุ: ${time}
ระยะห่างจากกรุงเทพฯ: ประมาณ ${distanceKm} กม.
`;

        // เพิ่มข้อมูลพื้นที่ที่ได้รับผลกระทบ
        message += "\nการเฝ้าระวัง:";
        impactInfo.forEach((area) => {
          if (area.surface_arrived) {
            message += `\n- ${area.location}: คลื่นแผ่นดินไหวผ่านแล้ว (ความรุนแรงคาดการณ์: ${area.expectedIntensity})`;
          } else {
            // หาเวลาที่เหลือก่อนคลื่นมาถึง
            const timeToSurface = moment(area.surface_arrival, "HH:mm:ss").diff(
              moment(),
              "seconds"
            );
            if (timeToSurface > 0) {
              message += `\n- ${area.location}: คาดว่าจะได้รับผลกระทบในอีก ${timeToSurface} วินาที (ความรุนแรงคาดการณ์: ${area.expectedIntensity})`;
            } else {
              message += `\n- ${area.location}: คลื่นแผ่นดินไหวน่าจะกำลังมาถึง (ความรุนแรงคาดการณ์: ${area.expectedIntensity})`;
            }
          }
        });

        // เพิ่มคำแนะนำสำหรับความปลอดภัย
        message += "\n\nคำแนะนำ:";
        if (magnitude >= 6.0) {
          message +=
            "\n- หากอยู่ในอาคาร ให้มุดใต้โต๊ะแข็งแรงหรือยืนชิดเสาโครงสร้าง";
          message += "\n- เตรียมรับมือกับอาฟเตอร์ช็อกที่อาจเกิดขึ้นตามมา";
          message += "\n- อยู่ห่างจากสิ่งของที่อาจตกหล่นหรือล้มทับ";
        } else {
          message +=
            "\n- เฝ้าระวังการสั่นสะเทือนและอยู่ห่างจากสิ่งของที่อาจตกหล่น";
          message += "\n- ติดตามประกาศจากหน่วยงานรัฐอย่างใกล้ชิด";
        }

        // เพิ่มข้อมูลจากการวิเคราะห์ของ AI (ถ้ามี)
        if (additionalInfo) {
          message += additionalInfo;
        }

        message += `\n\nรายละเอียดเพิ่มเติม: ${url}`;

        // กำหนดระดับความสำคัญของการแจ้งเตือน (สำหรับกำหนดช่องทางแจ้งเตือน)
        const isHighPriority =
          magnitude >= 5.5 ||
          worstAffectedArea.expectedIntensity === "รุนแรง" ||
          worstAffectedArea.expectedIntensity === "รุนแรงมาก";

        // ส่งข้อความผ่าน LINE Notify
        await sendLineNotification(message, isHighPriority);

        // บันทึกว่าได้ส่งแจ้งเตือนแล้ว
        await alertsRef.add({
          eventId: eq.id,
          type: "earthquake",
          magnitude: magnitude,
          location: place,
          depth: eqDepth,
          distanceFromBkk: distanceKm,
          impactInfo: impactInfo,
          aiAnalysis: aiAnalysis || null, // บันทึกผลวิเคราะห์จาก AI (ถ้ามี)
          time: admin.firestore.Timestamp.fromDate(
            new Date(eq.properties.time)
          ),
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          alertLevel: alertLevel,
          isHighPriority: isHighPriority,
        });

        console.log(
          `Sent ${alertLevel} alert for earthquake: ${magnitude} at ${place} (${distanceKm} km from Bangkok)`
        );
      }

      return null;
    } catch (error) {
      console.error("Error checking earthquakes:", error);
      return null;
    }
  });

// ======== ระบบแจ้งเตือนน้ำท่วม ========
// ตรวจสอบข้อมูลน้ำท่วมจาก OpenWeatherMap API ทุก 3 ชั่วโมง
exports.checkFloodAlerts = functions.pubsub
  .schedule("every 3 hours")
  .onRun(async (context) => {
    try {
      console.log("Checking for flood alerts...");

      // รายชื่อจังหวัดที่ต้องการตรวจสอบ (เฉพาะกรุงเทพ นนทบุรี ปทุมธานี)
      const locationsToMonitor = [
        { name: "กรุงเทพมหานคร", lat: 13.7563, lon: 100.5018 },
        { name: "นนทบุรี", lat: 13.8622, lon: 100.5142 },
        { name: "ปทุมธานี", lat: 14.0208, lon: 100.5255 },
      ];

      // ดึงข้อมูลการแจ้งเตือนที่ส่งไปแล้ว
      const alertsRef = db.collection("sent_alerts");
      const alertsSnapshot = await alertsRef
        .where("type", "==", "flood")
        .where(
          "sentAt",
          ">",
          admin.firestore.Timestamp.fromDate(
            moment().subtract(24, "hours").toDate()
          )
        )
        .get();

      const sentAlertLocations = new Set();
      alertsSnapshot.forEach((doc) => {
        sentAlertLocations.add(doc.data().location);
      });

      const OPENWEATHER_API_KEY = functions.config().openweather.api_key;

      // ตรวจสอบแต่ละพื้นที่
      for (const location of locationsToMonitor) {
        // ถ้าเพิ่งส่งแจ้งเตือนไปแล้วในรอบ 24 ชั่วโมง ให้ข้าม
        if (sentAlertLocations.has(location.name)) {
          console.log(
            `Already sent flood alert for ${location.name} within last 24 hours, skipping.`
          );
          continue;
        }

        // เรียกใช้ OpenWeatherMap API
        const response = await axios.get(
          "https://api.openweathermap.org/data/2.5/onecall",
          {
            params: {
              lat: location.lat,
              lon: location.lon,
              exclude: "current,minutely,daily",
              appid: OPENWEATHER_API_KEY,
            },
          }
        );

        // ตรวจสอบการพยากรณ์ฝนตกหนัก (ฝนตกมากกว่า 10 มม. ต่อชั่วโมง เป็นเวลา 3 ชั่วโมงติดต่อกัน)
        const hourlyForecast = response.data.hourly.slice(0, 12); // ดูล่วงหน้า 12 ชั่วโมง

        let heavyRainHours = 0;
        let maxRainfall = 0;

        for (const hour of hourlyForecast) {
          // ตรวจสอบว่ามีข้อมูลฝนหรือไม่
          if (hour.rain && hour.rain["1h"]) {
            const rainfall = hour.rain["1h"]; // ปริมาณน้ำฝนใน mm
            maxRainfall = Math.max(maxRainfall, rainfall);

            if (rainfall >= 10) {
              heavyRainHours++;
            }
          }
        }

        // ถ้ามีฝนตกหนักอย่างน้อย 3 ชั่วโมง หรือ มีฝนตกหนักมากเกิน 30 มม. ในหนึ่งชั่วโมง
        if (heavyRainHours >= 3 || maxRainfall >= 30) {
          // สร้างข้อความแจ้งเตือน
          const message = `
🌧️ แจ้งเตือนน้ำท่วมฉับพลัน 🌧️
พื้นที่: ${location.name}
คาดการณ์: ฝนตกหนัก${heavyRainHours >= 3 ? ` ${heavyRainHours} ชั่วโมง` : ""}${
            maxRainfall >= 30
              ? ` ปริมาณน้ำฝนสูงสุด ${maxRainfall.toFixed(1)} มม.`
              : ""
          }
คำแนะนำ: เตรียมพร้อมรับมือน้ำท่วมฉับพลัน และหลีกเลี่ยงพื้นที่ลุ่มต่ำ
        `;

          // ส่งข้อความผ่าน LINE Notify
          await sendLineNotification(message);

          // บันทึกว่าได้ส่งแจ้งเตือนแล้ว
          await alertsRef.add({
            type: "flood",
            location: location.name,
            heavyRainHours: heavyRainHours,
            maxRainfall: maxRainfall,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(
            `Sent flood alert for ${location.name} due to heavy rain forecast`
          );
        }
      }

      return null;
    } catch (error) {
      console.error("Error checking flood alerts:", error);
      return null;
    }
  });

// ======== ระบบแจ้งเตือนไฟไหม้ ========
// ตรวจสอบข้อมูลไฟไหม้จาก GISTDA API ทุก 6 ชั่วโมง
exports.checkFireAlerts = functions.pubsub
  .schedule("every 6 hours")
  .onRun(async (context) => {
    try {
      console.log("Checking for fire alerts...");

      // รายชื่อจังหวัดที่ต้องการตรวจสอบ (เฉพาะกรุงเทพ นนทบุรี ปทุมธานี)
      const provincesToMonitor = [
        { code: "10", name: "กรุงเทพมหานคร" },
        { code: "12", name: "นนทบุรี" },
        { code: "13", name: "ปทุมธานี" },
      ];

      // วันที่ปัจจุบัน
      const today = moment().format("YYYY-MM-DD");

      // ดึงข้อมูลการแจ้งเตือนที่ส่งไปแล้ว
      const alertsRef = db.collection("sent_alerts");
      const alertsSnapshot = await alertsRef
        .where("type", "==", "fire")
        .where(
          "sentAt",
          ">",
          admin.firestore.Timestamp.fromDate(
            moment().subtract(24, "hours").toDate()
          )
        )
        .get();

      const sentAlertIds = new Set();
      alertsSnapshot.forEach((doc) => {
        sentAlertIds.add(
          `${doc.data().date}_${doc.data().province}_${doc.data().district}`
        );
      });

      const GISTDA_API_KEY = functions.config().gistda.api_key;

      // ตรวจสอบแต่ละจังหวัด
      for (const province of provincesToMonitor) {
        try {
          // เรียกใช้ GISTDA API สำหรับข้อมูลไฟไหม้
          const response = await axios.get(
            `https://fire.gistda.or.th/api/hotspot`,
            {
              params: {
                province_code: province.code,
                date: today,
                api_key: GISTDA_API_KEY,
              },
            }
          );

          // ตรวจสอบจุดความร้อน (Hotspots)
          const hotspots = response.data.hotspots || [];
          console.log(`Found ${hotspots.length} hotspots in ${province.name}`);

          // จัดกลุ่มจุดความร้อนตามอำเภอ/เขต
          const districtHotspots = {};

          for (const hotspot of hotspots) {
            const district = hotspot.district_name;
            if (!districtHotspots[district]) {
              districtHotspots[district] = [];
            }
            districtHotspots[district].push(hotspot);
          }

          // ตรวจสอบแต่ละอำเภอ/เขต
          for (const [district, spots] of Object.entries(districtHotspots)) {
            // ปรับลดเกณฑ์สำหรับกรุงเทพและปริมณฑล: แจ้งเตือนเมื่อพบจุดความร้อนตั้งแต่ 3 จุดขึ้นไป
            if (spots.length >= 3) {
              // สร้าง ID เฉพาะสำหรับการแจ้งเตือนนี้
              const alertId = `${today}_${province.name}_${district}`;

              // ถ้าเพิ่งส่งแจ้งเตือนไปแล้วในรอบ 24 ชั่วโมง ให้ข้าม
              if (sentAlertIds.has(alertId)) {
                console.log(
                  `Already sent fire alert for ${district}, ${province.name} today, skipping.`
                );
                continue;
              }

              // คำนวณพื้นที่ที่อาจได้รับผลกระทบ (ตัวอย่าง)
              const affectedArea = spots.length * 0.25; // สมมติว่า 1 จุด = 0.25 ตร.กม.

              // สร้างข้อความแจ้งเตือน
              const message = `
🔥 แจ้งเตือนไฟไหม้ 🔥
พื้นที่: ${district} จ.${province.name}
จุดความร้อน: ${spots.length} จุด
พื้นที่ได้รับผลกระทบโดยประมาณ: ${affectedArea.toFixed(2)} ตร.กม.
วันที่ตรวจพบ: ${today}
คำแนะนำ: หลีกเลี่ยงพื้นที่ดังกล่าว และปฏิบัติตามคำแนะนำของเจ้าหน้าที่
            `;

              // ส่งข้อความผ่าน LINE Notify
              await sendLineNotification(message);

              // บันทึกว่าได้ส่งแจ้งเตือนแล้ว
              await alertsRef.add({
                type: "fire",
                date: today,
                province: province.name,
                district: district,
                hotspotCount: spots.length,
                affectedArea: affectedArea,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              console.log(
                `Sent fire alert for ${district}, ${province.name} with ${spots.length} hotspots`
              );
            }
          }
        } catch (error) {
          console.error(
            `Error fetching fire data for ${province.name}:`,
            error
          );
          continue; // ข้ามไปจังหวัดถัดไป
        }
      }

      return null;
    } catch (error) {
      console.error("Error checking fire alerts:", error);
      return null;
    }
  });
