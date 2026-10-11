const form = document.querySelector("#details-form");
const button = document.querySelector("#submit-button");
const statusEl = document.querySelector("#status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "";
  statusEl.dataset.kind = "";
  button.disabled = true;
  button.textContent = "Sending…";

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

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
  } catch (error) {
    statusEl.textContent =
      error.message || "Unable to send your response. Please try again.";
    statusEl.dataset.kind = "error";
  } finally {
    button.disabled = false;
    button.textContent = "Send my response";
  }
});
