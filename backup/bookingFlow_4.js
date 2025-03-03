const { getUserState, setUserState, clearUserState } = require('./userStateHandler');
const { validateProvince } = require('./validateProvince');
const { saveBookingData } = require('./apiService');
const { isValidDateFormat, convertThaiDateToGregorian } = require('./validateDate');
const { handleQuickReply } = require('./quickReply');
const { handleFlexMessage } = require('./flexMessageUtils');

async function handleBookingStep(event, client) {
    console.log('Handling booking step (new flow with car selection first)...');
    const userId = event.source.userId;
    const userMessage = event.message.text.trim();
    let state = getUserState(userId) || {};

    // เริ่มต้น Flow เมื่อผู้ใช้พิมพ์ "🚗" และยังไม่มี state
    if (userMessage === '🚗' && !state.step) {
        // เริ่มด้วยการเลือกรถ
        state = { step: 'carType' };
        setUserState(userId, state);
        // ส่ง Flex Message สำหรับเลือกรถ (carousel bubble จาก fetchCarData.json)
        await handleFlexMessage(client, event, 'fetchCarData.json');
        return;
    }

    switch (state.step) {
        case 'carType': {
            console.log('Handling car type...');
            // หากยังไม่ได้รับการเลือก carType ให้ตรวจสอบ flag carTypeSent
            if (!state.carType) {
                if (!state.carTypeSent) {
                    state.carTypeSent = true;
                    setUserState(userId, state);
                    await handleFlexMessage(client, event, 'fetchCarData.json');
                    return;
                } else {
                    // เมื่อได้รับการตอบกลับจาก Flex Message ให้ตั้งค่า carType
                    state.carType = userMessage;
                    state.step = 'carBrand';
                    setUserState(userId, state);
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: `✅ ประเภทรถที่เลือก: "${state.carType}"\nกรุณาพิมพ์ยี่ห้อรถที่ต้องการ:`
                    });
                    return;
                }
            }
            break;
        }
        case 'carBrand': {
            console.log('Handling car Brand...');
            state.carBrand = userMessage;
            state.step = 'name';
            setUserState(userId, state);
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: `✅ ยี่ห้อรถที่เลือก: "${state.carBrand}"\n\n👤 กรุณาพิมพ์ชื่อและนามสกุลของคุณ (คั่นด้วยช่องว่าง)`
            });
            break;
        }
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
                    carBrand: state.carBrand
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
        default:
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '❌ ไม่มีขั้นตอนที่ถูกต้อง กรุณาลองใหม่'
            });
    }
}

module.exports = { handleBookingStep };
