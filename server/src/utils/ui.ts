import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";

const createBtn = function(gui, message) {
   
   // add background 
   const imageRect = new Rectangle("popupContainer");
   imageRect.top = "15px";
   imageRect.left = "-15px";
   imageRect.width = .8;
   imageRect.height = .2;
   imageRect.background = "#FFFFFF";
   imageRect.thickness = 0;
   imageRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
   imageRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
   gui.addControl(imageRect);
   
   // add text
   const title = new TextBlock("popupMessage", message);
   title.resizeToFit = true;
   title.fontSize = "16px";
   title.color = "#000000";
   title.resizeToFit = true;
   title.top = "5px";
   title.width = .9;
   title.textWrapping = TextWrapping.WordWrap;
   title.resizeToFit = true;
   title.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
   title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
   imageRect.addControl(title);

   // add button
   const okBtn = Button.CreateSimpleButton("popupOkBtn", "OK");
   okBtn.width = 0.5
   okBtn.height = "20px";
   okBtn.color = "#FFFFFF";
   okBtn.background = "#000000";
   okBtn.top = "-20px";
   okBtn.thickness = 1;
   okBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
   okBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM; 
   imageRect.addControl(okBtn);

   // remove alert on btn click
   okBtn.onPointerDownObservable.add(() => { 
      imageRect.dispose();
   });
   
}

export {
    createBtn
}