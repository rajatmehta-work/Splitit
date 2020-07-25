const left_main=document.querySelector("#main_left");
const right_main=document.querySelector("#main_right");
const parent=document.querySelector("#parent_left_right");
parent.addEventListener("load",doOnLoad());
var texts;
var timer=0;
var green=false;
var image;
function doOnLoad(){
    timer=0;
    image=new Array();
    let base="/img/annimation";
    texts=new Array();
    texts[0]="on trips";
    texts[1]="with roommated";
    texts[2]="with anyone";
    for(var i=0;i<3;i++){
        image[i]=new Image();
        image[i].src="img/image"+(i+1)+".jpg";
    }
    stopit();
}
function stopit(){
    if(green){
        document.querySelector("#main_left_style").style.color="black";
        left_main.style.color="#00FF00";
        green=false;
    }
    else{
        document.querySelector("#main_left_style").style.color="#00FF00";
        left_main.style.color="black";
        green=true;
    }
    
    left_main.innerHTML=texts[timer++];
    right_main.innerHTML=""
    timer%=texts.length;
    setTimeout(stopit,2000);
}
