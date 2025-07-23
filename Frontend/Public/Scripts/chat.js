const socket = io("http://localhost:3000");

// Replace these with actual session or localStorage
// const appointmentId = localStorage.getItem("approvedAppointmentId");
// const senderId = localStorage.getItem("userId");

// fake
const appointmentId = "1"; // fake/test appointment ID
const senderId = "2";      // test user ID


const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// if (!appointmentId || !senderId) {
//   chatMessages.innerHTML = "<p>You have no approved appointments to chat.</p>";
// } else {
  socket.emit("joinRoom", { appointmentId });

//   socket.on("accessDenied", () => {
//     chatMessages.innerHTML = "<p>Chat not available. Appointment not approved.</p>";
//   });

  socket.on("chatHistory", (messages) => {
    chatMessages.innerHTML = "";
    messages.forEach((msg) => {
      appendMessage(msg.sender_id, msg.message, msg.timestamp);
    });
  });

  socket.on("newMessage", (msg) => {
    appendMessage(msg.senderId, msg.message, msg.timestamp);
  });

  sendBtn.onclick = () => {
    const message = messageInput.value.trim();
    if (message) {
      socket.emit("sendMessage", {
        appointmentId,
        senderId,
        message
      });
      messageInput.value = "";
    }
  };
// }

function appendMessage(sender, text, timestamp) {
  const div = document.createElement("div");
  div.className = sender == senderId ? "message-me" : "message-other";
  div.innerHTML = `<b>User ${sender}:</b> ${text}<br>
    <span style="font-size: 0.8em; color: #888;">${new Date(timestamp).toLocaleTimeString()}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
