import { baseURL } from './baseURL.js';

let form = document.querySelector("form");
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Get form values
    const emailOrMobile = document.getElementById("exampleFormControlInput1").value;
    const password = document.getElementById("exampleFormControlInput2").value;
    
    // Validate input
    if (!emailOrMobile || !password) {
        swal("Error", "Please fill in all fields", "error");
        return;
    }
    
    // Prepare request object for unified auth
    const loginData = {
        email: emailOrMobile, // The unified auth accepts email (can handle mobile in future)
        password: password
    };
    
    try {
        console.log("🔄 Attempting unified login...");
        
        // Use unified authentication endpoint
        let res = await fetch(baseURL + "/auth/login", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        let data = await res.json();
        console.log("Login response:", data);
        
        if (data.success) {
            // Store authentication data
            localStorage.setItem("token", data.token);
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("userType", data.userType);
            
            // Store user information based on type
            if (data.userType === 'patient') {
                localStorage.setItem("userName", data.user.firstName);
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("userEmail", data.user.email);
                sessionStorage.setItem("userId", data.user.id);
                sessionStorage.setItem("userEmail", data.user.email);
                // --- Fix: Save full patient info and token for dashboard compatibility ---
                localStorage.setItem("patientInfo", JSON.stringify(data.user));
                localStorage.setItem("patientToken", data.token);
                // --- End fix ---
                swal("", `Welcome back, ${data.user.firstName}!`, "success").then(function() {
                    window.location.href = "./book.appointment.html";
                });
                
            } else if (data.userType === 'doctor') {
                // Store doctor data in a way compatible with existing doctor pages
                localStorage.setItem("userName", data.user.name);
                localStorage.setItem("doctorId", data.user.id);
                localStorage.setItem("userEmail", data.user.email);
                localStorage.setItem("doctorToken", data.token);
                localStorage.setItem("doctorInfo", JSON.stringify(data.user));
                
                sessionStorage.setItem("doctorId", data.user.id);
                sessionStorage.setItem("userEmail", data.user.email);
                sessionStorage.setItem("doctorToken", data.token);
                sessionStorage.setItem("doctorInfo", JSON.stringify(data.user));
                
                swal("", `Welcome, Dr. ${data.user.name}!`, "success").then(function() {
                    window.location.href = "./doctor-dashboard.html";
                });
                
            } else if (data.userType === 'admin') {
                localStorage.setItem("userName", data.user.name);
                localStorage.setItem("adminId", data.user.id);
                localStorage.setItem("userEmail", data.user.email);
                sessionStorage.setItem("adminId", data.user.id);
                sessionStorage.setItem("userEmail", data.user.email);
                
                swal("", `Welcome, ${data.user.name}!`, "success").then(function() {
                    window.location.href = "./dashboard.html";
                });
            }
            
        } else {
            // Handle login failure
            const errorMessage = data.message || "Login failed. Please try again.";
            swal("Login Failed", errorMessage, "error");
        }
        
    } catch (error) {
        console.error("Login error:", error);
        swal("Error", "Login failed. Please check your connection and try again.", "error");
    }
});
