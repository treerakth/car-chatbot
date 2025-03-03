/*****************************************************
 *  handleBookingStep.js
 *  Flow หลักที่ใช้รับ event และโต้ตอบกับผู้ใช้
 *****************************************************/
const { fetchCarAvailable } = require('./carService'); // เรียกฟังก์ชันที่แยกไว้
// สมมติว่ามีฟังก์ชันอื่น ๆ เหล่านี้อยู่แล้ว
// getUserState, setUserState, clearUserState
// isValidDateFormat, convertThaiDateToGregorian, validateProvince
// handleQuickReply, saveBookingData

async function handleFlexMessage(client, event, flexContent) {
    // ถ้า flexContent เป็น string (เช่นชื่อไฟล์ JSON) อาจโหลดไฟล์
    // หรือถ้าเป็น object ก็ส่งตรงได้เลย
    let flexMsgObject = flexContent;

    // ตัวอย่างโหลดไฟล์ JSON ถ้าเป็น string
    if (typeof flexContent === 'string') {
        flexMsgObject = require(`./${flexContent}`);
    }

    await client.replyMessage(event.replyToken, flexMsgObject);
}

async function handleBookingStep(event, client) {
    console.log('Handling booking step (new flow)...');

    const userMessage = event.message?.text?.trim() || '';
    const postbackData = event.postback?.data || '';
    const userId = event.source.userId;

    let state = getUserState(userId) || {};

    /*****************************************************
     * 1) เริ่มต้น Flow เมื่อผู้ใช้พิมพ์ "🚗" และยังไม่มี state
     *****************************************************/
    if (userMessage === '🚗' && !state.step) {
        // กำหนดขั้นตอนเริ่มต้น
        state = { step: 'carType' };
        setUserState(userId, state);

        // ส่ง Flex Message ให้เลือกประเภทรถ (fetchCarData.json)
        await handleFlexMessage(client, event, 'fetchCarData.json');
        return;
    }

    /*****************************************************
     * 2) ตรวจสอบ state.step เพื่อไปยังขั้นตอนต่าง ๆ
     *****************************************************/
    switch (state.step) {

        /*****************************************************
         * ขั้นตอน: เลือกประเภทรถ (carType)
         *   - เมื่อกดใน Flex (fetchCarData.json) => Postback: carType=...
         *****************************************************/
        case 'carType': {
            console.log('Handling carType...');
            // ตรวจว่า postbackData มี "carType=" หรือไม่
            if (postbackData.includes('carType=')) {
                const params = new URLSearchParams(postbackData);
                const chosenCarType = params.get('carType');

                if (chosenCarType) {
                    // บันทึกประเภทรถใน state
                    state.carType = chosenCarType;
                    // เปลี่ยนไปขั้นตอนเลือกรุ่นรถ
                    state.step = 'carModel';
                    setUserState(userId, state);

                    // เรียก fetchCarAvailable เพื่อสร้าง Flex Message เฉพาะรถรุ่นต่าง ๆ ที่ว่าง
                    const availableFlex = await fetchCarAvailable(chosenCarType);
                    await handleFlexMessage(client, event, availableFlex);
                    return;
                } else {
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '❌ ไม่สามารถระบุประเภทรถได้ กรุณาลองใหม่'
                    });
                    return;
                }
            } else {
                // ถ้าไม่มี postbackData เกี่ยวกับ carType
                await handleFlexMessage(client, event, 'fetchCarData.json');
                return;
            }
        }

        /*****************************************************
         * ขั้นตอน: เลือกรุ่นรถ (carModel) หรือ carBrand
         *   - เมื่อกดใน Flex (จาก fetchCarAvailable) => Postback: carModel=...
         *****************************************************/
        case 'carModel': {
            console.log('Handling carModel...');
            if (postbackData.includes('carModel=')) {
                const params = new URLSearchParams(postbackData);
                const chosenCarModel = params.get('carModel');
                const chosenCarBrand = params.get('carBrand') || ''; // กรณีส่ง brand มาด้วย
                if (chosenCarModel) {
                    // บันทึกข้อมูลรุ่นรถใน state
                    state.carModel = chosenCarModel;
                    state.carBrand = chosenCarBrand; // ถ้าต้องการเก็บ brand แยก
                    // ถัดไป ให้ผู้ใช้กรอกชื่อ
                    state.step = 'name';
                    setUserState(userId, state);

                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: `✅ เลือกรุ่นรถ: "${chosenCarBrand} ${chosenCarModel}"\n\n👤 กรุณาพิมพ์ชื่อและนามสกุลของคุณ (คั่นด้วยช่องว่าง)`
                    });
                    return;
                } else {
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '❌ ไม่สามารถระบุรุ่นรถได้ กรุณาลองใหม่'
                    });
                    return;
                }
            } else {
                // ถ้าไม่มี postbackData เกี่ยวกับ carModel
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ กรุณาเลือกรุ่นรถจากเมนูอีกครั้ง'
                });
                return;
            }
        }

        /*****************************************************
         * ขั้นตอน: กรอกชื่อ (name)
         *****************************************************/
        case 'name': {
            console.log('Handling get name...');
            const parts = userMessage.split(' ');
            if (parts.length < 2) {
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ กรุณาพิมพ์ทั้งชื่อและนามสกุล'
                });
                return;
            }
            state.firstName = parts[0];
            state.lastName = parts.slice(1).join(' ');
            state.step = 'phone';
            setUserState(userId, state);
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '📞 กรุณาพิมพ์เบอร์โทรศัพท์ (10 หลัก)'
            });
            break;
        }

        /*****************************************************
         * ขั้นตอน: กรอกเบอร์โทร (phone)
         *****************************************************/
        case 'phone': {
            console.log('Handling get phone...');
            const phonePattern = /^\d{10}$/;
            if (!phonePattern.test(userMessage)) {
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ เบอร์โทรศัพท์ไม่ถูกต้อง กรุณาพิมพ์ให้ครบ 10 หลัก'
                });
                return;
            }
            state.phoneNumber = userMessage;
            state.step = 'startDate';
            setUserState(userId, state);
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '📅 กรุณากรอกวันเริ่มต้นการเดินทาง (DD/MM/YYYY) (ไม่สามารถจองย้อนหลังได้)'
            });
            break;
        }

        /*****************************************************
         * ขั้นตอน: วันที่เริ่มต้น (startDate)
         *****************************************************/
        case 'startDate': {
            console.log('Handling start date...');
            if (!isValidDateFormat(userMessage)) {
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ รูปแบบวันที่ไม่ถูกต้อง หรือไม่สามารถจองย้อนหลังได้ กรุณาพิมพ์ในรูปแบบ DD/MM/YYYY'
                });
                return;
            }
            state.startDate = userMessage;
            state.step = 'endDate';
            setUserState(userId, state);
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '📅 กรุณากรอกวันที่คืนรถ (DD/MM/YYYY) (ต้องไม่ก่อนวันที่เริ่มต้น)'
            });
            break;
        }

        /*****************************************************
         * ขั้นตอน: วันที่คืนรถ (endDate)
         *****************************************************/
        case 'endDate': {
            console.log('Handling end date...');
            if (!isValidDateFormat(userMessage)) {
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ รูปแบบวันที่ไม่ถูกต้อง กรุณาพิมพ์ในรูปแบบ DD/MM/YYYY'
                });
                return;
            }
            const startDate = convertThaiDateToGregorian(state.startDate);
            const endDate = convertThaiDateToGregorian(userMessage);
            if (endDate < startDate) {
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ วันที่คืนรถไม่สามารถก่อนวันที่เริ่มต้นได้ กรุณาพิมพ์ใหม่'
                });
                return;
            }
            state.endDate = userMessage;
            state.step = 'startProvince';
            setUserState(userId, state);
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '📍 กรุณาพิมพ์จังหวัดรับรถ'
            });
            break;
        }

        /*****************************************************
         * ขั้นตอน: จังหวัดรับรถ (startProvince)
         *****************************************************/
        case 'startProvince': {
            console.log('Handling start province...');
            const quickMsg = await handleQuickReply("confirm");
            if (state.suggestedStartProvince) {
                if (userMessage === "ใช่") {
                    state.startProvince = state.suggestedStartProvince;
                    state.suggestedStartProvince = null;
                    state.step = 'endProvince';
                    setUserState(userId, state);
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: `✅ จังหวัดที่ท่านต้องการรับรถคือ : "${state.startProvince}"\n\n📍 กรุณาพิมพ์จังหวัดส่งคืนรถ`
                    });
                    return;
                } else if (userMessage === "ไม่") {
                    state.suggestedStartProvince = null;
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '📍 กรุณาพิมพ์จังหวัดรับรถใหม่'
                    });
                    return;
                }
            }
            const validationResult = await validateProvince(userMessage);
            console.log('Validation result (startProvince):', validationResult);
            if (!validationResult.valid) {
                if (!validationResult.suggestion) {
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '⚠️ ไม่พบจังหวัดนี้ในประเทศไทย กรุณาพิมพ์ใหม่'
                    });
                } else {
                    state.suggestedStartProvince = validationResult.suggestion;
                    setUserState(userId, state);
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: `❓ ท่านหมายถึงจังหวัด "${validationResult.suggestion}" ใช่หรือไม่?`,
                        quickReply: quickMsg.quickReply
                    });
                }
                return;
            }
            state.startProvince = validationResult.province;
            state.step = 'endProvince';
            setUserState(userId, state);
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: `✅ จังหวัดที่ท่านต้องการรับรถคือ : "${state.startProvince}"\n\n📍 กรุณาพิมพ์จังหวัดส่งคืนรถ`
            });
            break;
        }

        /*****************************************************
         * ขั้นตอน: จังหวัดส่งคืนรถ (endProvince)
         *****************************************************/
        case 'endProvince': {
            console.log('Handling end province...');
            const quickMsg = await handleQuickReply("confirm");
            if (state.suggestedEndProvince) {
                if (userMessage === "ใช่") {
                    state.endProvince = state.suggestedEndProvince;
                    state.suggestedEndProvince = null;
                    state.step = 'confirm';
                    setUserState(userId, state);
                    const carTypeQuick = await handleQuickReply("confirm");
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: `✅ จังหวัดที่ท่านต้องการคืนรถคือ : "${state.endProvince}"\n\n🚗 กรุณาตรวจสอบข้อมูลการจองรถของท่าน`,
                        quickReply: carTypeQuick.quickReply
                    });
                    return;
                } else if (userMessage === "ไม่") {
                    state.suggestedEndProvince = null;
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '📍 กรุณาพิมพ์จังหวัดคืนรถใหม่'
                    });
                    return;
                }
            }
            const validationResult = await validateProvince(userMessage);
            console.log('Validation result (endProvince):', validationResult);
            if (!validationResult.valid) {
                if (!validationResult.suggestion) {
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '⚠️ ไม่พบจังหวัดนี้ในประเทศไทย กรุณาพิมพ์ใหม่'
                    });
                } else {
                    state.suggestedEndProvince = validationResult.suggestion;
                    setUserState(userId, state);
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: `❓ ท่านหมายถึง "${validationResult.suggestion}" ใช่หรือไม่?`,
                        quickReply: quickMsg.quickReply
                    });
                }
                return;
            }
            state.endProvince = validationResult.province;
            state.step = 'confirm';
            setUserState(userId, state);
            const carTypeQuick = await handleQuickReply("confirm");
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: `✅ จังหวัดที่ท่านต้องการคืนรถคือ : "${state.endProvince}"\n\n🚗 กรุณาตรวจสอบข้อมูลการจองรถของท่าน`,
                quickReply: carTypeQuick.quickReply
            });
            break;
        }

        /*****************************************************
         * ขั้นตอน: ยืนยันการจอง (confirm)
         *****************************************************/
        case 'confirm': {
            console.log('Handling confirm...');
            console.log('Received userMessage:', userMessage);
            console.log('Current state:', state);
            if (userMessage === 'ยืนยัน') {
                console.log('➡️ Sending booking data to API:', {
                    userId,
                    firstName: state.firstName,
                    lastName: state.lastName,
                    phoneNumber: state.phoneNumber,
                    startDate: state.startDate,
                    endDate: state.endDate,
                    startProvince: state.startProvince,
                    endProvince: state.endProvince,
                    carType: state.carType,
                    carBrand: state.carBrand,
                    carModel: state.carModel
                });
                const result = await saveBookingData(userId, state);
                if (result.success) {
                    clearUserState(userId);
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '✅ การจองสำเร็จ! ขอบคุณที่ใช้บริการ'
                    });
                } else {
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่'
                    });
                }
            } else if (userMessage === 'ยกเลิก') {
                clearUserState(userId);
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '🚫 ยกเลิกการจอง'
                });
            } else {
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ โปรดลองใหม่ พิมพ์ "ยืนยัน" หรือ "ยกเลิก"'
                });
            }
            break;
        }

        /*****************************************************
         * กรณีไม่ตรงกับขั้นตอนใด ๆ
         *****************************************************/
        default:
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '❌ ไม่มีขั้นตอนที่ถูกต้อง กรุณาลองใหม่'
            });
    }
}

module.exports = {
    handleBookingStep
};
