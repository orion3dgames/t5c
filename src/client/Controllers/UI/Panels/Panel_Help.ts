import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Panel } from "./Panel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";

export class Panel_Help extends Panel {
    private panel: Rectangle;
    private attributes;
    private stats;
    private slots;
    private helpData;

    private _stackPanel: StackPanel;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        this.helpData = this._game.loadGameData("help");

        this.createContent();
    }

    // create panel
    private async createContent() {
        // add scrollable container
        const chatScrollViewer = new ScrollViewer("scrollViewer");
        chatScrollViewer.width = 1;
        chatScrollViewer.height = 1;
        chatScrollViewer.top = 0;
        chatScrollViewer.thickness = 1;
        chatScrollViewer.color = "rgba(255,255,255,.5)";
        chatScrollViewer.setPaddingInPixels(10, 10, 10, 10);
        chatScrollViewer.fontSizeInPixels = 16;
        chatScrollViewer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chatScrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._panelContent.addControl(chatScrollViewer);

        // add stack panel
        const chatStackPanel = new StackPanel("stackPanel");
        chatStackPanel.width = 1;
        chatStackPanel.adaptHeightToChildren = true;
        chatStackPanel.setPaddingInPixels(10, 10, 10, 10);
        chatStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        chatStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chatScrollViewer.addControl(chatStackPanel);
        this._stackPanel = chatStackPanel;

        // add content
        for (let tabId in this.helpData) {
            const tab = this.helpData[tabId];
            tab.objects.forEach((object) => {
                // title
                const titleText = new TextBlock("title", object.title);
                titleText.width = 1;
                titleText.color = this._game.config.UI_PRIMARY_COLOR;
                titleText.resizeToFit = true;
                titleText.fontWeight = "bold";
                titleText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                titleText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                titleText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                chatStackPanel.addControl(titleText);

                // description
                const descrText = new TextBlock("description", object.description + "\n");
                descrText.width = 1;
                descrText.color = "white";
                descrText.resizeToFit = true;
                descrText.textWrapping = TextWrapping.WordWrap;
                descrText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                descrText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                descrText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                chatStackPanel.addControl(descrText);
            });
        }
    }
}
