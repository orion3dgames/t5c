
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";

export default function alertMessage(gui, message) {
   
   // add background 
   const imageRect = new Rectangle("popupContainer");
   imageRect.width = .5;
   imageRect.height = .5;
   imageRect.background = "#FFF";
   imageRect.thickness = 0;
   imageRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
   imageRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
   gui.addControl(imageRect);
   
   // add text
   const title = new TextBlock("popupMessage", message);
   title.resizeToFit = true;
   title.fontSize = "20px";
   title.color = "#000";
   title.resizeToFit = true;
   title.top = "30px";
   title.width = 1;
   title.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
   title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
   imageRect.addControl(title);

   // add button
   const okBtn = Button.CreateSimpleButton("popupOkBtn", "OK");
   okBtn.width = 0.5
   okBtn.height = "40px";
   okBtn.color = "white";
   okBtn.background = "black";
   okBtn.top = "40px";
   okBtn.thickness = 1;
   okBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
   okBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
   imageRect.addControl(okBtn);

   // remove alert on btn click
   okBtn.onPointerDownObservable.add(() => { 
      imageRect.dispose();
   });
   
}