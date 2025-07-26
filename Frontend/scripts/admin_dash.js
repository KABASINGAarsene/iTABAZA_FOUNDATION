import { baseURL } from "./baseURL.js";

// Updated department object with UUIDs from Supabase
let depObj={
    "dfae69ef-60b3-49eb-8d9c-76e682e1ebd3":"Neurology",
    "b5109521-a436-4f24-a967-7aba792956c0":"Dermatology",
    "23254e48-e74e-4e31-bdbd-c260a6d30759":"Orthopedics",
    "c59266ae-008b-4604-9cc9-5e5f405d8f2e":"Cardiology",
    "eab9e737-0f5c-4549-a9ce-93fa99414d59":"Pediatrics"
}

// Function to get department name by ID
function getDepartmentName(departmentId) {
    return depObj[departmentId] || 'Unknown Department';
}

// Admin authentication check
// TODO: Re-enable this when admin auth is needed
/*
if(!localStorage.getItem("token") || !localStorage.getItem("userType") || localStorage.getItem("userType") !== 'admin'){
    swal("", "Please Login as Admin!", "warning").then(function() {
        window.location.href="./login.html";
    });
}
*/
console.log("Admin dashboard script loaded");

//Theme Toggler
let sidemenu=document.querySelector("aside");
let themetoggler=document.querySelector(".theme-toggler")

themetoggler.addEventListener("click",()=>{
    document.body.classList.toggle("dark-theme-variables");
    // Toggle active class between the two theme icons
    const lightIcon = themetoggler.querySelector(".theme-icon:first-child");
    const darkIcon = themetoggler.querySelector(".theme-icon:last-child");
    
    if (lightIcon.classList.contains("active")) {
        lightIcon.classList.remove("active");
        darkIcon.classList.add("active");
    } else {
        darkIcon.classList.remove("active");
        lightIcon.classList.add("active");
    }
});

//On click section activate
let dash_btn=document.getElementById("menu-dash");
let doc_btn=document.getElementById("menu-doc");
let patient_btn=document.getElementById("menu-patient");
let app_btn=document.getElementById("menu-app");

let dash_cont=document.getElementById("dash-cont");
let doc_cont=document.getElementById("doc-cont");
let patient_cont=document.getElementById("patient-cont");
let app_cont=document.getElementById("app-cont");

dash_btn.addEventListener("click",()=>{
    dash_btn.classList.add("active");
    doc_btn.classList.remove("active");
    patient_btn.classList.remove("active");
    app_btn.classList.remove("active");
    dash_cont.classList.remove("div-hide");
    doc_cont.classList.add("div-hide");
    patient_cont.classList.add("div-hide");
    app_cont.classList.add("div-hide");
});

doc_btn.addEventListener("click",()=>{
    doc_btn.classList.add("active");
    dash_btn.classList.remove("active");
    patient_btn.classList.remove("active");
    app_btn.classList.remove("active");
    doc_cont.classList.remove("div-hide");
    dash_cont.classList.add("div-hide");
    patient_cont.classList.add("div-hide");
    app_cont.classList.add("div-hide");
});

patient_btn.addEventListener("click",()=>{
    patient_btn.classList.add("active");
    dash_btn.classList.remove("active");
    doc_btn.classList.remove("active");
    app_btn.classList.remove("active");
    patient_cont.classList.remove("div-hide");
    dash_cont.classList.add("div-hide");
    doc_cont.classList.add("div-hide");
    app_cont.classList.add("div-hide");
});

app_btn.addEventListener("click",()=>{
    app_btn.classList.add("active");
    dash_btn.classList.remove("active");
    doc_btn.classList.remove("active");
    patient_btn.classList.remove("active");
    app_cont.classList.remove("div-hide");
    dash_cont.classList.add("div-hide");
    doc_cont.classList.add("div-hide");
    patient_cont.classList.add("div-hide");
});


//Dashboard Functions 

getStatus();
recentDocs();
recentPatients();
recentApps();
loadDepartments(); // Load departments dynamically

// Load departments from API
async function loadDepartments() {
    try {
        let res = await fetch(baseURL + "/department/all");
        if (res.ok) {
            let data = await res.json();
            console.log("Department data:", data);
            // Update the department object with actual UUIDs
            depObj = {};
            data.departments.forEach(dept => {
                depObj[dept.id] = dept.dept_name;
            });
            console.log("Updated department object:", depObj);
            
            // Update department dropdowns
            updateDepartmentDropdowns();
        }
    } catch (err) {
        console.log("Error loading departments:", err);
    }
}

