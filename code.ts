//import "./ui.css";
// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { themeColors: true, width: 320, height: 520 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg: {
   type: string;
   percentW: number;
   percentH: number;
}) => {
   // One way of distinguishing between different types of messages sent from
   // your HTML page is to use an object with a "type" property like this.
   const selectedNodes = figma.currentPage.selection;

   if (msg.type === "resize") {
      interface Dimensions {
         width: number;
         height: number;
      }

      const percent: Dimensions = {
         width: 0,
         height: 0,
      };

      percent.width =
         msg.percentW < 0
            ? 1
            : msg.percentW === 0
            ? 0.00001
            : msg.percentW / 100;
      percent.height =
         msg.percentH < 0
            ? 1
            : msg.percentH === 0
            ? 0.00001
            : msg.percentH / 100;

      console.log(Math.ceil(150 * percent.height));
      selectedNodes.forEach((node) => {
         // Check if values were input
         if (msg.percentW < 0 && msg.percentH < 0) {
            console.log("No value was input");
         } else {
            // Validate that the selected node can be resized & if it has a parent container
            if (
               // Selected node CAN be resized
               "width" in node &&
               "height" in node &&
               "resize" in node &&
               // & HAS A PARENT
               (node.parent?.type === "FRAME" ||
                  node.parent?.type === "GROUP" ||
                  node.parent?.type === "BOOLEAN_OPERATION")
            ) {
               let [
                  widthViaParent,
                  heightViaParent,
                  widthViaObj,
                  heightViaObj,
               ] = [
                  Math.ceil(node.parent.width * percent.width),
                  Math.ceil(node.parent.height * percent.height),
                  Math.ceil(node.width * percent.width),
                  Math.ceil(node.height * percent.height),
               ];
               // Preserve aspect ratio if one of the fields is blank & constraints are ON
               if (
                  "constrainProportions" in node &&
                  node.constrainProportions
               ) {
                  let aspectRatio = node.width / node.height;
                  if (msg.percentW < 0 && msg.percentH > 0) {
                     node.resize(
                        heightViaParent * aspectRatio, //Set width to height
                        heightViaParent // calculate height
                     );
                  } else if (msg.percentW > 0 && msg.percentH < 0) {
                     node.resize(
                        widthViaParent, //calculate width
                        widthViaParent / aspectRatio
                        //Set height to width
                     );
                  } else {
                     node.resize(
                        msg.percentW > 0 ? widthViaParent : widthViaObj,
                        msg.percentH > 0 ? heightViaParent : heightViaObj
                     );
                  }
               } else {
                  if (msg.percentW < 0 && msg.percentH > 0) {
                     node.resize(widthViaObj, heightViaParent);
                  } else if (msg.percentW > 0 && msg.percentH < 0) {
                     node.resize(widthViaParent, heightViaObj);
                  } else {
                     node.resize(widthViaParent, heightViaParent);
                  }
               }
               figma.notify(
                  `The object(s) have been resized relative to the container!`,
                  { timeout: 1500 }
               );
            } else if (
               // Selected node CAN be resized & DOES NOT have a parent
               "width" in node &&
               "height" in node &&
               "resize" in node
            ) {
               let [widthViaObj, heightViaObj] = [
                  Math.ceil(node.width * percent.width),
                  Math.ceil(node.height * percent.height),
               ];
               if (
                  // Check if constrained proportions
                  "constrainProportions" in node &&
                  node.constrainProportions
               ) {
                  let aspectRatio = node.width / node.height;
                  if (msg.percentW < 0 && msg.percentH > 0) {
                     node.resize(
                        heightViaObj * aspectRatio, //Set width to height
                        heightViaObj // calculate height
                     );
                  } else if (msg.percentW > 0 && msg.percentH < 0) {
                     node.resize(
                        widthViaObj, //calculate width
                        widthViaObj / aspectRatio
                        //Set height to width
                     );
                  } else {
                     node.resize(widthViaObj, heightViaObj);
                  }
               } else {
                  node.resize(widthViaObj, heightViaObj);
               }
               figma.notify(`The object(s) have been resized!`, {
                  timeout: 1500,
               });
            } else {
               // Selected node CANNOT be resized
               figma.notify("Please make sure to select a resizable object!", {
                  error: true,
                  timeout: 1500,
               });
            }
         }
      });
      //figma.viewport.scrollAndZoomIntoView(selectedNodes);
   }
   // Make sure to close the plugin when you're done. Otherwise the plugin will
   // keep running, which shows the cancel button at the bottom of the screen.
   else {
      figma.closePlugin();
   }
};
