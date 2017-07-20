function addTime(time1, time2) {
    let array = time1.map((item, index) => {
        let sum = item + time2[index]
        return sum;
    });

    if (array[1] > 60) {
        array[1] -= 60;
        array[0]++;
    }

    if (array[2] > 60) {
        array[2] -= 60;
        array[1]++;
    }

    return array;
}

function parseTime(time) {
    if (!time) {
        return [0, 0];
    }

    let timeArray = time.match(/\d{1,3}/g);

    timeArray = timeArray.map((num) => {
        return parseInt(num, 10)
    });

    if (timeArray.length < 3) {
        timeArray.unshift(0);
    }

    return timeArray;
}

function incrementTime(time) {
    const incrementedTime = parseTime(time);
    incrementedTime[incrementedTime.length - 1] += 1;

    if (incrementedTime[1] > 60) {
        incrementedTime[1] -= 60;
        incrementedTime[0]++;
    }

    if (incrementedTime[2] > 60) {
        incrementedTime[2] -= 60;
        incrementedTime[1]++;
    }
    return incrementedTime;
}

module.exports = {
    addTime,
    parseTime,
    incrementTime
}