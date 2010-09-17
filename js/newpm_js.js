   var canvas,ctx,width,height,bggradsky,bggradground,bggradmouse,horizon,aC=0,scale,makewater,lRC,rRC;
   var fC,fS,fromDot,toDot,mouseX=0,mouseY=0;
   var Pi2 = Math.PI*2;
   var fakeLimit=Pi2*100>>0;
   var benchmark=[],bi;
    

   fS = [];
   for(var i= -fakeLimit;i<fakeLimit;i++){
        fS[i] = Math.sin(i*0.01);
   }
   fC = [];
   for(var i= -fakeLimit;i<fakeLimit;i++){
        fC[i] = Math.cos(i*0.01);
   }
   
   $(document).ready(function() {
       canvas = document.getElementById('bgcanvas');
       ctx = canvas.getContext('2d');
       $(document).mousemove(function(e){
          mouseX = e.pageX;
          mouseY = e.pageY;
          if(canvas) {
             var gradX = (mouseX/scale) + (canvas.width>>2);
             bggradmouse = ctx.createRadialGradient(gradX,mouseY/scale,0,gradX,mouseY/scale,30);
             bggradmouse.addColorStop(0, "rgba(140,120,250,1)");
             bggradmouse.addColorStop(0.9, "rgba(75,60,120,1)");
             bggradmouse.addColorStop(1, "rgba(0,0,0,-1)");
          }
       });
       setInterval("draw()", 10);
   });
   
   function init(){
       scale=3;
       aC = 0;
       width = window.innerWidth / scale;
       height = window.innerHeight / scale;
       lRC=width>>1;
       rRC=lRC+width;
       horizon = (height * 0.67)>>0;
       canvas.setAttribute('width', width * 2);
       canvas.setAttribute('height', height);
       $("#bgcanvas").css("left","-"+(window.innerWidth>>1)+"px");
       $("#bgcanvas").css("width",(window.innerWidth<<1)+"px");
       bggradsky = ctx.createLinearGradient((canvas.width/2>>0)+1,0,(canvas.width/2>>0)+1,horizon);
       bggradsky.addColorStop(0, '#330044');
       bggradsky.addColorStop(0.75, '#66223a');
       bggradsky.addColorStop(0.90, '#883333');
       bggradsky.addColorStop(1, '#ee4422');
       bggradsun = ctx.createRadialGradient(canvas.width*0.4,height * 0.72,0,canvas.width*0.4,height*0.72,canvas.width/3);
       bggradsun.addColorStop(0, "rgba(255,230,40,1)");
       bggradsun.addColorStop(0.12, "rgba(255,200,40,1)");
       bggradsun.addColorStop(0.3, "rgba(255,160,20,0.3)");
       bggradsun.addColorStop(1, "rgba(255,100,10,0)");
       rCA = 0.0003*(height/3);
       makewater = ctx.getImageData(0,horizon,canvas.width,canvas.height - horizon);

       // draw sky
       ctx.fillStyle = bggradsky;
       ctx.fillRect(0,0,canvas.width,horizon);
   
       // draw sun
       ctx.fillStyle = bggradsun;
       ctx.fillRect(0,0,canvas.width,horizon);
       if(imgready){
           ctx.drawImage(img,imgx,imgy);    
       }
       ctx.save();   
   }
   $(window).resize(init);
   
   var img=null,imgx,imgy,imgready=false;

   var draw=function(){
       if(!canvas) return false;
       if(aC===0) init();

       var benchstart=(new Date).getTime();
       var rCA,cosVal,sinVal,alti;
   
       horizon = (height * 0.67)>>0;
       canvas.setAttribute('width', width<<1);
       canvas.setAttribute('height', height);
   
       ctx.restore();
       aC++;
       if(aC>fakeLimit)aC=1; //sanity check
   
       ctx.fillStyle = bggradmouse;
       ctx.fillRect(0,0,canvas.width,horizon);
       
       // would love to use createImageData instead of getImageData, but Opera won't let me.
       var getsky = ctx.getImageData(0,0,canvas.width,horizon);
//       var gsD=getsky.data;     // Everything above the sky, used as source data to generate the reflection
       var gsW=getsky.width;    // what's the width? sky is 2x big on purpose, so that edges don't wrap in reflection
       var gsH=getsky.height;   // simple height.
       var rS=getsky.width<<2;  // 4 values per pixel in canvas, <<2 is a far faster version of *4.
       var startRow=gsH>>1;     // since the water portion is half the height of the sky, we can start half through getsky. >>1 = faster /2
       var rCA=50;              // rCA is an accumulator that is used to have waves be closer together near the horizon
       var rCAInc=0.95;         // rCA is multiplied by this each row in the main loop
       var aCDiv4H=aC<<3;       // aC gets incremented each frame of animation. this is the value that moves the waves toward the viewer
       var aCDiv4V=aC<<3;       // this value moves the waves left each frame.
       var cC=gsW>>1;           // Stored alias for the middle of the image data.
       for (var i=gsH;i>=startRow;i--) {
         var iH=gsH-i-2;                                    // since we iterate backwards, this alias helps with the math
         rCA=rCA*rCAInc;                                    // see the rCA comments above this loop
         cosVal=(i*rCA)+aCDiv4H;                            // The actual value that gets Cosine'd for the waves horizontally.
         var wH=iH<<2;                                      // Wave height. explained later.
         var cosRow=(fC[~~(cosVal%fakeLimit)]*wH)>>2;       // (this is + or -) instead of pulling row 'i'. Add cosRow to 'i' and that's your row from sky.
         var rowCosMath=(i+cosRow)*rS;                      // adding to 'i' and multiply by the rowsize to get starting point for the inner loop.
         var toDot=iH*rS+(lRC<<2);                                // pre-calc'ing the leftmost .data position of this row in the destination .data
         var sinPreCalc=rCA-(rCA>>4);                       // rCA perspective math doesn't change inside the inner loop, so it's extracted here and aliased.
         for (var j=lRC; j<rRC; j++) {
             sinVal = ((j-cC)*sinPreCalc+aCDiv4V);          // The value to do Sine against 
             alti=(fS[~~(sinVal%fakeLimit)]*wH)>>2;         // Sine sinVal, multiply it by the wave height, then divide by 4 (>>2)
             fromDot = rowCosMath + ((j+alti)<<2);          // Final math to determine where to pull the source dot values from
             makewater.data[toDot++]=getsky.data[fromDot++];          // Do the actual value transfers here (red)
             makewater.data[toDot++]=getsky.data[fromDot++];        // and here (green)
             makewater.data[toDot++]=getsky.data[fromDot];        // and here (blue)
             makewater.data[toDot++]=255;                   // opacity is always opaque, so just use literal 255.
         }
       }
       ctx.putImageData(makewater,0,horizon,0,0,makewater.width,makewater.height);          // put the final water where it needs to go
       benchmark[1]["mstime"] = (new Date).getTime()-benchstart;
       benchmark[1]["iterations"]+=1;
       ctx.save();                                                                          // push the scene on the stack.
   }
