
const countPlayers = function(object){
    var length = 0;
    for( var key in object ) {
        if( object.hasOwnProperty(key) ) {
            ++length;
        }
    }
    return length;
}

const roundToTwo = function(num: number) {
    return Math.round(num * 100) / 100;
}

export {
    countPlayers,
    roundToTwo
}