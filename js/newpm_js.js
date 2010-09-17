var canvas, ctx, width, height, bggradsky, bggradground, bggradmouse, horizon, aC = 0,
    scale, makewater, lRC, rRC;
var fC, fS, fromDot, toDot, mouseX = 0,
    mouseY = 0;
var Pi2 = Math.PI * 2;
var fakeLimit = Pi2 * 100 >> 0;
fS = [];
for (var i = -fakeLimit; i < fakeLimit; i++) {
    fS[i] = Math.sin(i * 0.01);
}
fC = [];
for (var i = -fakeLimit; i < fakeLimit; i++) {
    fC[i] = Math.cos(i * 0.01);
}

$(document).ready(function () {
    canvas = document.getElementById('bgcanvas');
    ctx = canvas.getContext('2d');
    $(document).mousemove(function (e) {
        mouseX = e.pageX;
        mouseY = e.pageY;
        if (canvas) {
            var gradX = (mouseX / scale) + (canvas.width >> 2);
            bggradmouse = ctx.createRadialGradient(gradX, mouseY / scale, 0, gradX, mouseY / scale, 30);
            bggradmouse.addColorStop(0, "rgba(140,120,250,1)");
            bggradmouse.addColorStop(0.9, "rgba(75,60,120,1)");
            bggradmouse.addColorStop(1, "rgba(0,0,0,-1)");
        }
    });
    setInterval("draw()", 10);
});

function init() {
    scale = 3;
    aC = 0;
    width = window.innerWidth / scale;
    height = window.innerHeight / scale;
    lRC = width >> 1;
    rRC = lRC + width;
    horizon = (height * 0.67) >> 0;
    canvas.setAttribute('width', width * 2);
    canvas.setAttribute('height', height);
    $("#bgcanvas").css("left", "-" + (window.innerWidth >> 1) + "px");
    $("#bgcanvas").css("width", (window.innerWidth << 1) + "px");
    bggradsky = ctx.createLinearGradient((canvas.width / 2 >> 0) + 1, 0, (canvas.width / 2 >> 0) + 1, horizon);
    bggradsky.addColorStop(0, '#330044');
    bggradsky.addColorStop(0.75, '#66223a');
    bggradsky.addColorStop(0.90, '#883333');
    bggradsky.addColorStop(1, '#ee4422');
    bggradsun = ctx.createRadialGradient(canvas.width * 0.4, height * 0.72, 0, canvas.width * 0.4, height * 0.72, canvas.width / 3);
    bggradsun.addColorStop(0, "rgba(255,230,40,1)");
    bggradsun.addColorStop(0.12, "rgba(255,200,40,1)");
    bggradsun.addColorStop(0.3, "rgba(255,160,20,0.3)");
    bggradsun.addColorStop(1, "rgba(255,100,10,0)");
    rCA = 0.0003 * (height / 3);
    makewater = ctx.getImageData(0, horizon, canvas.width, canvas.height - horizon);
    ctx.save();
}
$(window).resize(init);

var img = null,
    imgx, imgy, imgready = false;

function draw() {
    if (!canvas) return false;
    if (canvas && aC === 0) init();

    var rCA, cosVal, sinVal, alti;

    horizon = (height * 0.67) >> 0;
    canvas.setAttribute('width', width * 2);
    canvas.setAttribute('height', height);

    ctx.restore();
    aC=(aC > fakeLimit)?aC = 1:aC++; //sanity check
    // draw sky
    ctx.fillStyle = bggradsky;
    ctx.fillRect(0, 0, canvas.width, horizon);

    // draw sun
    ctx.fillStyle = bggradsun;
    ctx.fillRect(0, 0, canvas.width, horizon);
    if (imgready) {
        ctx.drawImage(img, imgx, imgy);
    }

    ctx.fillStyle = bggradmouse;
    ctx.fillRect(0, 0, canvas.width, horizon);

    // would love to use createImageData instead of getImageData, but Opera won't let me.
    var getsky = ctx.getImageData(0, 0, canvas.width, horizon),
        gsD = getsky.data,
        // Everything above the sky, used as source data to generate the reflection
        gsW = getsky.width,
        // what's the width? sky is 2x big on purpose, so that edges don't wrap in reflection
        gsH = getsky.height,
        // simple height.
        rS = getsky.width << 2,
        // 4 values per pixel in canvas, <<2 is a far faster version of *4.
        startRow = gsH >> 1,
        // since the water portion is half the height of the sky, we can start half through getsky. >>1 = faster /2
        rCA = 50,
        // rCA is an accumulator that is used to have waves be closer together near the horizon
        rCAInc = 0.95,
        // rCA is multiplied by this each row in the main loop
        aCDiv4H = aC << 3,
        // aC gets incremented each frame of animation. this is the value that moves the waves toward the viewer
        aCDiv4V = aC << 3,
        // this value moves the waves left each frame.
        cC = gsW >> 1; // Stored alias for the middle of the image data.
    for (var i = gsH; i >= startRow; i--) {
        rCA = rCA * rCAInc; // see the rCA comments above this loop
        cosVal = (i * rCA) + aCDiv4H; // The actual value that gets Cosine'd for the waves horizontally.
        var iH = gsH - i - 2,
            // since we iterate backwards, this alias helps with the math
            wH = iH << 2,
            // Wave height. explained later.
            cosRow = (fC[~~ (cosVal % fakeLimit)] * wH) >> 2,
            // (this is + or -) instead of pulling row 'i'. Add cosRow to 'i' and that's your row from sky.
            rowCosMath = (i + cosRow) * rS,
            // adding to 'i' and multiply by the rowsize to get starting point for the inner loop.
            toDot = iH * rS + (lRC << 2),
            // pre-calc'ing the leftmost .data position of this row in the destination .data
            sinPreCalc = rCA - (rCA >> 4); // rCA perspective math doesn't change inside the inner loop, so it's extracted here and aliased.
        for (var j = lRC; j < rRC; j++) {
            sinVal = ((j - cC) * sinPreCalc + aCDiv4V); // The value to do Sine against 
            alti = (fS[~~ (sinVal % fakeLimit)] * wH) >> 2; // Sine sinVal, multiply it by the wave height, then divide by 4 (>>2)
            fromDot = rowCosMath + ((j + alti) << 2); // Final math to determine where to pull the source dot values from
            makewater.data[toDot++] = gsD[fromDot++]; // Do the actual value transfers here (red)
            makewater.data[toDot++] = gsD[fromDot++]; // and here (green)
            makewater.data[toDot++] = gsD[fromDot++]; // and here (blue)
            makewater.data[toDot++] = 255; // opacity is always opaque, so just use literal 255.
        }
    }
    ctx.putImageData(makewater, 0, horizon, 0, 0, makewater.width, makewater.height); // put the final water where it needs to go
    ctx.save(); // push the scene on the stack.
}