// Update department dropdowns with correct UUIDs
function updateDepartmentDropdowns() {
    const dropdowns = document.querySelectorAll('select[name="dept"]');
    console.log("Found department dropdowns:", dropdowns.length);
    dropdowns.forEach((dropdown, index) => {
        console.log(`Updating dropdown ${index}:`, dropdown);
        dropdown.innerHTML = '<option value="">Select Department</option>';
        Object.entries(depObj).forEach(([id, name]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            dropdown.appendChild(option);
        });
        console.log(`Dropdown ${index} updated with options:`, dropdown.innerHTML);
    });
}

async function getStatus(){
    console.log("getStatus() called - fetching from:", baseURL + "/admin/all");
    try{
        let res=await fetch(baseURL+"/admin/all");
        console.log("getStatus response status:", res.status);
        if(res.ok){
            let data=await res.json();
            console.log("getStatus data received:", data);
            document.getElementById("total-doc").innerText=data.docApproved?.length || 0;
            document.getElementById("doc-approvals").innerText=data.docPending?.length || 0;
            document.getElementById("total-pat").innerText=data.usersRegistered?.length || 0;
            document.getElementById("total-app").innerText=data.totalAppointments || 0;
            document.getElementById("app-approvals").innerText=data.totalPendingAppointments || 0;
            console.log("Status numbers updated successfully");
        } else {
            console.error("getStatus failed with status:", res.status);
            const errorText = await res.text();
            console.error("Error response:", errorText);
        }
    }catch(err){
        console.error("getStatus error:", err);
        // Show user-friendly error message
        document.getElementById("total-doc").innerText = "Error";
        document.getElementById("doc-approvals").innerText = "Error";
        document.getElementById("total-pat").innerText = "Error";
        document.getElementById("total-app").innerText = "Error";
        document.getElementById("app-approvals").innerText = "Error";
    }
}

async function recentDocs(){
    try{
        let res=await fetch(baseURL+"/doctor/allDoctor");
        if(res.ok){
            let data=await res.json();
            console.log("Doctor data:", data);
            let arr=data.doctor || [];
            console.log("Doctor array:", arr);
            renderDocsData(arr);
            // Get last 3 doctors, handle cases with fewer than 3
            let lastThree = arr.slice(-3);
            console.log("Last three doctors:", lastThree);
            // Only pass defined elements
            let elem1 = lastThree[0] || null;
            let elem2 = lastThree[1] || null;
            let elem3 = lastThree[2] || null;
            console.log("Elements to render:", {elem1, elem2, elem3});
            renderRecentDocs(elem1, elem2, elem3);
        }
    }catch(err){
        console.log("Error in recentDocs:", err);
    }    
}

function renderRecentDocs(elem1,elem2,elem3){
    console.log("renderRecentDocs called with:", {elem1, elem2, elem3});
    let html = '';
    
    if(elem1 && elem1.doctor_name !== undefined) {
        console.log("Rendering elem1:", elem1);
        html += `
        <tr>
            <td>${elem1.doctor_name || 'N/A'}</td>
            <td>${getDepartmentName(elem1.department_id) || 'N/A'}</td>
            <td>${elem1.phone_no || 'N/A'}</td>
            <td>${(elem1.experience || '').split(" ")[0] || 'N/A'}</td>
        </tr>`;
    }
    
    if(elem2 && elem2.doctor_name !== undefined) {
        console.log("Rendering elem2:", elem2);
        html += `
        <tr>
            <td>${elem2.doctor_name || 'N/A'}</td>
            <td>${getDepartmentName(elem2.department_id) || 'N/A'}</td>
            <td>${elem2.phone_no || 'N/A'}</td>
            <td>${(elem2.experience || '').split(" ")[0] || 'N/A'}</td>
        </tr>`;
    }
    
    if(elem3 && elem3.doctor_name !== undefined) {
        console.log("Rendering elem3:", elem3);
        html += `
        <tr>
            <td>${elem3.doctor_name || 'N/A'}</td>
            <td>${getDepartmentName(elem3.department_id) || 'N/A'}</td>
            <td>${elem3.phone_no || 'N/A'}</td>
            <td>${(elem3.experience || '').split(" ")[0] || 'N/A'}</td>
        </tr>`;
    }
    
    if(!html) {
        html = '<tr><td colspan="4">No doctors found</td></tr>';
    }
    
    console.log("Final HTML:", html);
    document.getElementById("doc-tbody").innerHTML = html;
}

