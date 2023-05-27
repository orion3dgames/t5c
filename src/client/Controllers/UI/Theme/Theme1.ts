import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";

const createButton = function (name, text, width, height) {
    let result = new Button(name);
    result.width = width;
    result.height = height;
    result = applyTheme(result);

    let textBlock = new TextBlock(name + "_button", text);
    textBlock.width = 1;
    textBlock.textWrapping = true;
    textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    textBlock.color = "white";
    textBlock.fontSize = "14px;";
    textBlock.fontWeight = "bold";
    textBlock.fontFamily = getFont();
    result.addControl(textBlock);
    return result;
};

const generatePanel = function (panelName: string = "Default Name", width = "300px;", height = "400px", top = "0px", left = "0px") {
    let panel: Rectangle = new Rectangle("panel-" + panelName);
    panel.top = top;
    panel.left = left;
    panel.width = width;
    panel.height = height;
    panel.fontFamily = getFont();
    panel = applyTheme(panel);
    return panel;
};

const applyTheme = function (panel) {
    panel.thickness = 3;
    panel.cornerRadius = 2;
    panel.background = getBg();
    panel.color = "rgba(0,0,0,1)";
    panel.fontFamily = getFont();
    return panel;
};

const applyFont = function (p: Rectangle, size = "12px") {
    p.fontFamily = getFont();
    p.fontSize = size;
    return p;
};

const getFont = function () {
    return "inherit";
};

const getBg = function () {
    return "rgba(0,0,0,.9)";
};

const getPadding = function (multiplier = 1) {
    return multiplier * 5;
};

export { applyFont, getBg, getPadding, generatePanel, applyTheme, createButton };
