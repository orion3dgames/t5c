import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";

const generatePanel = function (panelName: string = "Default Name", width = "300px;", height = "400px", top = "0px", left = "0px") {
    let panel: Rectangle = new Rectangle("panel-" + panelName);
    panel.top = top;
    panel.left = left;
    panel.width = width;
    panel.height = height;
    panel = applyTheme(panel);
    return panel;
};

const applyTheme = function (panel) {
    panel.thickness = 3;
    panel.cornerRadius = 2;
    panel.background = getBg();
    panel.color = "rgba(0,0,0,1)";
    return panel;
};

const applyFont = function (p: Rectangle, size = "12px") {
    p.fontFamily = getFont();
    p.fontSize = size;
    return p;
};

const getFont = function () {
    return "Arial";
};

const getBg = function () {
    return "rgba(0,0,0,.8)";
};

const getPadding = function (multiplier = 1) {
    return multiplier * 5;
};

export { applyFont, getBg, getPadding, generatePanel, applyTheme };