async function recentPatients(){
    try{
        let res=await fetch(baseURL+"/admin/all");
        if(res.ok){
            let data=await res.json();
            console.log("Patient data:", data);
            let arr=data.usersRegistered || [];
            console.log("Patient array:", arr);
            renderPatientsData(arr);
            // Get last 3 patients, handle cases with fewer than 3
            let lastThree = arr.slice(-3);
            console.log("Last three patients:", lastThree);
            // Only pass defined elements
            let elem1 = lastThree[0] || null;
            let elem2 = lastThree[1] || null;
            let elem3 = lastThree[2] || null;
            console.log("Patient elements to render:", {elem1, elem2, elem3});
            renderRecentPatients(elem1, elem2, elem3);
        }
    }catch(err){
        console.log("Error in recentPatients:", err);
    }    
}

function renderRecentPatients(elem1,elem2,elem3){
    console.log("renderRecentPatients called with:", {elem1, elem2, elem3});
    let html = '';
    
    if(elem1 && elem1.first_name !== undefined) {
        console.log("Rendering patient elem1:", elem1);
        html += `
        <tr>
            <td>${elem1.first_name || 'N/A'}</td>
            <td>${elem1.last_name || 'N/A'}</td>
            <td>${elem1.email || 'N/A'}</td>
            <td>${elem1.mobile || 'N/A'}</td>
        </tr>`;
    }
    
    if(elem2 && elem2.first_name !== undefined) {
        console.log("Rendering patient elem2:", elem2);
        html += `
        <tr>
            <td>${elem2.first_name || 'N/A'}</td>
            <td>${elem2.last_name || 'N/A'}</td>
            <td>${elem2.email || 'N/A'}</td>
            <td>${elem2.mobile || 'N/A'}</td>
        </tr>`;
    }
    
    if(elem3 && elem3.first_name !== undefined) {
        console.log("Rendering patient elem3:", elem3);
        html += `
        <tr>
            <td>${elem3.first_name || 'N/A'}</td>
            <td>${elem3.last_name || 'N/A'}</td>
            <td>${elem3.email || 'N/A'}</td>
            <td>${elem3.mobile || 'N/A'}</td>
        </tr>`;
    }
    
    if(!html) {
        html = '<tr><td colspan="4">No patients found</td></tr>';
    }
    
    console.log("Final patient HTML:", html);
    document.getElementById("pat-tbody").innerHTML = html;
}

async function recentApps(){
    try{
        let res=await fetch(baseURL+"/appointment/all");
        if(res.ok){
            let data=await res.json();
            console.log("Appointment data:", data);
            let arr=data.appointments || [];
            console.log("Appointment array:", arr);
            renderAppsData(arr);
            // Get last 3 appointments, handle cases with fewer than 3
            let lastThree = arr.slice(-3);
            console.log("Last three appointments:", lastThree);
            // Only pass defined elements
            let elem1 = lastThree[0] || null;
            let elem2 = lastThree[1] || null;
            let elem3 = lastThree[2] || null;
            console.log("Appointment elements to render:", {elem1, elem2, elem3});
            renderRecentApps(elem1, elem2, elem3);  
        }
    }catch(err){
        console.log("Error in recentApps:", err);
    }    
}

function renderRecentApps(elem1,elem2,elem3){
    console.log("renderRecentApps called with:", {elem1, elem2, elem3});
    let html = '';
    
    if(elem1 && elem1.patient_first_name !== undefined) {
        console.log("Rendering appointment elem1:", elem1);
        html += `
        <tr>
            <td>${elem1.patient_first_name || 'N/A'}</td>
            <td>${elem1.doc_first_name || 'N/A'}</td>
            <td>${elem1.appointment_date || 'N/A'}</td>
            <td style="color:${elem1.status ? 'green' : 'red'}">${elem1.status ? 'Approved' : 'Pending'}</td>
        </tr>`;
    }
    
    if(elem2 && elem2.patient_first_name !== undefined) {
        console.log("Rendering appointment elem2:", elem2);
        html += `
        <tr>
            <td>${elem2.patient_first_name || 'N/A'}</td>
            <td>${elem2.doc_first_name || 'N/A'}</td>
            <td>${elem2.appointment_date || 'N/A'}</td>
            <td style="color:${elem2.status ? 'green' : 'red'}">${elem2.status ? 'Approved' : 'Pending'}</td>
        </tr>`;
    }
    
    if(elem3 && elem3.patient_first_name !== undefined) {
        console.log("Rendering appointment elem3:", elem3);
        html += `
        <tr>
            <td>${elem3.patient_first_name || 'N/A'}</td>
            <td>${elem3.doc_first_name || 'N/A'}</td>
            <td>${elem3.appointment_date || 'N/A'}</td>
            <td style="color:${elem3.status ? 'green' : 'red'}">${elem3.status ? 'Approved' : 'Pending'}</td>
        </tr>`;
    }
    
    if(!html) {
        html = '<tr><td colspan="4">No appointments found</td></tr>';
    }
    
    console.log("Final appointment HTML:", html);
    document.getElementById("app-tbody").innerHTML = html;
}

