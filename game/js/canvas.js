// this code is for screen size 
var aa=innerHeight
var bb = innerWidth
var tr=true
// changer will administer the change in subtitles below 
var changer=0; 

//data coming from another js files 
import {joke,aboutme,activities} from "./data.js"
var activity=activities

// for download pdf at end 
var downl=true;

// this code will be used for creating image from given path 
function createImage(imageSrc){
    const image= new Image()

 image.onload=function(){
    
}
  image.src= imageSrc
return image

}
// code to administer audio in the code after clicking button 

var myAudio = new Audio('./music/mario.mp3'); 
var myAudio1 = new Audio('./music/jump.mp3'); 
if (typeof myAudio.loop == 'boolean')
{
    myAudio.loop = true;
}
{
    myAudio.addEventListener('ended', function() {
        this.currentTime = 1;
        this.play();
    }, false);
}

var dow=document.getElementById('pddf')
dow.href ='./pdf/thanks.pdf'

// creating images from the path and createImage function 
var nation=createImage('./img/skao/nation.png')
var music=createImage('./img/music.png')
var a0=createImage('./img/skao/a0.png')
var a1=createImage('./img/skao/a1.png')
var a2=createImage('./img/skao/a2.png')
var meme1=createImage('./img/skao/abort.png')
var meme2=createImage('./img/skao/sts.png')
var a4=createImage('./img/skao/a4.png')

var platform= createImage('./img/platform.png')
var matlab =createImage('./img/matlab.png')

//not in use game 2 if require remove cart 

var python =createImage('./img/python.png')
var background = createImage('./img/backg.png')


var china =createImage('./img/skao/china.png')
var canada =createImage('./img/skao/canada.png')
var uk=createImage('./img/skao/uk.png')
var india =createImage('./img/skao/india.png')
var france =createImage('./img/skao/france.png')
var portugal =createImage('./img/skao/portugal.png')
var italy = createImage('./img/skao/italy.png')

var korea =createImage('./img/skao/korea.png')
var spain =createImage('./img/skao/spain.png')
var taranta =createImage('./img/skao/taranta.png')
var japan=createImage('./img/skao/japan.png')
var quote=createImage('./img/skao/quote.png')
var germany =createImage('./img/skao/germany.png')
var sweden =createImage('./img/skao/sweden.png')
var netherlands =createImage('./img/skao/netherlands.png')
var swiss = createImage('./img/skao/swiss.png')



var signboard= createImage('./img/signboard.png')
var signboard1= createImage('./img/signboard2.png')

var ach=createImage('./img/signboard4.png')
var born=createImage('./img/skao/mid.png')
var school=createImage('./img/skao/low.png')

var linkedin=createImage('./img/linkedin.png')
var gmail=createImage('./img/gmail.png')
var github=createImage('./img/github.png')


// sprite running 
const spriteleft=createImage( './img/spriteMarioRunLeft.png')
const spriteright=createImage('./img/spriteMarioRunRight.png')
const spritestandleft=createImage('./img/spriteMarioStandLeft.png')
const spritestandright=createImage('./img/spriteMarioStandRight.png')

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

// setting canvas width and height 
canvas.width= innerWidth;
canvas.height= innerHeight;
// dom element for buttons and text area for subtitles 
var jumpp=document.getElementById("d-up");
var texxt=document.getElementById("textareaa");
texxt.style.color = "white";
var leftb=document.getElementById("left-btn");
var rightb=document.getElementById("right-btn");
jumpp.onmousedown=jump;
jumpp.ontouchstart=jump;

leftb.onmousedown=leftbu;
rightb.onmousedown=rightbu;

leftb.onmouseup=leftbu1;
rightb.onmouseup=rightbu1;

leftb.ontouchstart=leftbu;
rightb.ontouchstart=rightbu;

leftb.ontouchend=leftbu1;
rightb.ontouchend=rightbu1;
jumpp.onmouseup=jump1;
jumpp.ontouchend=jump1;
var musicbutton=false
// for random number for subtitles 
let xran = Math.floor((Math.random() * 6) );

//gravity calculation 
const gravity=0.5; 

