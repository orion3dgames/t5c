interface ILoadingScreen {
    //What happens when loading starts
    displayLoadingUI: () => void;
    //What happens when loading stops
    hideLoadingUI: () => void;
    //default loader support. Optional!
    loadingUIBackgroundColor: string;
    loadingUIText: string;
}

class Loading implements ILoadingScreen {
    //optional, but needed due to interface definitions
    public loadingUIBackgroundColor: string;
    public loadingScreenDiv;
    constructor(public loadingUIText: string) {
        this.loadingScreenDiv = window.document.getElementById("loadingScreen");
        console.log(this.loadingScreenDiv);
    }
    public displayLoadingUI() {
        console.log("displayLoadingUI");
        this.loadingScreenDiv.style.display = "block";
        this.loadingScreenDiv.innerHTML = "loading...";
    }

    public hideLoadingUI() {
        console.log("hideLoadingUI");
        this.loadingScreenDiv.style.display = "none";
    }
}

export { Loading, ILoadingScreen };