//Doctor Functions 

function renderDocsData(arr){
    let docs_tbody=document.getElementById("doc-render");

    docs_tbody.innerHTML="";
    arr.forEach((elem,ind)=>{
        let tr=document.createElement("tr");

        let pfp=document.createElement("td");
        pfp.classList.add("pfp-td");
        let img=document.createElement("img");
        img.src=elem.image || 'https://via.placeholder.com/50';
        img.classList.add("render-pfp");
        pfp.append(img);

        let name=document.createElement("td");
        name.innerText=elem.doctor_name || 'N/A';

        let dept=document.createElement("td");
        dept.innerText=getDepartmentName(elem.department_id) || 'N/A';

        let email=document.createElement("td");
        email.innerText=elem.email || 'N/A';

        let phone=document.createElement("td");
        phone.innerText=elem.phone_no || 'N/A';

        let status=document.createElement("td");
        if(elem.status){
            status.innerText="Approved";
            status.style.color="blue";
        }else{
            status.innerText="Click to approve";
            status.style.color="red"; 
            status.addEventListener("click",(e)=>{
                // console.log(arr);
                swal("", "Confirm Approval?", "info").then(function() {
                    approveDoctor(elem.id || elem._id);
                    });
            })          
        }

        let del=document.createElement("td");
        del.innerText="Remove";
        del.style.color="red";
        del.addEventListener("click",(e)=>{
            swal("", "Confirm Delete?", "info").then(function() {
                deleteDoc(elem.id || elem._id);
                });
        })

        tr.append(pfp,name,dept,email,phone,status,del);
        docs_tbody.append(tr);
    })
}

//ADD NEW DOCTOR
let docForm=document.querySelector(".create-doc form");

docForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    const submit=confirm("Confirm submission?");
    if(submit){addDoc();}
})

async function addDoc(){
    let docObj={
        doctorName: docForm.name.value,
        email: docForm.email.value,
        password: docForm.password.value,
        qualifications: docForm.qual.value,
        experience: docForm.exp.value,
        phoneNo: docForm.phone.value,
        city: docForm.city.value,
        departmentId: docForm.dept.value,
        status: docForm.status.value === 'true',
        image: docForm.img.value,
    }
    console.log("Sending doctor data:", docObj);
    try{
        let res=await fetch(baseURL+`doctor/addDoctor`,{
            method:"POST",
            headers:{
				"content-type": "application/json"
			},
            body: JSON.stringify(docObj)
        });
        console.log("Response status:", res.status);
        if(res.ok){
            let data=await res.json();
            console.log("Success response:", data);
            swal("", `${data.msg}`, "success").then(function() {
                docForm.reset();
                recentDocs();
                });
        }else{
            let errorData = await res.json();
            console.log("Error response:", errorData);
            swal("",`${errorData.msg || 'Unknown error'}`, "warning");
        }
    }catch(err){
        console.log("Network error:", err);
        swal("","Error 404","warning");
    }    
}

//APPROVE DOCTOR
async function approveDoctor(id){
    // console.log(id);
    try{
        let res=await fetch(baseURL+`doctor/updateDoctorStatus/${id}`,{
            method:"PATCH",
            headers:{
				"content-type": "application/json"
			}
        });
        if(res.ok){
            let data=await res.json();
            recentDocs();
        }
    }catch(err){
        console.log(err);
    }    
}

//DELETE DOCTOR
async function deleteDoc(id){
    try{
        let res=await fetch(baseURL+`doctor/removeDoctor/${id}`,{
            method:"DELETE",
            headers:{
				"content-type": "application/json"
			}
        });
        if(res.ok){
            let data=await res.json();
            recentDocs();
        }
    }catch(err){
        console.log(err);
    }    
}

