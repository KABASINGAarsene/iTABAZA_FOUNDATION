import io from "https://cdn.socket.io/4.5.1/socket.io.esm.min.js";

document.addEventListener("DOMContentLoaded", () => {
  const fab = document.getElementById("chat-fab");
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const messages = document.getElementById("chat-messages");

  // Only enable chat if appointment approved
  const appointmentId = localStorage.getItem("approvedAppointmentId");
  const senderId = localStorage.getItem("userId");

  if (!appointmentId || !senderId) {
    fab.style.display = "none";
    return;
  }

  const socket = io("http://localhost:3000");

  socket.emit("joinRoom", { appointmentId });

  socket.on("accessDenied", () => {
    alert("Chat not available yet. Appointment not approved.");
  });

  socket.on("chatHistory", (msgs) => {
    messages.innerHTML = "";
    msgs.forEach((msg) => {
      appendMsg(msg.sender_id, msg.message, msg.timestamp);
    });
  });

  socket.on("newMessage", (msg) => {
    appendMsg(msg.senderId, msg.message, msg.timestamp);
  });

  fab.addEventListener("click", () => {
    panel.style.display = "flex";
  });

  closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
  });

  sendBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (text) {
      socket.emit("sendMessage", {
        appointmentId,
        senderId,
        message: text
      });
      input.value = "";
    }
  });

  function appendMsg(senderId, message, timestamp) {
    const div = document.createElement("div");
    div.innerHTML = `<strong>User ${senderId}:</strong> ${message}<br>
      <span style="color: #aaa; font-size: 0.8em;">${new Date(timestamp).toLocaleTimeString()}</span>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }
});
