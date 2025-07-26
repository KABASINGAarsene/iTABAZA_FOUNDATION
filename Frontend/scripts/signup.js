import { baseURL } from './baseURL.js';
let form =document.querySelector("form");
    form.addEventListener("submit",async (e)=>{
        e.preventDefault();
        let obj={
            first_name:document.getElementById("exampleFormControlInput1").value,
            last_name:document.getElementById("exampleFormControlInput2").value,
            email:document.getElementById("exampleFormControlInput3").value,
            mobile:document.getElementById("exampleFormControlInput4").value,
            password:document.getElementById("exampleFormControlInput5").value,
        }
      try {

        let res=await fetch(baseURL+"/user/emailVerify",{
            method:"POST",
            headers:{
                'Content-type':'application/json'
            },
            body:JSON.stringify(obj)
        })
        let data=await res.json();
       // console.log(data.otp);
        
        localStorage.setItem("userDetails",JSON.stringify(obj));
        localStorage.setItem("otp",data.otp);
        swal("", "OTP has been sent to your mail", "info").then(function() {
          window.location.href="./otp.html";
      });
       // alert("Successfully registered");
      } catch (error) {
        console.log(error);
        swal("Error", "Failed to send OTP. Please try again.", "error");
      }
    })