//SEARCH DOCTOR
let docInputTag=document.querySelector("#doc-sf-left>input");
docInputTag.addEventListener("input", async (e)=>{
    let searchVal=docInputTag.value;
    try{
        let res=await fetch(baseURL+`doctor/search?q=${searchVal}`);
        if(res.ok){
            let data=await res.json();
            //console.log(data);
            renderDocsData(data);
        }
    }catch(err){
        console.log(err);
    }
})

//FILTER BY DEPT ID
let docFilterTag=document.querySelector("#doc-sf-right>select");
docFilterTag.addEventListener("change",async (e)=>{
    let filterValue=docFilterTag.value;
    try{
        let res=await fetch(baseURL+`doctor/allDoctor/${filterValue}`);
        if(res.ok){
            let data=await res.json();
            if(data.msg){
                swal("", `${data.msg}`, "info").then(function() {
                    recentDocs();
                    });
                }else{
                    renderDocsData(data.doctor);
                }                
            } 
    }catch(err){
        console.log(err);
    }
})

//FILTER BY PENDING APPROVAL

document.querySelector("#filter-approval>button").addEventListener("click",async (e)=>{
    try{
        let res=await fetch(baseURL+`doctor/docPending`);
        if(res.ok){
            let data=await res.json();
            renderDocsData(data.docPending);
        }
    }catch(err){
        console.log(err);
    }
})

//RESET FILTERS

document.querySelector("#filter-approval>p").addEventListener("click",async (e)=>{
    try{
        recentDocs();
    }catch(err){
        console.log(err);
    }
})


//PATIENTS DATA DISPLAY

function renderPatientsData(arr){
    let users_tbody=document.getElementById("user-render");

    users_tbody.innerHTML="";
    arr.forEach((elem)=>{
        let tr=document.createElement("tr");

        let fname=document.createElement("td");
        fname.innerText=elem.first_name || 'N/A';

        let lname=document.createElement("td");
        lname.innerText=elem.last_name || 'N/A';

        let email=document.createElement("td");
        email.innerText=elem.email || 'N/A';

        let phone=document.createElement("td");
        phone.innerText=elem.mobile || 'N/A';

        let block=document.createElement("td");
        block.innerText="Block";
        block.style.color="red";

        tr.append(fname,lname,email,phone,block);
        users_tbody.append(tr);
    })
}

//APPOINTMENTS DATA DISPLAY

function renderAppsData(arr){
    // console.log(arr);
    let apps_tbody=document.getElementById("apps-render");

    apps_tbody.innerHTML="";
    arr.forEach((elem)=>{
        let tr=document.createElement("tr");

        let pname=document.createElement("td");
        pname.innerText=elem.patient_first_name || 'N/A';

        let gender=document.createElement("td");
        gender.innerText=elem.gender || 'N/A';

        let doc=document.createElement("td");
        doc.innerText=elem.doc_first_name || 'N/A';

        let date=document.createElement("td");
        date.innerText=elem.appointment_date || 'N/A';

        let reason=document.createElement("td");
        reason.innerText=elem.problem_description || 'N/A';

        let status=document.createElement("td");
        if(elem.status){
            status.innerText="Paid";
            status.style.color="blue";
        }else{
            status.innerText="Not Paid";
            status.style.color="red"; 
            status.addEventListener("click",(e)=>{
                // console.log(arr);
                swal("", "Confirm Approval?", "info").then(function() {
                    approveApp(elem.id || elem._id);
                    });
            })          
        }


        tr.append(pname,gender,doc,date,reason,status);
        apps_tbody.append(tr);
    })
}

//APPROVE Appointment
async function approveApp(id){
    // console.log(id);
    try{
        let res=await fetch(baseURL+`appointment/approve/${id}`,{
            method:"PATCH",
            headers:{
				"content-type": "application/json"
			}
        });
        if(res.ok){
            let data=await res.json();
            recentApps();
        }
    }catch(err){
        console.log(err);
    }    
}

//Logout
document.getElementById("menu-logout").addEventListener("click",(e)=>{
    // Clear all admin-related storage
    localStorage.removeItem("admin");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userType");
    localStorage.removeItem("userName");
    localStorage.removeItem("adminId");
    localStorage.removeItem("userEmail");
    sessionStorage.removeItem("adminId");
    sessionStorage.removeItem("userEmail");
    
    swal("", `Logged out successfully`, "success").then(function(){
        window.location.href="./login.html";
    });
})







