# path-maker

Path-Maker is a simple and intuitive graph paper app that lets the user sketch out figures on a movable canvas. It was intended for the purpose of keeping track of dungeon layouts while playing old-school tabletop games like OD&D RAW or dungeon-crawler games like Etrian Odyssey. There are plenty of sites and applications out there that aim to provide an immersive tabletop experience with rolling and rule integration, and most of them are at least a little overbuilt, so I tried to make something with minimal specs that would still be usable.

There are three kinds of figures that can be drawn (lines, arcs, and freehand shapes), which you can switch between using the buttons in the top left, as well a toggleable movement option that lets you drag the viewport around:

![drawing_type_buttons](https://user-images.githubusercontent.com/74376627/128580737-37e418ae-505c-46a9-9b69-0ffc5949f9d7.png)


Actions can easily be undone, redone, and reset. This is handled with two stacks on the backend:

```javascript
  undoShape() {
    if(this.currShape !== null) {
      this.currShape = null;
      return;
    }
    if(this.shapes.length === 0) {return;}
    const shape = this.shapes.pop();
    this.undoneShapes.push(shape);
    this.updateSave();
  }

  redoShape() {
    if(this.undoneShapes.length === 0) {return;}
    const shape = this.undoneShapes.pop();
    this.shapes.push(shape);
    this.updateSave();
  }

  resetShapes() {
    this.shapes = [];
    this.undoneShapes = [];
    this.currShape = null;
    this.active = false;
    this.grid.xOffset = grid.width*grid.cellSize/2;
    this.grid.yOffset = grid.height*grid.cellSize/2;
    this.updateSave();
  }
```

There is automatic snap-to-grid functionality that can be turned off via a dropdown menu.

It is now also possible to save and load maps as JSON. The serialization is accomplished very simply:

```javascript
  serializeShapes() {
    return JSON.stringify({shapes: this.shapes.map(shape =>
        Object.assign(shape,{class: shape.constructor.name})
      )}
    );
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
        default:
          throw new Error('Invalid JSON');
      }
      delete shapeData.class;
      return Object.assign(new ShapeType,shapeData);
    });
  }
}
```

The file transfer functionality is implemented with `URL.createObjectURL` and `URL.revokeObjectURL` on the download side, and a hidden HTML `<input type=file/>` tag on the upload side. I was already saving the map data to localStorage, so I created a Proxy object that would automatically update the object URL when a new map object is saved to localStorage:

```javascript
  const downloadLink = document.querySelector(".download-link");
  const storage = window.localStorage;
  const storageProxy = new Proxy({}, {
    set: (obj, key, value) => {
      storage.setItem(key,value);
      if(key === "shapes") {
        const json = [value];
        const blob = new Blob(json, {type: 'text/plain;charset=utf-8'});
        const oldObjectURL = downloadLink.href;
        downloadLink.href = URL.createObjectURL(blob);
        URL.revokeObjectURL(oldObjectURL);
      }
      return value;
    },
    get: (obj, prop) => {
      return storage.getItem(prop);
    }
  });
```
