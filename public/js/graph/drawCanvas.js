var drawCanvas = (function () {

        self.canvasData = null;
        self.magasins = [];

        self.highlighted = null;

        var onclickFn = null;

        var totalWidth;
        var totalHeight;

        var canvas;
        var context;
        var canvasData = [];
        var currentZoomTransform = {x: 0, y: 0, k: 1};
        var zoom = null;


        var drawEpis = true;
        var drawTravees = true;
        var drawTablettes = true;
        var drawBoites = true;
        var drawTraveeNumber = true;
        var drawTabletteNumber = true;
        var tabletteTextSpacing = 8;
        var nBoitesTablette = 13;
        var oldNumVersement = "";
        var nMagByLine = 10;

        var zoomExtent = [0.2, 10]



        var highlightAttrs = {
            alpha: 0.1,
            strokeColor: "#c00000",
            lineWidth: 2

        }

        var palette = [
            "#0072d5",
            '#FF7D07',
            "#c00000",
            '#FFD900',
            '#B354B3',
            "#a6f1ff",
            "#007aa4",
            "#584f99",
            "#cd4850",
            "#005d96",
            "#ffc6ff",
            '#007DFF',
            "#ffc36f",
            "#ff6983",
            "#7fef11",
            '#B3B005',
        ]





        function onClick(point, obj) {

            if (onclickFn )
                onclickFn(point, obj)
            if (obj.data) {
                $("#graphInfos").html(obj.data.name);
            }
        }

        var zoomed = function (transform) {
            if (!transform)
                transform = d3.event.transform;
            context.save();
            context.clearRect(0, 0, totalWidth, totalWidth);
            context.translate(transform.x, transform.y);
            context.scale(transform.k, transform.k);
            currentZoomTransform = transform
            self.draw();
            context.fill();
            context.restore();
        }

        function clicked() {
            var point = d3.mouse(this);
            var x = d3.event.pageX;
            var y = d3.event.pageY;
            var realPoint = [x, y];
            point[0] = (point[0] - currentZoomTransform.x) / currentZoomTransform.k
            point[1] = (point[1] - currentZoomTransform.y) / currentZoomTransform.k
            var node;
            canvasData.forEach(function (rect) {


                if (rect.x < point[0] && (rect.x + rect.w) > point[0]) {
                    if (rect.y < point[1] && (rect.y + rect.h) > point[1]) {
                        return node = rect;
                    }
                }
            })
            onClick(realPoint, node)
        }

        function moved() {
            //  $("#popupD3Div").css("visibility", "hidden")
        }


        function initCanvas(graphDiv) {
            currentZoomTransform = {x: 0, y: 0, k: 1};
            canvas = d3.select(graphDiv)
                .append('canvas')
                .attr('width', totalWidth)
                .attr('height', totalHeight);
            canvas.on('mousedown', clicked).on('mousemove', moved);
            context = canvas.node().getContext('2d');
            var customBase = document.createElement('custom');
            var custom = d3.select(customBase); // this is our svg replacement
            zoom = d3.zoom().scaleExtent(zoomExtent).on("zoom", zoomed);
            d3.select(context.canvas).call(zoom);

        }


        function clearCanvas() {
            context.clearRect(0, 0, totalWidth, totalHeight);
        }


        self.draw = function (data, options, callback) {
            clearCanvas();
            if (!data)
                data = canvasData;
            if (!options)
                options = {};


            data.forEach(function (d, index) {
                var lineWidth;
                var color;

                context.globalAlpha = 1.0;
                if (self.highlighted) {//opacity
                    if (self.highlighted.indexOf(index) < 0)
                        context.globalAlpha = highlightAttrs.alpha;
                    else {
                        lineWidth = highlightAttrs.lineWidth;
                        color = highlightAttrs.strokeColor
                    }

                }
                if (lineWidth)
                    context.lineWidth = lineWidth;
                else if (d.lineWidth)
                    context.lineWidth = d.lineWidth;

                else
                    context.lineWidth = 0;

                if (d.type == "rect") {
                    if (d.bgColor) {
                        context.fillStyle = d.bgColor
                        context.fillRect(d.x, d.y, d.w, d.h)
                    }
                    if (lineWidth || (d.lineWidth && d.lineWidth != 0)) {
                        if (color)
                            context.strokeStyle = color;
                        else if (d.color)
                            context.strokeStyle = d.color;

                        context.strokeRect(d.x, d.y, d.w, d.h);
                    }
                } else if (d.type = "text") {
                    if (d.color)
                        context.fillStyle = d.color;
                    context.font = d.font;
                    context.textAlign = "center";
                    context.fillText(d.text, d.x, d.y);
                }
            });
            if (callback)
                return callback(null)
        }


        self.setMagasinsButtons = function () {
            var strMagasins = ""
            var magasins = self.magasinsToDraw;
            magasins.splice(0, 0, "tous")
            magasins.forEach(function (magasin) {
                strMagasins += "<span style='font-size: 18px;font-weight: bold;margin: 3px;padding:3px;border-style: solid ; border-width: 1px' onclick=magasinsD3Canvas.zoomOnMagasin('" + magasin + "')>" + magasin + "</span>"

            })
            $("#magasinButtonsDiv").html(strMagasins)
        }


        self.zoomOnMagasin = function (magasin) {
            self.highlighted = null;
            if (magasin == "tous") {
                var transform = d3.zoomIdentity;
                transform.k = 0.3

                return zoomed(transform);
            }
            var selectedRectIndex = null
            canvasData.forEach(function (rect, index) {
                if (rect.nature == "magasin" && rect.data && rect.data.name == magasin)
                    return selectedRectIndex = index;

            })
            self.zoomOnObjectIndex(selectedRectIndex, 0.8, [100, 50])

        }

        self.zoomOnObjectIndex = function (index, zoomlevel, position) {
            var rect = canvasData[index]
            /*   var transform = {
                   x: (selectedRect.x - 100),
                   y: selectedRect.y,

               };*/
            d3.zoomIdentity.k = zoomlevel;

            zoomed(d3.zoomIdentity);
            zoom.translateTo(canvas, rect.x, rect.y, position)
        }


        self.zoomOut = function () {
            var transform = d3.zoomIdentity;
            transform.k = 0.3

            return zoomed(transform);
            //  zoom.translateTo(canvas, 0,0,[100,100] )
            //   zoom.scaleTo(canvas,zoomExtent[0])
        }

        self.drawAll = function (options, callback) {
            if (!options)
                options = {};

            if (options.onclickFn)
                onclickFn = options.onclickFn;
            d3.json("./heatMap").then(function (data) {

                totalWidth = $(graphDiv).width() - 50;
                totalHeight = $(graphDiv).height() - 50;
                canvasData = self.bindData(data);
                self.highlighted = null;
                self.canvasData = canvasData;
                self.rawData=data;
                initCanvas("#graphDiv");


                self.draw(canvasData, null, function (err, result) {
                    if (callback)
                        return callback(err)
                });



            })
        }


        /******************************************************************************************************************************/
        /*************************************************Bind data**************************************************************/
        /******************************************************************************************************************************/
        /******************************************************************************************************************************/

        self.bindData = function (data, options, callback) {

            var interpolateViridisColours = d3.scaleSequential(d3.interpolateYlOrRd).domain([1, Math.log(data.max)]);

            var canvasData = [];
            var x=100;
            var y=100;
            var w=Math.round(totalWidth/data.data.length);
            data.data.forEach(function(line,lineIndex){
                var x=100;
                line.forEach(function(row,rowIndex){
                   var bgColor="#aaa"
                  if(row>0)
                      bgColor =interpolateViridisColours(Math.log(row))
                    var rect={
                        type:"rect",
                        x:x,
                        y:y,
                        w:w,
                        h:w,
                        bgColor: bgColor,
                     //   lineWidth:1,
                        coords:{x:lineIndex,y:rowIndex}

                    }
                    canvasData.push(rect);
                  x+=w
            })

                y+=w
            })


            return canvasData;


        }

        return self;
    }


)()