// class of players
class Player{
    constructor (){
        this.speed=10
        this.position={
            x:100,
            y:0
        }
        this.velocity={
            x:0,
            y:1
        }
        this.scale = 0.27
        this.width = 370 * this.scale
        this.height = 353 * this.scale
        this.image=spritestandright
        this.frame=0
        this.sprites={
            stand:{
                right:spritestandright,
                left:spritestandleft,

                cropWidth:398,
                width: 398*0.25
            },
            run: {
                right: spriteright,
                left: spriteleft,
                cropWidth:398,
                width:398*0.25
            }

        }
        this.currentSprite=this.sprites.stand.right
        this.currentCropWidth=398

    }
    draw(){
        c.drawImage(
            this.currentSprite,
            this.currentCropWidth*this.frame,0,this.currentCropWidth,353,
            this.position.x,
            this.position.y,
            this.width,
            this.height)
           
        
    }
    update(){
        this.frame+=1
        if (this.frame>58 && (this.currentSprite == this.sprites.stand.right || this.currentSprite==this.sprites.stand.left)){
            this.frame=0;
        }
        else if (this.frame>28 &&( this.currentSprite==this.sprites.run.right || this.currentSprite==this.sprites.run.left)){
            this.frame=0;
        }
        this.draw()
        this.position.y+=this.velocity.y;
        this.position.x+=this.velocity.x;
        if(this.position.y+this.height+this.velocity.y<=canvas.height)
        {
            this.velocity.y+=gravity;
        }
        else{
            
        }
    }
}

// platform class
class Platform{
    constructor({x,y,image}){
        this.position={
            x,
            y
        }
        this.image=image
        this.width=image.width
        this.height=576
       
    }
    draw(){
        c.drawImage(this.image,this.position.x,this.position.y)
    }
}
//drow is text below clock 
function drow(str = "hello") {
    const maxWidth = 200; // Maximum width before wrapping
    let fontSize = 15; // Initial font size
    let words = str.split(" ");
    let lines = [];
    let line = "";
    
    // Increase font size dynamically
    const testFontSize = (size) => {
        c.font = `italic ${size}px serif`;
        return c.measureText(str).width < maxWidth;
    };

    while (testFontSize(fontSize) && fontSize < 40) { // Adjust max font size if needed
        fontSize++;
    }

    c.font = `italic ${fontSize}px serif`;

    // Wrapping text
    for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i] + " ";
        let testWidth = c.measureText(testLine).width;
        if (testWidth > maxWidth && i > 0) {
            lines.push(line);
            line = words[i] + " ";
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    c.fillStyle = "#275BE7";

    // Draw each line
    let x = 110, y = 230;
    for (let i = 0; i < lines.length; i++) {
        c.fillText(lines[i], x, y + i * (fontSize + 5)); // Adjust line spacing
    }
}


function drowmusic(img,x,y,w,h){
    c.drawImage(img,x,y,w,h)
}

