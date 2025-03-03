const userStates = {};

function getUserState(userId) {
    return userStates[userId] || null;
}

function setUserState(userId, state) {
    userStates[userId] = state;
}

function clearUserState(userId) {
    delete userStates[userId];
}

module.exports = { getUserState, setUserState, clearUserState };
