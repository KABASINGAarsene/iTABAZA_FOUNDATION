document.querySelector("#navbar").innerHTML = `
<div id="nav-cont">
    <div id="hamb">
        <i class="fa-solid fa-bars"></i>
    </div>
    <div data-aos="zoom-out" data-aos-duration="1000" id="nav-logo">
        <div id="nav-img">
                        <img alt="Logo" src="./Files/iTABAZA-logo.png"/>
        </div>
    </div>
    <div data-aos="zoom-out" data-aos-duration="1000" id="nav-menu">
        <li id="home-link">Home</li>
        <li id="find-doc">Find Doctors</li>
        <li id="appointment-link">Appointment</li>
        <li id="security-link">Security & Help</li>
    </div>
    <div data-aos="zoom-out" data-aos-duration="1000" id="nav-user-details">
        <button id="nav-login">Login</button>
        <button id="nav-reg">Signup</button>
        <div id="profile-container" style="display: none;">
            <div id="profile-icon">
                <img id="profile-image" src="" alt="Profile" style="display: none;">
                <span id="profile-initials"></span>
            </div>
            <div id="profile-dropdown" class="dropdown-content">
                <div class="dropdown-item" id="dashboard-link">
                    <i class="fa-solid fa-chart-line"></i>
                    <span>Dashboard</span>
                </div>
                <div class="dropdown-item" id="profile-link">
                    <i class="fa-solid fa-user"></i>
                    <span>Profile</span>
                </div>
                <div class="dropdown-item" id="settings-link">
                    <i class="fa-solid fa-gear"></i>
                    <span>Settings</span>
                </div>
                <div class="dropdown-item" id="logout-link">
                    <i class="fa-solid fa-sign-out-alt"></i>
                    <span>Logout</span>
                </div>
            </div>
        </div>
    </div>
</div>
`

{/* <h5 style="color:#0b76c6">Welcome Faraz<span></span></h5> */}

const logoBtn=document.getElementById("nav-logo");
const homeLink=document.getElementById("home-link");
const appointmentLink=document.getElementById("appointment-link");
const find_doc=document.getElementById("find-doc");
const securityLink=document.getElementById("security-link");

let loginbtn=document.getElementById("nav-login");
let signupbtn=document.getElementById("nav-reg");
let profileContainer=document.getElementById("profile-container");
let profileIcon=document.getElementById("profile-icon");
let profileImage=document.getElementById("profile-image");
let profileInitials=document.getElementById("profile-initials");

// Check if any user type is logged in
const isAnyUserLoggedIn = isUserLoggedIn();