// this class is for my routine clock 
class Clock{
    constructor(){
    
       
    }
     draw () {
        let time = (function () {
                let midnight = new Date();
                midnight.setHours(0);
                midnight.setMinutes(0);
                midnight.setSeconds(0);
                midnight.setMilliseconds(0);
                return Date.now() - midnight.getTime();
            })(),
            hours = time / (60 * 60 * 1000),
            minutes = hours * 60 % 60,
            seconds = minutes * 60 % 60,
            ct = {x: 110 , y: 110};
    
       
    
        c.lineCap = 'round';
    
        //secondHand();
        minuteHand();
        hourHand();
        face();
        
    
        function face () {
            // Border
            c.lineWidth = 5;
            c.strokeStyle = 'white';
            c.beginPath();
            c.arc(ct.x, ct.y, 100, 0, Math.PI * 2);
            c.stroke();
            
            
           
           
    
            // Dashes
            c.lineWidth = 3;
            for (let i = 0; i < 60; i++) {
                let r = 95, // radius of inner markings 
                    l = 5;
                c.strokeStyle = 'rgb(255, 255, 255)';
                if (i % 5 === 0)
                    r -= l,
                    l *= 2,
                    c.strokeStyle = 'rgb(255, 255, 255)';
                let v = new Vector(r, Math.PI * 2 * (i / 60) - Math.PI / 2);
                c.beginPath();
                c.moveTo(v.getX() + ct.x, v.getY() + ct.y);
                v.setMag(r + l);
                c.lineTo(v.getX() + ct.x, v.getY() + ct.y);
                c.stroke();
            }
    
            // Numbers
            c.font = '18px Noto Sans';
            c.fillStyle = 'white';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            for (let i = 1; i <= 12; i++) {
                // here 80 is the radius of number markings 
                let v = new Vector(80, Math.PI * 2 * (i / 12) - Math.PI / 2);
                // above 80 refer to the radius of the number of the clock 
                c.fillText(i, v.getX() + ct.x, v.getY() + ct.y);
            }
    
            // Center button
            c.beginPath();
            c.arc(ct.x, ct.y, 3.75, 0, Math.PI * 2);
            c.fillStyle = 'white';
            c.strokeStyle = 'white';
            c.lineWidth = 2.5;
            c.fill();
            c.stroke();
        }
    
        // function secondHand () {
        //     c.lineWidth = 1.5;
        //     c.strokeStyle = 'black';
        //     c.beginPath();
        //     let a = Math.PI * 2 * (seconds/60) - Math.PI / 2;
        //     // 
        //     let v = new Vector(80, a);
        //     let v2 = new Vector(-20, a);
        //     c.moveTo(v2.getX() + ct.x, v2.getY() + ct.y);
        //     c.lineTo(v.getX() + ct.x, v.getY() + ct.y);
        //     c.stroke();
        // }
    
        function minuteHand () {
            c.lineWidth = 4;
            c.strokeStyle = 'white';
            c.beginPath();
            let a = Math.PI *  (scrollOffset / 307) - Math.PI / 2;
            let v = new Vector(80, a);
            c.moveTo(ct.x, ct.y);
            c.lineTo(v.getX() + ct.x, v.getY() + ct.y);
            c.stroke();
        }
    
        function hourHand () {
            c.lineWidth = 4;
            c.strokeStyle = 'white';
            c.beginPath();
            let a = Math.PI *  (scrollOffset / 3681) - Math.PI / 2;
            let v = new Vector(60, a);
            c.moveTo(ct.x, ct.y);
            c.lineTo(v.getX() + ct.x, v.getY() + ct.y);
            c.stroke();
        }
    }
}



// Generic objects are meant for displaying the background in the game 
class GenericObject{
    constructor({x,y,image,height=1024,width=574}){
        this.position={
            x,
            y
        }
        this.image=image
        this.width=width
        this.height=height
       
    }
    draw(){
        c.drawImage(this.image,this.position.x,this.position.y)
    }
    
};
// gobject class is meant for displaying the environment objects like trees and boards area 
class GObject{
    constructor({x,y,image,height,width}){
        this.position={
            x,
            y
        }
        this.image=image
        this.width=width
        this.height=height
       
    }
    draww(){
        c.drawImage(this.image,this.position.x,this.position.y,this.width,this.height)
    }
    
};





let platformImage=platform
let aa1=platformImage.height

let player =new Player();
let clock= new Clock()
let tt1=platformImage.width

let platforms = [ ];
let backgroundImage=background;

let genericObject=[]



let gObject=[]
let currentKey



const keys= {
    right:{
        pressed: false 
    },
    left:{
        pressed: false
    }
}
//player.draw();
let scrollOffset=0
var loader=document.getElementById("preloader");
init()


