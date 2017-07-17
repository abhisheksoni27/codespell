function parseTime(time) {
    if (!time) return {
        seconds: 0,
        minutes: 0
    };
    const timeString = time.match(/\d{1,3}/g);
    const seconds = timeString[timeString.length - 1];
    const minutes = timeString[timeString.length - 2];
    const result = {
        seconds,
        minutes
    };
    if (timeString.length > 2) {
        const hours = timeString[0];
        result['hours'] = hours;
    }

    return result;
}


function addTime(time1, time2) {
    const time = {};
    time['seconds'] = time1.seconds + time2.seconds;
    time['minutes'] = time1.minutes + time2.minutes;
    if (time1.hours && time2.hours) {
        time['hours'] = time1.hours + time2.hours;
    } else if (time1.hours || time2.hours) {
        time['hours'] = time1.hours || time2.hours;
    }
    return time;
};

module.exports = {
    addTime,
    parseTime
}