const gsap = require("gsap");
const {Arc, Line, Freehand} = require("./shapes");

function createCells(width, height) {
  const cells = [];
  const len = width*height;
    for(let i = 0; i < len; i++) {
      cells.push({
        i,
        x: i % width,
        y: Math.floor(i / width),
      });
    }
  return cells;
}

function createBounds(grid) {
  return {
    xMin: 0,
    yMin: 0,
    xMax: grid.cellSize * grid.width - grid.canvas.width,
    yMax: grid.cellSize * grid.height - grid.canvas.height,
  };
}

function defineGrid(canvas) {
  grid = {};
  grid.canvas = canvas;
  grid.cellSize = 20;
  grid.width = 100;
  grid.height = 100;
  grid.xOffset = grid.width*grid.cellSize/2;
  grid.yOffset = grid.height*grid.cellSize/2;
  grid.cells = createCells(grid.width,grid.height);
  grid.bounds = createBounds(grid);
  return grid;
}


class GridAPI {
  constructor(canvas,storage) {
    this.grid = defineGrid(canvas);
    this.ctx = canvas.getContext('2d');
    this.shapes = [];
    this.position = {x: null, y: null};
    this.hoverPosition = {x: null, y: null};
    this.active = false;
    this.tool = "move";
    this.currShape = null;
    this.snapToGrid = 20;
    this.isSnappedToGrid = true;
    this.storage = storage;
    setInterval(() => {
      this.ctx.clearRect(0,0,canvas.width,canvas.height);
      this.drawGrid();
      this.ctx.strokeStyle = "#000000";
      this.shapes.forEach(shape => shape.draw(this.ctx,this.grid));
      if(this.currShape !== null) {this.currShape.draw(this.ctx,this.grid,this.position);}
      if(this.isSnappedToGrid && (this.tool === "arc" || this.tool === "line") && !this.active) {
        this.ctx.fillStyle = "#fcad03";
        this.ctx.beginPath();
        this.ctx.arc(this.hoverPosition.x-this.grid.xOffset,this.hoverPosition.y-this.grid.yOffset,2,0,2*Math.PI);
        this.ctx.fill();
      }
    },30);
  }

  moveView(deltaX, deltaY) {
    this.grid.xOffset += deltaX;
    this.grid.yOffset += deltaY;
    this.applyBounds();
  }

  drawGrid() {
    this.ctx.strokeStyle = "#5bd5e3";
    const grid = this.grid;
    grid.cells.forEach(cell => 
      {
        if(cell.x * (grid.cellSize + 1) < grid.xOffset ||
          cell.y * (grid.cellSize + 1) < grid.yOffset || 
          cell.x * grid.cellSize > grid.xOffset + grid.canvas.width ||
          cell.y * grid.cellSize > grid.yOffset + grid.canvas.height) {
          return;
        }
        else {
          this.ctx.strokeRect(cell.x*grid.cellSize-grid.xOffset,cell.y*grid.cellSize-grid.yOffset,grid.cellSize,grid.cellSize)
        }
      }
    );
  }

  applyBounds() {
    this.grid.bounds || (this.grid.bounds = createBounds(this.grid));
    this.grid.xOffset = this.grid.xOffset < this.grid.bounds.xMin ? this.grid.bounds.xMin : this.grid.xOffset;
    this.grid.yOffset = this.grid.yOffset < this.grid.bounds.yMin ? this.grid.bounds.yMin : this.grid.yOffset;
    this.grid.xOffset = this.grid.xOffset > this.grid.bounds.xMax ? this.grid.bounds.xMax : this.grid.xOffset;
    this.grid.yOffset = this.grid.yOffset > this.grid.bounds.yMax ? this.grid.bounds.yMax : this.grid.yOffset;
  }

  updatePosition(e) {
    console.log(this.isSnappedToGrid);
    if(this.isSnappedToGrid === false || this.tool === "freehand" || this.tool === "move") {
      this.position = {x: this.grid.xOffset+e.offsetX, y: this.grid.yOffset+e.offsetY};
    } else {
      this.position = {
        x: this.snapToGrid*Math.round((this.grid.xOffset+e.offsetX)/this.snapToGrid),
        y: this.snapToGrid*Math.round((this.grid.yOffset+e.offsetY)/this.snapToGrid),
      }
    }
  }

  updateHoverPosition(e) {
    if(this.isSnappedToGrid) {
      this.hoverPosition = {
        x: this.snapToGrid*Math.round((this.grid.xOffset+e.offsetX)/this.snapToGrid),
        y: this.snapToGrid*Math.round((this.grid.yOffset+e.offsetY)/this.snapToGrid),
      }
    }
  }

  discardShape() {
    this.currShape = null;
    this.active = false;
  }

  undoShape() {

  }

  redoShape() {
    
  }

  completeShape() {
    this.shapes.push(this.currShape);
    this.currShape = null;
    this.active = false;
    this.storage.setItem("shapes",this.serializeShapes());
  }

  serializeShapes() {
    return JSON.stringify({shapes: this.shapes.map(shape => Object.assign(shape,{class: shape.constructor.name}))});
  }

  loadShapesFromJSON(json) {
    this.shapes = JSON.parse(json).shapes.map(shapeData => {
      let ShapeType = Object;
      switch (shapeData.class) {
        case "Line":
          ShapeType = Line;
          break;
        case "Arc":
          ShapeType = Arc;
          break;
        case "Freehand":
          ShapeType = Freehand;
          break;
      }
      delete shapeData.class;
      return Object.assign(new ShapeType,shapeData);
    });
  }
}

module.exports = GridAPI;