/// this function activate only if the player fall or dies 
function init(){
xran = Math.floor((Math.random() * 6) );
 platformImage=platform
 aa1=platformImage.height

 player =new Player();
 tt1=platformImage.width
 platforms = [new Platform({x:tt1*0-1,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*1-5,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*2 -7 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*3 + 200,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*4+198 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*5+196 ,y:aa-aa1,image:platformImage}),
    // this is for third level

    new Platform({x:tt1*6+396 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*7+394 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*8+392 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*9+590 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*10+588 ,y:aa-aa1,image:platformImage}),


    new Platform({x:tt1*11+586 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*12+784 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*13+782 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*14+780 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*15+1006 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*16+1004 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*17+1002 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*17+1206 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*18+1456 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*19+1452 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*20+1448 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*21+1444 ,y:aa-aa1,image:platformImage}),

    // sports 

    new Platform({x:tt1*22+1656 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*23+1652 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*24+1648 ,y:aa-aa1,image:platformImage}),

    new Platform({x:tt1*25+1644 ,y:aa-aa1,image:platformImage}),



];

// this genericObjects are for putting background images in the console 
genericObject=[
    new GenericObject({
    x:0,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*2,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*3,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*4,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*5,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*6,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*7,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*7,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*8,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*9,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*10,
    y:aa-backgroundImage.height,
    image:background
}),
new GenericObject({
    x:backgroundImage.width*11,
    y:aa-backgroundImage.height,
    image:background
}),


]

// this code will put the game objects in its place 

gObject=[
    
     
       new GObject({
        x:tt1*9+2000 ,
        y:aa-300-aa1+5,
        image:india,
        width:300,
        height: 300
       }),
       new GObject({
        x:13500 +player.width ,
        y:aa-380-aa1+5,
        image:sweden,
        width:500,
        height: 400
       }),
       new GObject({
        x:7900 ,
        y:aa-350-aa1+5,
        image:netherlands,
        width:500,
        height: 350
       }),
       new GObject({
        x:8500 ,
        y:aa-370-aa1+5,
        image:france,
        width:400,
        height: 400
       }),
       new GObject({
        x:12950 +player.width,
        // x: 0 ,
        y:aa-320-aa1+5,
        image:swiss,
        width:400,
        height: 350
       }),
       new GObject({
        x:9100 ,
        y:aa-300-aa1+5,
        image:japan,
        width:400,
        height: 300
       }),
       
       new GObject({
        x:12100 ,
        y:aa-200-aa1+5,
        image:italy,
        width:300,
        height: 200
       }),
       new GObject({
        x:9800 ,
        y:aa-290-aa1+5,
        image:portugal,
        width:350,
        height: 300
       }),
       new GObject({
        x:10430 ,
        y:aa-415,
        image:spain,
        width:330,
        height: 270
       }),
       new GObject({
        x:11150 ,
        y:aa-300-aa1+5,
        image:korea,
        width:300,
        height: 300
       }),
       new GObject({
        x:12460 +player.width ,
        y:aa-204-aa1+5,
        image:germany,
        width:300,
        height: 200
       }),
       
       
       
    //    new GObject({
    //     x:12130 ,
    //     y:aa-250-aa1+5,
    //     image:book,
    //     width:200,
    //     height: 250
    //    }),
       new GObject({
        x:15100 +player.width,
        y:aa-100-aa1+5,
        image:linkedin,
        width:100,
        height: 100
       }),
       new GObject({
        x:15220 +player.width,
        y:aa-100-aa1+5,
        image:gmail,
        width:100,
        height: 100
       }),
       new GObject({
        x:15340 +player.width,
        y:aa-100-aa1+5,
        image:github,
        width:100,
        height: 100
       }),
       
       
    //    new GObject({
    //     x:12360 +player.width,
    //     y:aa-200-aa1+5,
    //     image:chess1,
    //     width:200,
    //     height: 200
    //    }),
       //sports
    //    new GObject({
    //     x:14300 +player.width,
    //     y:aa-200-aa1+5,
    //     image:signcontactme,
    //     width:300,
    //     height: 200
    //    }),
    //    new GObject({
    //     x:15100 +player.width,
    //     y:aa-350-aa1+5,
    //     image:quote,
    //     width:500,
    //     height: 350
    //    }),
    //    new GObject({
    //     x:13300 +player.width,
    //     y:aa-350-aa1+5,
    //     image:pistol,
    //     width:500,
    //     height: 350
    //    }),
    //    new GObject({
    //     x:13800 +player.width,
    //     y:aa-200-aa1+5,
    //     image:tennis,
    //     width:250,
    //     height: 200
    //    }),
       
       
]

//player.draw();
scrollOffset=0

if(true){
    window.addEventListener("load",function(){
        loader.style.display="none";
        init()
           
       })
    }
 
}

