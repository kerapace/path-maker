const GridAPI = require("./grid.js");
const {Line, Arc, Freehand} = require("./shapes.js");
const canvas = document.getElementById("map-canvas");
const downloadLink = document.querySelector(".download-link");
const storage = window.localStorage;
const storageProxy = new Proxy(storage, {
  setItem: (target, key, shapes) => {
    if(key === "shapes") {
      const json = [shapes];
      const blob = new Blob(json, {type: 'text/plain;charset=utf-8'});
      const oldObjectURL = downloadLink.href;
      downloadLink.href = URL.createObjectURL(blob);
      URL.revokeObjectURL(oldObjectURL);
    }
    return Reflect.setItem(...arguments);
  },
});
const gridAPI = new GridAPI(canvas,storageProxy);
const buttons = document.querySelectorAll(".draw-button");
buttons.forEach(button => button.addEventListener("click",(e) => {gridAPI.tool = e.target.dataset.tool}));
gridAPI.drawGrid();
let shapes = storage.getItem("shapes");
if (shapes) {
  gridAPI.loadShapesFromJSON(shapes);
}
const initialJSON = [shapes];
const initialBlob = new Blob(initialJSON, {type: 'text/plain;charset=utf-8'});
downloadLink.href = URL.createObjectURL(initialBlob);

const importJSON = document.getElementById("import-json");

importJSON.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = () => {
    gridAPI.loadShapesFromJSON(reader.result);
    gridAPI.updateSave();
  }
  reader.onerror = () => {
    window.alert(reader.error);
  }
});



const viewBox = document.querySelector(".viewbox");
const modalButton = document.querySelector(".infobox");
const modalBackground = document.querySelector(".modal-background");
const snapToGridOptions = document.querySelector(".snap-options-dropdown");
const undoButton = document.querySelector(".undo-button");
const redoButton = document.querySelector(".redo-button");
const resetButton = document.querySelector(".reset-button");
const uploadButton = document.querySelector(".upload-button");

uploadButton.addEventListener("click", () => {
  importJSON.click();
})


snapToGridOptions.addEventListener("click", (e) => {
    const stg = e.target.dataset.stg;
    if(stg === "false") {
      gridAPI.isSnappedToGrid = false;
    }
    else {
      gridAPI.isSnappedToGrid = true;
      gridAPI.snapToGrid = stg;
    }
  }
);

[modalButton,modalBackground].forEach(el => 
  el.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      modalBackground.classList.toggle("visible");
      viewBox.classList.toggle("blurred");
    }
  })
);

undoButton.addEventListener("click", (e) => gridAPI.undoShape());
redoButton.addEventListener("click", (e) => gridAPI.redoShape());
resetButton.addEventListener("click", (e) => gridAPI.resetShapes());

canvas.addEventListener("mousedown", (e) => {
  switch(gridAPI.tool) {
    case "move":
      gridAPI.active = true;
      gridAPI.updatePosition(e);
      break;
    case "freehand":
      gridAPI.active = true;
      gridAPI.updatePosition(e);
      gridAPI.currShape = new Freehand([[gridAPI.position.x,gridAPI.position.y]]);
      break;
  }
});

canvas.addEventListener("click", (e) => {
  switch(gridAPI.tool) {
    case "line":
      if(gridAPI.currShape) {
        gridAPI.updatePosition(e);
        gridAPI.currShape.x2 = gridAPI.position.x;
        gridAPI.currShape.y2 = gridAPI.position.y;
        gridAPI.completeShape();
      }
      else {
        gridAPI.updatePosition(e);
        gridAPI.currShape = new Line(gridAPI.position.x,gridAPI.position.y);
        gridAPI.active = true;
      }
      break;
    case "arc":
      if (gridAPI.currShape) {
        if (gridAPI.currShape.rad === undefined) {
          gridAPI.updatePosition(e);
          gridAPI.currShape.rad = Math.sqrt((gridAPI.position.x-gridAPI.currShape.x)**2 + (gridAPI.position.y-gridAPI.currShape.y)**2);
          gridAPI.currShape.startAngle = Math.atan2(gridAPI.position.y-gridAPI.currShape.y,gridAPI.position.x-gridAPI.currShape.x);
          gridAPI.isSnappedToGrid = false;
        }
        else {
          gridAPI.updatePosition(e);
          gridAPI.currShape.endAngle = Math.atan2(gridAPI.position.y-gridAPI.currShape.y,gridAPI.position.x-gridAPI.currShape.x);
          gridAPI.completeShape();
          gridAPI.isSnappedToGrid = true;
        }
      }
      else {
        gridAPI.updatePosition(e);
        gridAPI.currShape = new Arc(gridAPI.position.x,gridAPI.position.y);
        gridAPI.active = true;
      }
    }
});

document.addEventListener("mousemove", (e) => {
  if(!gridAPI.active) {
    gridAPI.updateHoverPosition(e);
    return;
  }
  switch(gridAPI.tool) {
    case "move":
      gridAPI.moveView(gridAPI.position.x-gridAPI.grid.xOffset-e.offsetX,gridAPI.position.y-gridAPI.grid.yOffset-e.offsetY);
      gridAPI.updatePosition(e);
      break;
    case "freehand":
      gridAPI.updatePosition(e);
      if (e.target === canvas) {gridAPI.currShape.points.push([gridAPI.position.x,gridAPI.position.y]);}
      break;
    case "arc":
    case "line":
      if(gridAPI.currShape) {
        gridAPI.updatePosition(e);
      }
      break;
  }
});

canvas.addEventListener("mouseup", (e) => {
  if(!gridAPI.active) {return;}
  switch(gridAPI.tool) {
    case "move":
      gridAPI.moveView(gridAPI.position.x-e.offsetX-gridAPI.grid.xOffset,gridAPI.position.y-e.offsetY-gridAPI.grid.yOffset);
      gridAPI.active = false;
      break;
    case "freehand":
      gridAPI.updatePosition(e);
      gridAPI.currShape.points.push([gridAPI.position.x,gridAPI.position.y]);
      gridAPI.completeShape();
      gridAPI.active = false;
  }
});

canvas.addEventListener("mouseleave",(e) => {

});

canvas.addEventListener("mouseenter",(e) => {
  if(!gridAPI.active) {return;}
  switch(gridAPI.tool) {
    case "freehand":
      gridAPI.updatePosition(e);
      gridAPI.currShape.points.push([gridAPI.position.x,gridAPI.position.y]);
  }
});