class Langs {

    private words;

    constructor() {

    }

    async load(lang = 'en') {
        let url = "./Langs/"+lang+".ts"
        return await fetch(url);
    }

    get(key) {
        return this.words[key];
    }

}

export default Langs