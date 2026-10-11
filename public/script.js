const form = document.querySelector("#details-form");
const button = document.querySelector("#submit-button");
const statusEl = document.querySelector("#status");
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function activateTab(tab, moveFocus = false) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => {
    panel.hidden = panel.id !== tab.getAttribute("aria-controls");
  });
  if (moveFocus) tab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", (event) => {
    event.preventDefault();
    activateTab(tab);
  });
  tab.addEventListener("keydown", (event) => {
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    }
  });
});

// Keep the initial panel state in sync even when the page is restored from cache.
activateTab(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0]);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "";
  statusEl.dataset.kind = "";
  const activePanel = panels.find((panel) => !panel.hidden);
  const activeInput = activePanel.querySelector("input");
  const value = activeInput.value.trim();
  if (!value) {
    statusEl.textContent = "Please enter a response before sending.";
    statusEl.dataset.kind = "error";
    activeInput.focus();
    return;
  }
  const payload = { [activeInput.name]: value };
  button.disabled = true;
  button.textContent = "Sending…";

  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    let result = {};
    try {
      result = JSON.parse(text);
    } catch {
      // Server replied with something that isn't JSON
    }
    if (!response.ok) {
      throw new Error(
        `${result.error || "Server error"} (status ${response.status})`,
      );
    }
    statusEl.textContent = result.message || `Sent (status ${response.status})`;
    statusEl.dataset.kind = "success";
    form.reset();
    activateTab(tabs[0]);
  } catch (error) {
    statusEl.textContent =
      error.message || "Unable to send your response. Please try again.";
    statusEl.dataset.kind = "error";
  } finally {
    button.disabled = false;
    button.textContent = "Send my response";
  }
});
