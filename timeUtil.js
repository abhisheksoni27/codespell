function parseTime(time) {
    if (!time) {
        return [0, 0, 0];
    }
    let timeString = time.match(/\d{1,3}/g).map((num) => {
        return parseInt(num, 10)
    });

    if(timeString.length < 3){
        timeString.unshift(0);
    }

    return timeString;
}


function addTime(time1, time2) {
    let array = time1.map((item, index)=>{
        return item + time2[index];
    });

    return array;
};

module.exports = {
    addTime,
    parseTime
}