const { getUserState, setUserState, clearUserState } = require('./userStateHandler');
const { validateProvince } = require('./validateProvince');
const { saveBookingData } = require('./apiService');
const { isValidDateFormat } = require('./validateDate');
const { handleQuickReply } = require('./quickReply');

async function handleBookingStep(event, client) {
    console.log('Handling booking step...');
    const userId = event.source.userId;
    const userMessage = event.message.text;
    let state = getUserState(userId) || {};

    // เริ่มต้นการจองเมื่อผู้ใช้พิมพ์ '🚗' และยังไม่มีขั้นตอนใน state
    if (userMessage === '🚗' && !state.step) {
        state = { step: 'startDate' };
        setUserState(userId, state);
        console.log('Starting booking process...');
        await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '📅 กรุณากรอกวันเริ่มต้นการเดินทาง (DD/MM/YYYY)'
        });
        return;
    }

    switch (state.step) {
        case 'startDate':
            console.log('Handling start date...');
            if (!isValidDateFormat(userMessage)) {
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ รูปแบบวันที่ไม่ถูกต้อง กรุณาระบุใหม่'
                });
                return;
            }
            state.startDate = userMessage;
            state.step = 'endDate';
            console.log('Updating state:', state);
            setUserState(userId, state);
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '📅 กรุณากรอกวันที่กลับ (DD/MM/YYYY)'
            });
            break;

        case 'endDate':
            console.log('Handling end date...');
            if (!isValidDateFormat(userMessage)) {
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ รูปแบบวันที่ไม่ถูกต้อง กรุณาระบุใหม่'
                });
                return;
            }
            state.endDate = userMessage;
            state.step = 'province';
            console.log('Updating state:', state);
            setUserState(userId, state);
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '📍 กรุณากรอกจังหวัดปลายทาง'
            });
            break;

        case 'province':
            console.log('Handling province...');
            {
                const quickMsg = await handleQuickReply("confirmProvince");
                console.log('state step :', state.step);

                if (state.step === 'confirmProvince' && userMessage === 'แก้ไข') {
                    state.step = 'province';
                    setUserState(userId, state);

                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '📍 กรุณากรอกจังหวัดปลายทางใหม่ที่คุณต้องการ'
                    });

                    return;
                }

                const validationResult = await validateProvince(userMessage);
                console.log('Validation result:', validationResult);

                if (state.step === 'confirmProvince' && userMessage === 'ยืนยันจังหวัด' && state.suggestedProvince) {
                    state.correctedProvince = state.suggestedProvince;
                    state.step = 'confirmProvince';
                    setUserState(userId, state);

                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: [
                            "✅ จังหวัดปลายทางของคุณคือ",
                            `จังหวัด "${state.correctedProvince}" ?`,
                            'พิมพ์ "ยืนยันจังหวัด" เพื่อยืนยัน หรือ "แก้ไข" เพื่อเปลี่ยนจังหวัดใหม่'
                        ].join("\n"),
                        quickReply: quickMsg.quickReply
                    });

                    return;
                }

                if (!validationResult.valid) {
                    state.suggestedProvince = validationResult.suggestion;
                    state.step = 'confirmProvince';
                    setUserState(userId, state);

                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: [
                            "❌ ไม่มีชื่อจังหวัดนี้ในประเทศไทย",
                            `ท่านหมายถึง "${validationResult.suggestion}" หรือไม่?`,
                            'พิมพ์ "ยืนยันจังหวัด" เพื่อยืนยัน หรือ "แก้ไข" เพื่อเปลี่ยนจังหวัดใหม่'
                        ].join("\n"),
                        quickReply: quickMsg.quickReply
                    });

                    return;
                }

                state.correctedProvince = validationResult.province;
                state.step = 'confirmProvince';
                setUserState(userId, state);

                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: [
                        "✅ จังหวัดปลายทางของคุณคือ",
                        `จังหวัด "${state.correctedProvince}" ?`,
                        'พิมพ์ "ยืนยันจังหวัด" เพื่อยืนยัน หรือ "แก้ไข" เพื่อเปลี่ยนจังหวัดใหม่'
                    ].join("\n"),
                    quickReply: quickMsg.quickReply
                });
            }
            break;


        case 'confirmProvince':
            console.log('Handling confirm province...');
            const quickMsg = await handleQuickReply("confirmBooking");

            if (userMessage === 'ยืนยันจังหวัด') {
                if (!state.correctedProvince) {
                    state.correctedProvince = state.suggestedProvince || 'ไม่ระบุ';
                }

                state.destination = state.correctedProvince;
                state.step = 'confirm'; // ✅ เปลี่ยนเป็น confirm
                console.log('✅ Updating state:', state);
                setUserState(userId, state);

                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: [
                        "📋 สรุปรายการจอง:",
                        `- วันที่: ${state.startDate} - ${state.endDate}`,
                        `- จังหวัด: ${state.destination}`,
                        'พิมพ์ "ยืนยัน" เพื่อบันทึก หรือ "ยกเลิก" เพื่อยกเลิกการจอง'
                    ].join("\n"),
                    quickReply: quickMsg.quickReply
                });

                return;
            }

            if (userMessage === 'แก้ไข') {
                state.step = 'province';
                setUserState(userId, state);

                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '📍 กรุณากรอกจังหวัดใหม่'
                });

                return;
            }

            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '❌ โปรดลองใหม่โดยพิมพ์ "ยืนยัน" หรือ "แก้ไข"'
            });

            break;

        case 'confirm':
            console.log('Handling confirm...');
            console.log('Received userMessage:', userMessage);
            console.log('Current state:', state);

            if (userMessage === 'ยืนยัน') {
                console.log('➡️ Sending booking data to API:', {
                    userId,
                    startDate: state.startDate,
                    endDate: state.endDate,
                    destination: state.destination
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

        default:
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '❌ ไม่มีขั้นตอนที่ถูกต้อง กรุณาลองใหม่'
            });
    }
}

module.exports = { handleBookingStep };