function inner (tr){
    var changer=Math.floor(scrollOffset/1000);
    if (tr){
       
    texxt.innerHTML=aboutme[changer]
    
    // console.log(aboutme[changer])
    }
    else{
        texxt.innerHTML=aboutme[changer]
    }
}


// this function will run multiple continuously 
function animate (){
    requestAnimationFrame(animate);
    inner(tr);
    
    c.fillStyle="#87CEEB"
    c.fillRect(0,0,canvas.width,canvas.height);
    genericObject.forEach((genericObject)=>{
       genericObject.draw()
    })
    gObject.forEach((gObject)=>{
        gObject.draww()
    })
    platforms.forEach(platform=>{
        platform.draw()
    })
    player.update()
   
    clock.draw()
    drow(activity[Math.floor(scrollOffset/613)])
    drowmusic(music,230,75,125,45);
    
    // move right motion 
    if ((keys.right.pressed && player.position.x<400) ||
    keys.right.pressed && scrollOffset <=14725 && player.position.x<400 ){
        player.velocity.x= player.speed;
    }
    else if ( (keys.left.pressed && player.position.x>100) ||
    keys.left.pressed && scrollOffset ==0 && player.position.x>0
    ){
        player.velocity.x=- player.speed;
    }
    else {
        player.velocity.x = 0;
        if(keys.right.pressed &&  scrollOffset<14725){
            scrollOffset+=player.speed;
            platforms.forEach(platform=>{
                
                platform.position.x-=player.speed
            })
            genericObject.forEach((genericObject)=>{
                    genericObject.position.x-=player.speed * 0.66;
            })
            gObject.forEach((gObject)=>{
                gObject.position.x-=player.speed *1; 
            })
           
        }
        else if (keys.left.pressed && scrollOffset>0 ){
            scrollOffset-=player.speed
            platforms.forEach(platform=>{
                
                platform.position.x+=player.speed;
            });
            genericObject.forEach((genericObject)=>{
                genericObject.position.x+=player.speed * 0.66;
            });
            gObject.forEach((gObject)=>{
                gObject.position.x+=player.speed *1; 
            });
           
        }
    }
    


    // platform collision detection 
    platforms.forEach(platform=>{
    if (player.position.y+player.height<=
        platform.position.y && 
        player.position.y+player.height+
        player.velocity.y>=platform.position.y
        && player.position.x+player.width>= 
        platform.position.x
        && player.position.x<=platform.position.x+
        platform.width){
            player.velocity.y=0

    }
})

// sprite switching condition 



if ( keys.right.pressed && 
    currentKey=='right'&& player.currentSprite !=player.sprites.run.right){
    player.frame=1
    player.currentSprite=player.sprites.run.right
    player.currentCropWidth=player.sprites.run.cropWidth
    player.width =player.sprites.run.width
}
else if (
    keys.left.pressed && 
    currentKey=='left' && player.currentSprite!=player.sprites.run.left){

    player.currentSprite=player.sprites.run.left
    player.currentCropWidth=player.sprites.run.cropWidth
    player.width =player.sprites.run.width
}
else if (
    !keys.left.pressed && 
    currentKey=='left' && player.currentSprite!=player.sprites.stand.left){

    player.currentSprite=player.sprites.stand.left
    player.currentCropWidth=player.sprites.stand.cropWidth
    player.width =player.sprites.stand.width
}
// else if (
//     !keys.left.pressed && 
//     currentKey=='right' && player.currentSprite!=player.sprites.stand.right){

//     player.currentSprite=player.sprites.stand.
//     player.currentCropWidth=player.sprites.stand.cropWidth
//     player.width =player.sprites.stand.width
// }




// win condition
if (scrollOffset>14700 && downl){
    keys.right.pressed=false
    player.velocity.x = 0;
    dow.download="thanks.pdf";
    keys.right.pressed=false
    player.velocity.x = 0;
    dow.dispatchEvent(new MouseEvent('click'))
    downl=false
    player.velocity.x = 0;
}

// loose condition 

if (player.position.y>canvas.height){
    alert(joke[xran])
    keys.right.pressed=false
    keys.left.pressed=false
    player.velocity.y=0
    init();
 }
 

 


 // end of update function 
}

