var drawCanvas = (function () {

        self.canvasData = null;
        self.magasins = [];

        self.highlighted = null;
        var contextRotation = 0;
        var angle90 = -Math.PI / 2
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

            if (onclickFn)
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
            $(graphDiv).html("");
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
                if (d.type == "line") {
                    context.strokeStyle = "#888";
                    context.beginPath();
                    context.moveTo(d.x1, d.y1);
                    context.lineTo(d.x2, d.y2);
                    context.stroke();
                } else if (d.type == "rect") {
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
                    context.textAlign = d.textAlign || "center"
                    if (d.vertical) {
                        context.save();
                        context.translate( d.x, d.y);
                        context.rotate(angle90);
                        context.fillText(d.text, 0, 0);
                    }else{
                        context.fillText(d.text, d.x, d.y);
                    }

                    if (d.vertical) {
                        context.restore()

                    }
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


            var url = "./heatMap"
            if (options.query) {
                var queryStr = encodeURIComponent(JSON.stringify(options.query))
                url += "?query=" + queryStr
            }
            if (options.onclickFn)
                onclickFn = options.onclickFn;
            d3.json(url).then(function (data) {

                totalWidth = $(graphDiv).width() - 50;
                totalHeight = $(graphDiv).height() - 50;
                canvasData = self.bindData(data);
                self.highlighted = null;
                self.canvasData = canvasData;
                self.rawData = data;
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
            var margin = 100;
            var x = margin;
            var y = margin;
            var w = Math.round((totalWidth - margin) / data.data.length);
            data.data.forEach(function (line, lineIndex) {
                var x = 100;
                line.forEach(function (row, rowIndex) {
                    var bgColor = "#aaa"
                    if (row > 0)
                        bgColor = interpolateViridisColours(Math.log(row))
                    if(row==20)
                        xx=3
                    var rect = {
                        type: "rect",
                        x: x,
                        y: y,
                        w: w,
                        h: w,
                        bgColor: bgColor,
                        //   lineWidth:1,
                        coords: {x: lineIndex, y: rowIndex}

                    }
                    canvasData.push(rect);
                    x += w
                })


                y += w
            })

            var y0 = margin;
            var x0 = margin;
            data.labels.forEach(function (label, index) {
                var p=label.indexOf("-");
                if(p>0)
                   label= label.substring(0,p)

                if (index == 0 || data.labels[index - 1].substring(0, 3) != label.substring(0, 3)) {
                    var line = {
                        type: "line",
                        x1: 0,
                        y1: y0 + (index * w),
                        x2: totalWidth,
                        y2: y0 + (index * w),
                        lineWidth: "2px"
                    }
                    canvasData.push(line);

                    canvasData.push({
                        type: "text",
                        text: label,
                        textAlign: "end",
                        font: "14px courrier normal",
                        color: "black",
                        x: margin - 5,
                        y: y0 + (index * w) + 10,
                    })
                    //vert

                    var line = {
                        type: "line",
                        x1: x0 + (index * w),
                        y1: 0,
                        x2: x0 + (index * w),
                        y2: totalHeight,
                        lineWidth: "2px"
                    }
                    canvasData.push(line);

                    canvasData.push({
                        type: "text",
                        text: label,
                        textAlign: "start",
                        font: "14px courrier normal",
                        stroke: "black",
                        x: x0 + (index * w) + 10,
                        y:margin-5,
                        vertical: true
                    })
                }
            });

            return canvasData;
        }

        return self;
    }

)()

