import { baseURL } from './baseURL.js';

let form = document.querySelector("form");
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Get form values
    const first_name = document.getElementById("exampleFormControlInput1").value;
    const last_name = document.getElementById("exampleFormControlInput2").value;
    const email = document.getElementById("exampleFormControlInput3").value;
    const mobile = document.getElementById("exampleFormControlInput4").value;
    const password = document.getElementById("exampleFormControlInput5").value;
    
    // Validate required fields
    if (!first_name || !last_name || !email || !mobile || !password) {
        swal("Error", "All fields are required", "error");
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        swal("Error", "Please enter a valid email address", "error");
        return;
    }
    
    // Validate mobile number format
    const mobileRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!mobileRegex.test(mobile)) {
        swal("Error", "Please enter a valid mobile number", "error");
        return;
    }
    
    // Validate password strength
    if (password.length < 6) {
        swal("Error", "Password must be at least 6 characters long", "error");
        return;
    }
    
    const userData = {
        first_name,
        last_name,
        email,
        mobile,
        password
    };
    
    try {
        const response = await fetch(baseURL + "/user/signup-direct", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store user data and token
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("authToken", data.token);
            }
            
            if (data && data.user && data.user.id) {
                localStorage.setItem("userId", data.user.id);
                sessionStorage.setItem("userId", data.user.id);
            }
            
            if (data.user) {
                localStorage.setItem("userName", data.user.first_name);
                localStorage.setItem("userEmail", data.user.email);
                sessionStorage.setItem("userEmail", data.user.email);
            }
            
            swal("Success", "Registration successful! You are now logged in.", "success").then(() => {
                window.location.href = "./book.appointment.html";
            });
        } else {
            swal("Error", data.msg || "Registration failed. Please try again.", "error");
        }
    } catch (error) {
        console.error("Registration error:", error);
        swal("Error", "Failed to register. Please check your connection and try again.", "error");
    }
});
