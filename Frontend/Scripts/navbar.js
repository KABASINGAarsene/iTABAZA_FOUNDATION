document.querySelector("#navbar").innerHTML = `
<div id="nav-cont">
    <div id="hamb">
        <i class="fa-solid fa-bars"></i>
    </div>
    <div data-aos="zoom-out" data-aos-duration="1000" id="nav-logo">
        <div id="nav-img">
            <img alt="Logo" src="./Files/MEDSTAR-no-bg.png"/>
        </div>
    </div>
    <div data-aos="zoom-out" data-aos-duration="1000" id="nav-menu">
        <li id="home-link">Home</li>
        <li id="find-doc">Find Doctors</li>
        <li id="appointment-link">Appointment</li>
        <li id="security-link">Security & Help</li>
        <li id="ctt">Chat</li>

    </div>
    <div data-aos="zoom-out" data-aos-duration="1000" id="nav-user-details">
        <button id="nav-login">Login</button>
        <button id="nav-reg">Signup</button>
    </div>
</div>
`

{/* <h5 style="color:#0b76c6">Welcome Faraz<span></span></h5> */}

const logoBtn=document.getElementById("nav-logo");
const homeLink=document.getElementById("home-link");
const appointmentLink=document.getElementById("appointment-link");
const find_doc=document.getElementById("find-doc");
const securityLink=document.getElementById("security-link");
const ctt=document.getElementById("ctt");

let loginbtn=document.getElementById("nav-login");
let signupbtn=document.getElementById("nav-reg");

if(localStorage.getItem("token")){
    loginbtn.innerText=localStorage.getItem("userName");
    signupbtn.innerText="Log Out";
}else{
    loginbtn.innerText="Login";
    signupbtn.innerText="Signup";
}

loginbtn.addEventListener("click",(e)=>{
    if(e.target.innerText=="Login"){
        window.location.href="./login.html";
    }
})

signupbtn.addEventListener("click",(e)=>{
    if(e.target.innerText=="Signup"){
        window.location.href="./signup.html";
    }else{
        localStorage.clear();
        sessionStorage.clear();
        window.location.href="./index.html";
    }
})

logoBtn.addEventListener("click",(e)=>{
    window.location.href="./index.html";
})

homeLink.addEventListener("click",()=>{
    window.location.href="./index.html";
})

appointmentLink.addEventListener("click",()=>{
    window.location.href="./book.appointment.html";
})

find_doc.addEventListener("click",()=>{
    window.location.href="./doctors.page.html";
})

securityLink.addEventListener("click",()=>{
    window.location.href="./security.html";
})

ctt.addEventListener("click",()=>{
    window.location.href="../chatroom/public/index.html";
})

const hamburger=document.getElementById("hamb");
const navbar_menu=document.getElementById("nav-menu");

hamburger.addEventListener("click", (e)=>{
    if(navbar_menu.style.display=="none"){
        navbar_menu.style.display="block";
    }else{
        navbar_menu.style.display="none";
    }
})



