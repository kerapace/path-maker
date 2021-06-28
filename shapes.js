class Arc {
  constructor(x,y,rad,startAngle,endAngle) {
    Object.assign(this,{x,y,rad,startAngle,endAngle});
  }

  bounds() {
    return {
      minX: this.x-this.rad,
      minY: this.y-this.rad,
      maxX: this.x+this.rad,
      maxY: this.y+this.rad
    };
  }

  draw(ctx,grid,pos) {
    const rad = this.rad || Math.sqrt((pos.x-this.x)**2 + (pos.y-this.y)**2);
    const startAngle = this.startAngle === undefined ? Math.atan2(pos.y-this.y,pos.x-this.x) : this.startAngle;
    const endAngle = this.endAngle !== undefined ? 
      this.endAngle :
      this.startAngle === undefined ?
      startAngle + (2 * Math.PI) :
      (Math.atan2(pos.y-this.y,pos.x-this.x) - startAngle) % (2 * Math.PI) + startAngle;
    ctx.beginPath();
    ctx.arc(this.x-grid.xOffset,this.y-grid.yOffset,rad,startAngle,endAngle);
    ctx.stroke();
  }
}

class Line {
  constructor(x1,y1,x2,y2) {
    Object.assign(this,{x1,y1,x2,y2});
  }

  bounds() {
    return {
      minX: Math.min(this.x1,this.x2),
      minY: Math.min(this.y1,this.y2),
      maxX: Math.max(this.x1,this.x2),
      maxY: Math.max(this.y1,this.y2)
    };
  }

  draw(ctx,grid,pos) {
    ctx.beginPath();
    ctx.moveTo(this.x1-grid.xOffset,this.y1-grid.yOffset);
    const [x2, y2] = [this.x2,this.y2].some(a => a === undefined) ? [pos.x, pos.y] : [this.x2,this.y2];
    ctx.lineTo(x2-grid.xOffset,y2-grid.yOffset);
    ctx.stroke();
  }
}

class Freehand {
  constructor(points) {
    this.points = points;
  }

  bounds() {
    if(this._bounds !== undefined) {return this._bounds;}
    xcoords = points.map(point => point[0]);
    ycoords = points.map(point => point[1]);
    this._bounds = {
      minX: Math.min(...xcoords),
      minY: Math.min(...ycoords),
      maxX: Math.max(...xcoords),
      maxY: Math.max(...ycoords)
    };
    return this._bounds;
  }

  draw(ctx,grid) {
    ctx.beginPath();
    this.points.forEach(point => {
      ctx.lineTo(point[0]-grid.xOffset,point[1]-grid.yOffset);
    });
    ctx.stroke();
  }
}

module.exports = {
  Line,
  Arc,
  Freehand,
}