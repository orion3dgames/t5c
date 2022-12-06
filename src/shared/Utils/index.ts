import request from './requests'
import Config from "../Config";

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

const roundTo = function(num: number, decimal:number = 2) {
    return num.toFixed(decimal);
}

const apiUrl = function() {
    let url = Config.apiUrlProduction;
    if (window.location.host === "localhost:8080") {
        url = Config.apiUrlLocal;
    }
    return url;
} 

const isLocal = function() {
    return window.location.host === "localhost:8080"
}

var nameList = [
    'Time','Past','Future','Dev',
    'Fly','Flying','Soar','Soaring','Power','Falling',
    'Fall','Jump','Cliff','Mountain','Rend','Red','Blue',
    'Green','Yellow','Gold','Demon','Demonic','Panda','Cat',
    'Kitty','Kitten','Zero','Memory','Trooper','XX','Bandit',
    'Fear','Light','Glow','Tread','Deep','Deeper','Deepest',
    'Mine','Your','Worst','Enemy','Hostile','Force','Video',
    'Game','Donkey','Mule','Colt','Cult','Cultist','Magnum',
    'Gun','Assault','Recon','Trap','Trapper','Redeem','Code',
    'Script','Writer','Near','Close','Open','Cube','Circle',
    'Geo','Genome','Germ','Spaz','Shot','Echo','Beta','Alpha',
    'Gamma','Omega','Seal','Squid','Money','Cash','Lord','King',
    'Duke','Rest','Fire','Flame','Morrow','Break','Breaker','Numb',
    'Ice','Cold','Rotten','Sick','Sickly','Janitor','Camel','Rooster',
    'Sand','Desert','Dessert','Hurdle','Racer','Eraser','Erase','Big',
    'Small','Short','Tall','Sith','Bounty','Hunter','Cracked','Broken',
    'Sad','Happy','Joy','Joyful','Crimson','Destiny','Deceit','Lies',
    'Lie','Honest','Destined','Bloxxer','Hawk','Eagle','Hawker','Walker',
    'Zombie','Sarge','Capt','Captain','Punch','One','Two','Uno','Slice',
    'Slash','Melt','Melted','Melting','Fell','Wolf','Hound',
    'Legacy','Sharp','Dead','Mew','Chuckle','Bubba','Bubble','Sandwich','Smasher','Extreme','Multi','Universe','Ultimate','Death','Ready','Monkey','Elevator','Wrench','Grease','Head','Theme','Grand','Cool','Kid','Boy','Girl','Vortex','Paradox'
];

const generateRandomPlayerName = function() {
    return nameList[Math.floor( Math.random() * nameList.length )] 
        + "_"+ nameList[Math.floor( Math.random() * nameList.length )];
}

const distanceBetween = function(a, b): number {
	return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
}

const clamp = function(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export {
    request,
    generateRandomPlayerName,
    apiUrl,
    roundToTwo,
    roundTo,
    countPlayers,
    isLocal,
    clamp, 
    distanceBetween
}