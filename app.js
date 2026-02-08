(function () {
  "use strict";

  const grid = document.getElementById("messages-grid");
  const phoneInput = document.getElementById("phone");
  const customMsg = document.getElementById("custom-message");
  const sendCustomBtn = document.getElementById("send-custom");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const tabs = document.querySelectorAll(".tab");

  let activeCategory = "all";

  // --- Phone number persistence ---
  function loadPhone() {
    const saved = localStorage.getItem("lovenotes_phone");
    if (saved) phoneInput.value = saved;
  }

  function savePhone() {
    localStorage.setItem("lovenotes_phone", phoneInput.value.trim());
  }

  phoneInput.addEventListener("input", savePhone);
  loadPhone();

  // --- Sanitize phone number ---
  function cleanPhone(raw) {
    return raw.replace(/[^0-9+]/g, "");
  }

  // --- WhatsApp deep link ---
  function openWhatsApp(message) {
    const phone = cleanPhone(phoneInput.value);
    if (!phone) {
      showToast("Please enter her WhatsApp number first");
      phoneInput.focus();
      return;
    }
    // Remove leading + for the API URL
    const num = phone.startsWith("+") ? phone.slice(1) : phone;
    const encoded = encodeURIComponent(message);
    // Use api.whatsapp.com which works on both mobile and desktop
    window.open("https://api.whatsapp.com/send?phone=" + num + "&text=" + encoded, "_blank");
  }

  // --- Copy to clipboard ---
  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(function () {
      btn.classList.add("copied");
      btn.textContent = "\u2713";
      showToast("Copied to clipboard");
      setTimeout(function () {
        btn.classList.remove("copied");
        btn.textContent = "\u{1F4CB}";
      }, 1500);
    });
  }

  // --- Render messages ---
  function renderMessages(category) {
    var filtered = category === "all"
      ? MESSAGES
      : MESSAGES.filter(function (m) { return m.category === category; });

    grid.innerHTML = "";

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="emoji">\u{1F494}</div><p>No messages in this category yet</p></div>';
      return;
    }

    filtered.forEach(function (msg) {
      var card = document.createElement("div");
      card.className = "message-card";
      card.innerHTML =
        '<span class="category-badge">' + escapeHtml(labelFor(msg.category)) + "</span>" +
        '<p class="message-text">' + escapeHtml(msg.text) + "</p>" +
        '<div class="card-actions">' +
        '<button class="send-btn"><span class="btn-icon">\u{1F49A}</span> Send on WhatsApp</button>' +
        '<button class="copy-btn" title="Copy">\u{1F4CB}</button>' +
        "</div>";

      card.querySelector(".send-btn").addEventListener("click", function () {
        openWhatsApp(msg.text);
      });

      card.querySelector(".copy-btn").addEventListener("click", function () {
        copyText(msg.text, this);
      });

      grid.appendChild(card);
    });
  }

  function labelFor(cat) {
    var labels = {
      romantic: "Romantic",
      funny: "Playful",
      morning: "Morning",
      night: "Goodnight",
      missing: "Missing You"
    };
    return labels[cat] || cat;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Tabs ---
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      activeCategory = tab.dataset.category;
      renderMessages(activeCategory);
    });
  });

  // --- Custom message ---
  customMsg.addEventListener("input", function () {
    sendCustomBtn.disabled = customMsg.value.trim().length === 0;
  });

  sendCustomBtn.addEventListener("click", function () {
    var text = customMsg.value.trim();
    if (text) {
      openWhatsApp(text);
    }
  });

  // --- Surprise Me (random message) ---
  shuffleBtn.addEventListener("click", function () {
    var pool = activeCategory === "all"
      ? MESSAGES
      : MESSAGES.filter(function (m) { return m.category === activeCategory; });

    if (pool.length === 0) return;
    var random = pool[Math.floor(Math.random() * pool.length)];
    openWhatsApp(random.text);
  });

  // --- Toast ---
  function showToast(message) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("visible");
    });

    setTimeout(function () {
      toast.classList.remove("visible");
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  // --- Init ---
  renderMessages("all");

  // --- Service worker registration ---
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {
      // SW registration failed, app still works fine
    });
  }
})();
