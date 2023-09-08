import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Scene } from "@babylonjs/core/scene";
import { randomNumberInRange } from "../../../shared/Utils";

export class DamageText {
    private _ui;
    private _scene: Scene;

    private damageText: Rectangle[] = [];

    constructor(ui, scene, entities) {
        this._ui = ui;
        this._scene = scene;

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            // refresh
            this._update();
        });
    }

    public addDamage(entity, amount) {
        let color = amount < 0 ? "red" : "yellowgreen";
        let amountText = amount > 0 ? "+" + amount : "" + amount;
        let key = this.damageText.length;
        var rect1 = new Rectangle("damage_" + key + "_" + entity.sessionId);
        rect1.isVisible = true;
        rect1.width = "50px";
        rect1.height = "40px";
        rect1.thickness = 0;
        rect1.zIndex = this._ui.addControl(rect1);
        rect1.linkWithMesh(entity.mesh);
        rect1.linkOffsetY = -50;
        rect1.metadata = { offset: randomNumberInRange(-0.5, 0.5) };
        var label = new TextBlock("text_" + entity.sessionId);
        label.text = amountText;
        label.color = color;
        label.fontWeight = "bold";
        label.fontSize = "22px";
        label.outlineWidth = 3;
        label.outlineColor = "black";
        rect1.addControl(label);
        this.damageText.push(rect1);
    }

    private _update() {
        let alphaIncrement = 0.05;
        this.damageText.forEach((v: Rectangle, k) => {
            v.linkOffsetYInPixels -= 2;
            v.linkOffsetXInPixels -= v.metadata.offset;
            if (v.linkOffsetYInPixels < -130 && v.alpha >= alphaIncrement) {
                v.alpha -= alphaIncrement;
            }
            if (v.linkOffsetYInPixels < -250) {
                v.dispose();
                delete this.damageText[k];
            }
        });
    }
}