animate();
///// event manager for web application 
addEventListener('keydown',({keyCode})=>{
    switch(keyCode){
        case (65):
            keys.left.pressed=true;
            currentKey='left'
            break; 
        case (87):
            if(player.velocity.y==0){           
            player.velocity.y-=10;
            myAudio1.play()
            }
            break;
        case (83):
            break;
        case (68):
            keys.right.pressed=true;
            currentKey='right'
            break;
        case (38):
            if(player.velocity.y==0){           
                player.velocity.y-=10;
                myAudio1.play()
                }
            break;
        case (40):
            break;
        case (39):
            keys.right.pressed=true;
            currentKey='right'
            break;
        case (37):
            keys.left.pressed=true;
            currentKey='left'
            break;
    }
})
addEventListener('keyup',({keyCode})=>{
    switch(keyCode){
        case (65):
            keys.left.pressed=false;
            player.currentSprite=player.sprites.stand.left
            player.currentCropWidth=player.sprites.stand.cropWidth
            player.width =player.sprites.stand.width
            break; 
        case (87):
            player.velocity.y-=3;
            break;
        case (83):
            break;
        case (68):
            keys.right.pressed=false;
            player.currentSprite=player.sprites.stand.right
            player.currentCropWidth=player.sprites.stand.cropWidth
            player.width =player.sprites.stand.width
            break;
        case (38):
            player.velocity.y-=3;
            break;
        case (40):
            break;
        case (39):
            keys.right.pressed=false;
            player.currentSprite=player.sprites.stand.right
            player.currentCropWidth=player.sprites.stand.cropWidth
            player.width =player.sprites.stand.width
            break;
        case (37):
            keys.left.pressed=false;
            player.currentSprite=player.sprites.stand.left
            player.currentCropWidth=player.sprites.stand.cropWidth
            player.width =player.sprites.stand.width
            break;
    }
})

function jump(){
//     player.velocity.y-=10;
//     myAudio1.play()
    if(player.velocity.y==0){           
            player.velocity.y-=10;
            myAudio1.play()
            }
            //console.log(scrollOffset)

}

function jump1(){
    player.velocity.y+=0;
}
function leftbu(){
    
    keys.left.pressed=true;
    
    currentKey='left'
    
}
function leftbu1(){
    keys.left.pressed=false;
    player.currentSprite=player.sprites.stand.left
    player.currentCropWidth=player.sprites.stand.cropWidth
    player.width =player.sprites.stand.width
}
function rightbu(){
    keys.right.pressed=true;
   
    currentKey='right'
   
}
function rightbu1(){
    keys.right.pressed=false;
    player.currentSprite=player.sprites.stand.right
    player.currentCropWidth=player.sprites.stand.cropWidth
    player.width =player.sprites.stand.width
}

/// this is for making the gameobjects clickable 
  canvas.addEventListener('click',(e)=>{
    const pos={
        x: e.clientX,
        y:e.clientY
    };
    
    if (scrollOffset+pos.x > 15100+player.width &&
        (scrollOffset+pos.x < 15200+player.width ) &&
        ((pos.y>aa-100-aa1+5)&&(pos.y<aa-aa1+5))
        )
        {
            window.open('https://www.linkedin.com/in/rootjatin','_blank')
        }

     else if (scrollOffset+pos.x > 15220+player.width &&
            (scrollOffset+pos.x < 15320+player.width ) &&
            ((pos.y>aa-100-aa1+5)&&(pos.y<aa-aa1+5))
            ){
            window.open('mailto:rootjatin@gmail.com');
        }else if (scrollOffset+pos.x > 15340+player.width &&
            (scrollOffset+pos.x < 15440+player.width ) &&
            ((pos.y>aa-100-aa1+5)&&(pos.y<aa-aa1+5))
            ){
            window.open('https://www.github.com/rootjatin',"_bland");
        }
            
    else if ((pos.x>230)&& (pos.x<350)&& 
    (pos.y>75)&& pos.y<120){
       musicbutton=!musicbutton
       if (musicbutton){
        myAudio.play();
        myAudio.volume=0.1
        myAudio.loop=true;
        }
        else{
            myAudio.pause();
            myAudio.currentTime = 0;
        }

    }
  });
