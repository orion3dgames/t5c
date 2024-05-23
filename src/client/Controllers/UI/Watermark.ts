import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { UserInterface } from "../UserInterface";
import { Control } from "@babylonjs/gui/2D/controls/control";

export class Watermark {
    private _ui: UserInterface;

    public _bloc;

    constructor(ui) {
        this._ui = ui;

        // create watermark elements
        const columnRect = new Rectangle("column");
        columnRect.widthInPixels = 250;
        columnRect.heightInPixels = 250;
        columnRect.background = "transparent";
        columnRect.thickness = 0;
        columnRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        columnRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        columnRect.isVisible = false;

        this._ui.MAIN_ADT.addControl(columnRect);
        this._bloc = columnRect;

        // logo
        var imgLogo = new Image("imgLogo", "./images/logo.png");
        imgLogo.stretch = Image.STRETCH_UNIFORM;
        imgLogo.top = "0px";
        imgLogo.width = 1;
        imgLogo.height = "120px;";
        imgLogo.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        columnRect.addControl(imgLogo);
    }
}
