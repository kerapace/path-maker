const GridAPI = require("./grid.js");
const {Line, Arc, Freehand} = require("./shapes.js");
const canvas = document.getElementById("map-canvas");
const ctx = canvas.getContext('2d');
const gridAPI = new GridAPI(canvas);
const buttons = document.querySelectorAll(".draw-button");
buttons.forEach(button => button.addEventListener("click",(e) => {gridAPI.tool = e.target.dataset.tool}));
gridAPI.drawGrid();

const modalButton = document.querySelector(".infobox");
const modalBackground = document.querySelector(".modal-background");
const snapToGridOptions = document.querySelector(".snap-options-dropdown")

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
      canvas.classList.toggle("blurred");
    }
  })
);

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