if(isAnyUserLoggedIn){
    // Hide login/signup buttons and show profile dropdown
    loginbtn.style.display = "none";
    signupbtn.style.display = "none";
    profileContainer.style.display = "flex";
    
    // Get user name and setup profile based on user type
    const userName = getUserName();
    const userProfileImage = localStorage.getItem("userProfileImage");
    
    if(userProfileImage && userProfileImage !== "null"){
        profileImage.src = userProfileImage;
        profileImage.style.display = "block";
        profileInitials.style.display = "none";
    } else {
        // Show initials if no profile image
        const initials = userName ? userName.charAt(0).toUpperCase() : "U";
        profileInitials.textContent = initials;
        profileInitials.style.display = "flex";
        profileImage.style.display = "none";
    }
}else{
    // Show login/signup buttons and hide profile dropdown
    loginbtn.style.display = "block";
    signupbtn.style.display = "block";
    profileContainer.style.display = "none";
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

const hamburger=document.getElementById("hamb");
const navbar_menu=document.getElementById("nav-menu");

hamburger.addEventListener("click", (e)=>{
    if(navbar_menu.style.display=="none"){
        navbar_menu.style.display="block";
    }else{
        navbar_menu.style.display="none";
    }
})

// Profile dropdown event listeners
if(isUserLoggedIn()){
    const dashboardLink = document.getElementById("dashboard-link");
    const profileLink = document.getElementById("profile-link");
    const settingsLink = document.getElementById("settings-link");
    const logoutLink = document.getElementById("logout-link");
    
    if(dashboardLink) {
        dashboardLink.addEventListener("click", () => {
            // Route to appropriate dashboard based on user role
            const userRole = getUserRole();
            let dashboardUrl;
            
            switch(userRole) {
                case 'admin':
                    dashboardUrl = './dashboard.html'; // Admin dashboard
                    break;
                case 'doctor':
                    dashboardUrl = './doctor-dashboard.html'; // Doctor dashboard
                    break;
                case 'patient':
                default:
                    dashboardUrl = './client-dashboard.html'; // Client dashboard
                    break;
            }
            
            window.location.href = dashboardUrl;
        });
    }
    
    if(profileLink) {
        profileLink.addEventListener("click", () => {
            window.location.href = "./profile.html";
        });
    }
    
    if(settingsLink) {
        settingsLink.addEventListener("click", () => {
            window.location.href = "./settings.html";
        });
    }
    
    if(logoutLink) {
        logoutLink.addEventListener("click", () => {
            // Confirm logout
            if (confirm('Are you sure you want to logout?')) {
                performCompleteLogout();
            }
        });
    }
    
    // Add click event to profile icon for mobile devices
    if(profileIcon) {
        profileIcon.addEventListener("click", function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById("profile-dropdown");
            if(dropdown) {
                dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
            }
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener("click", function(e) {
        const dropdown = document.getElementById("profile-dropdown");
        const profileContainer = document.getElementById("profile-container");
        if(dropdown && profileContainer && !profileContainer.contains(e.target)) {
            dropdown.style.display = "none";
        }
    });
}

// Function to check if any user type is logged in
function isUserLoggedIn() {
    return localStorage.getItem("token") || 
           localStorage.getItem("admin") === "admin" || 
           (localStorage.getItem("doctorToken") && localStorage.getItem("doctorInfo"));
}

// Function to get user name based on user type
function getUserName() {
    const userRole = getUserRole();
    
    switch(userRole) {
        case 'admin':
            return 'Admin';
        case 'doctor':
            const doctorInfo = localStorage.getItem("doctorInfo");
            if (doctorInfo) {
                try {
                    const doctor = JSON.parse(doctorInfo);
                    return doctor.name || doctor.doctor_name || 'Doctor';
                } catch (e) {
                    return 'Doctor';
                }
            }
            return 'Doctor';
        case 'patient':
        default:
            return localStorage.getItem("userName") || 'User';
    }
}

// Function to determine user role based on localStorage
function getUserRole() {
    // Check if user is admin
    if (localStorage.getItem("admin") === "admin") {
        return 'admin';
    }
    
    // Check if user is doctor
    if (localStorage.getItem("doctorToken") && localStorage.getItem("doctorInfo")) {
        return 'doctor';
    }
    
    // Check if user is regular patient/client
    if (localStorage.getItem("token")) {
        return 'patient';
    }
    
    // Default fallback
    return 'patient';
}

// Function to update profile image
function updateProfileImage(imageUrl) {
    localStorage.setItem("userProfileImage", imageUrl);
    const profileImage = document.getElementById("profile-image");
    const profileInitials = document.getElementById("profile-initials");
    
    if(imageUrl && imageUrl !== "null") {
        profileImage.src = imageUrl;
        profileImage.style.display = "block";
        profileInitials.style.display = "none";
    } else {
        profileImage.style.display = "none";
        profileInitials.style.display = "block";
    }
}

// Complete logout function that clears all possible session data
function performCompleteLogout() {
    try {
        // Get user role before clearing to determine redirect
        const userRole = getUserRole();
        
        // Clear all possible authentication and session data
        const keysToRemove = [
            // Doctor-specific keys
            'doctorToken',
            'doctorInfo', 
            'doctorId',
            'doctorSessionId',
            
            // General user keys
            'token',
            'userToken',
            'authToken', 
            'accessToken',
            'userInfo',
            'userData',
            'userName',
            'userEmail',
            'userId',
            'sessionToken',
            'refreshToken',
            
            // Admin keys
            'admin',
            'adminToken',
            'adminInfo',
            
            // Patient keys  
            'patientToken',
            'patientInfo',
            'patientId',
            
            // Profile and UI state
            'userProfileImage',
            'profileImage',
            'isLoggedIn',
            'loginTime',
            'userRole',
            'userType',
            
            // Any other potential session keys that might exist
            'sessionId',
            'authState',
            'loginStatus',
            'currentUser'
        ];
        
        // Clear from localStorage
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Clear from sessionStorage  
        keysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
        });
        
        // Make logout API call to server if available
        try {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            }).catch(e => {
                console.log('Logout API call failed (this is normal if not implemented):', e);
            });
        } catch (e) {
            console.log('Could not make logout API call:', e);
        }
        
        // Force clear any remaining authentication cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear any IndexedDB or WebSQL data if used by the app
        try {
            if (window.indexedDB) {
                // This would need to be customized based on your app's specific IndexedDB usage
                console.log('IndexedDB detected - manual cleanup may be needed');
            }
        } catch (e) {
            console.log('Error checking IndexedDB:', e);
        }
        
        // Update UI immediately to show logged out state
        const loginBtn = document.getElementById("nav-login");
        const signupBtn = document.getElementById("nav-reg"); 
        const profileContainer = document.getElementById("profile-container");
        
        if (loginBtn && signupBtn && profileContainer) {
            loginBtn.style.display = "block";
            signupBtn.style.display = "block";
            profileContainer.style.display = "none";
        }
        
        // Show success message
        console.log('Logout successful - all session data cleared');
        
        // Determine redirect URL based on user role
        let redirectUrl;
        switch(userRole) {
            case 'admin':
            case 'doctor':
            case 'patient':
                redirectUrl = './login.html';
                break;
            default:
                redirectUrl = './index.html';
                break;
        }
        
        // Force redirect with cache busting to ensure fresh page load
        window.location.replace(redirectUrl + '?t=' + Date.now());
        
    } catch (error) {
        console.error('Error during logout process:', error);
        // Even if there's an error, still try to redirect to safety
        window.location.replace('./index.html');
    }
}



