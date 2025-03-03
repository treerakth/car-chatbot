const { getUserState, setUserState, clearUserState } = require('./userStateHandler');
const { validateProvince } = require('./validateProvince');
const { saveBookingData } = require('./apiService');
const { isValidDateFormat, convertThaiDateToGregorian } = require('./validateDate');
const { handleQuickReply } = require('./quickReply');
const { handleFlexMessage } = require('./flexMessageUtils');
const { fetchCarAvailable } = require('./carService');

async function handleBookingStep(event, client) {
    console.log('Handling booking step (new flow)...');

    const userMessage = event.message?.text?.trim() || '';
    const postbackData = event.postback?.data || '';
    const userId = event.source.userId;

    let state = getUserState(userId) || {};
    console.log('📌 Current state:', state);

    if (userMessage === '🚗' && !state.step) {
        console.log('🚀 เริ่มต้นการจองรถ...');

        state = { step: 'carType' };
        await setUserState(userId, state);

        console.log('✅ อัปเดต state:', getUserState(userId));

        await handleFlexMessage(client, event, 'fetchCarData.json');
        return;
    }

    console.log('User message:', userMessage);
    console.log('Postback data:', postbackData);
    console.log('🔄 Current state (After Processing):', state);

    switch (state.step) {
        case 'carType': {
            console.log('Handling carType...');
            if (postbackData.includes('carType=')) {
                const params = new URLSearchParams(postbackData);
                const chosenCarType = params.get('carType');
                console.log('Chosen car type:', chosenCarType);
                console.log('params:', params);
                if (chosenCarType) {
                    state.carType = chosenCarType;
                    state.step = 'carBrand';
                    await setUserState(userId, state);

                    console.log('✅ อัปเดต state:', getUserState(userId));

                    // เรียก fetchCarAvailable เพื่อดึงรายการรถที่ว่าง
                    const carFlexMessage = await fetchCarAvailable(chosenCarType);
                    await client.replyMessage(event.replyToken, carFlexMessage);
                    return;
                } else {
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '❌ ไม่สามารถระบุประเภทรถได้ กรุณาลองใหม่'
                    });
                    return;
                }
            } else {
                await handleFlexMessage(client, event, 'fetchCarData.json');
                return;
            }
        }

        /*****************************************************
         * 2) เลือกรุ่นรถ (carBrand)
         *****************************************************/
        case 'carBrand': {
            console.log('Handling carBrand...');
            if (postbackData.includes('carBrand=')) {
                const params = new URLSearchParams(postbackData);
                const chosencarBrand = params.get('carBrand');

                if (chosencarBrand) {
                    state.carBrand = chosencarBrand;
                    state.step = 'name';
                    setUserState(userId, state);

                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '👤 กรุณากรอกชื่อและนามสกุล (เช่น สมชาย ใจดี)'
                    });
                    return;
                } else {
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '❌ ไม่สามารถเลือกรถได้ กรุณาลองใหม่'
                    });
                    return;
                }
            } else {
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ กรุณาเลือกรถจากเมนูอีกครั้ง'
                });
                return;
            }
        }

        /*****************************************************
         * 3) กรอกชื่อ (name)
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
            startDate_format = [
                '📅 กรุณากรอกวันที่คืนรถ',
                '(กรุณาพิมพ์วันที่ปัจจุบัน)',
                'ตัวอย่าง (20/03/2568)'
            ].join("\n");
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: startDate_format

            });
            break;
        }

        /*****************************************************
         * ขั้นตอน: วันที่เริ่มต้น (startDate)
         *****************************************************/
        case 'startDate': {
            console.log('Handling start date...');
            if (!isValidDateFormat(userMessage)) {
                const false_format = [
                    "❌ รูปแบบวันที่ไม่ถูกต้อง",
                    'หรือไม่สามารถจองย้อนหลังได้',
                    'กรุณาพิมพ์ในรูปแบบ DD/MM/YYYY'
                ].join("\n");
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: false_format
                });
                return;
            }
            state.startDate = userMessage;
            state.step = 'endDate';
            setUserState(userId, state);
            const endDate_format = [
                '📅 กรุณากรอกวันที่คืนรถ',
                '(ต้องไม่ก่อนวันที่เริ่มต้น)',
                'ตัวอย่าง (20/03/2568)'
            ].join("\n");
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: endDate_format
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
                    const confirmQuick = await handleQuickReply("confirmBooking");
                    const summary = [
                        "📋 สรุปรายการจอง:",
                        `- ชื่อ-นามสกุล: ${state.firstName} ${state.lastName}`,
                        `- เบอร์โทร: ${state.phoneNumber}`,
                        `- วันที่: ${state.startDate} - ${state.endDate}`,
                        `- จังหวัดรับรถ: ${state.startProvince}`,
                        `- จังหวัดคืนรถ: ${state.endProvince}`,
                        `- ประเภทรถ: ${state.carType}`,
                        `- ยี่ห้อรถ: ${state.carBrand}`
                    ].join("\n");
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: summary + "\nพิมพ์ 'ยืนยัน' เพื่อบันทึก หรือ 'ยกเลิก' เพื่อยกเลิกการจอง",
                        quickReply: confirmQuick.quickReply
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
            const confirmQuick = await handleQuickReply("confirmBooking");
            const summary = [
                "📋 สรุปรายการจอง:",
                `- ชื่อ-นามสกุล: ${state.firstName} ${state.lastName}`,
                `- เบอร์โทร: ${state.phoneNumber}`,
                `- วันที่: ${state.startDate} - ${state.endDate}`,
                `- จังหวัดรับรถ: ${state.startProvince}`,
                `- จังหวัดคืนรถ: ${state.endProvince}`,
                `- ประเภทรถ: ${state.carType}`,
                `- ยี่ห้อรถ: ${state.carBrand}`
            ].join("\n");

            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: summary + "\nพิมพ์ 'ยืนยัน' เพื่อบันทึก หรือ 'ยกเลิก' เพื่อยกเลิกการจอง",
                quickReply: confirmQuick.quickReply
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

module.exports = { handleBookingStep };
