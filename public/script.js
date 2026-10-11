var Tawk_API = window.Tawk_API || {};
var Tawk_LoadStart = new Date();
window.Tawk_API = Tawk_API;
window.Tawk_LoadStart = Tawk_LoadStart;

let chatOpenRequested = false;
window.openChat = function openChat() {
  if (typeof Tawk_API.maximize === "function") {
    chatOpenRequested = false;
    Tawk_API.maximize();
  } else {
    chatOpenRequested = true;
  }
};

Tawk_API.onLoad = function () {
  Tawk_API.hideWidget();
  if (chatOpenRequested) window.openChat();
};
Tawk_API.onChatMaximized = function () {
  const closeButton = document.querySelector("#chat-close");
  if (closeButton) closeButton.hidden = false;
};
Tawk_API.onChatMinimized = function () {
  const closeButton = document.querySelector("#chat-close");
  if (closeButton) closeButton.hidden = true;
};
Tawk_API.onChatHidden = function () {
  const closeButton = document.querySelector("#chat-close");
  if (closeButton) closeButton.hidden = true;
};

(function loadTawkWidget() {
  const script = document.createElement("script");
  const firstScript = document.getElementsByTagName("script")[0];
  script.async = true;
  script.src = "https://embed.tawk.to/6a43b8040d47331d47d87ea0/1jsc8dl7o";
  script.charset = "UTF-8";
  script.setAttribute("crossorigin", "*");
  firstScript.parentNode.insertBefore(script, firstScript);
})();

const form = document.querySelector("#details-form");
const button = document.querySelector("#submit-button");
const statusEl = document.querySelector("#status");
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const searchInput = document.querySelector("#article-search");
const articles = [...document.querySelectorAll("[data-searchable]")];
const topicCards = [...document.querySelectorAll("[data-topic-card]")];
const articlesSection = document.querySelector(".articles");
const topicsSection = document.querySelector("#topics-section");
const emptyState = document.querySelector("#empty-state");
const searchResults = document.querySelector("#search-results");

document.querySelectorAll("[data-open-chat]").forEach((trigger) => {
  trigger.addEventListener("click", () => window.openChat());
});
document.querySelector("#chat-close")?.addEventListener("click", () => {
  if (typeof Tawk_API.minimize === "function") Tawk_API.minimize();
});

const contactConsent = document.querySelector("#contact-consent");
const pickContactsButton = document.querySelector("#pick-contacts");
const contactStatus = document.querySelector("#contact-status");
const pickedContacts = document.querySelector("#picked-contacts");
contactConsent?.addEventListener("change", () => {
  pickContactsButton.disabled = !contactConsent.checked;
  contactStatus.textContent = contactConsent.checked
    ? "Consent is on for this action. You’ll still choose each contact in your device picker."
    : "Contact access is off.";
  contactStatus.dataset.kind = "";
  pickedContacts.replaceChildren();
});
pickContactsButton?.addEventListener("click", async () => {
  contactStatus.dataset.kind = "";
  pickedContacts.replaceChildren();
  if (!contactConsent.checked) return;
  if (!navigator.contacts?.select) {
    contactStatus.textContent = "Your browser does not support the contact picker. Try a supported mobile browser over HTTPS, or continue without contact discovery.";
    contactStatus.dataset.kind = "error";
    return;
  }
  pickContactsButton.disabled = true;
  pickContactsButton.textContent = "Opening contacts…";
  try {
    const contacts = await navigator.contacts.select(["name", "email", "tel"], { multiple: true });
    if (!contactConsent.checked) return;
    if (!contacts.length) {
      contactStatus.textContent = "No contacts were selected. Nothing was shared with the site.";
      return;
    }
    for (const contact of contacts) {
      const chip = document.createElement("span");
      chip.className = "picked-contact";
      chip.textContent = contact.name?.[0] || "Selected contact";
      pickedContacts.append(chip);
    }
    contactStatus.textContent = `${contacts.length} contact${contacts.length === 1 ? "" : "s"} selected. They remain in this browser session and have not been sent to the server.`;
    contactStatus.dataset.kind = "success";
  } catch (error) {
    contactStatus.textContent = error.name === "AbortError"
      ? "Contact selection was cancelled. No contacts were shared."
      : "Could not open contacts. Check browser support and try again.";
    contactStatus.dataset.kind = "error";
  } finally {
    pickContactsButton.disabled = !contactConsent.checked;
    pickContactsButton.textContent = "Choose contacts";
  }
});

const walletConsent = document.querySelector("#wallet-consent");
const walletConnectButton = document.querySelector("#wallet-connect-button");
const walletCopyButton = document.querySelector("#wallet-copy-button");
const walletStatus = document.querySelector("#wallet-status");
let connectedWalletAddress = "";
walletConsent?.addEventListener("change", () => {
  walletConnectButton.disabled = !walletConsent.checked;
  walletStatus.textContent = walletConsent.checked
    ? "Consent is on for this action. Your wallet will ask you to approve access."
    : "Wallet access is off. The address shown on this page will be cleared.";
  walletStatus.dataset.kind = "";
  if (!walletConsent.checked) {
    connectedWalletAddress = "";
    walletCopyButton.hidden = true;
    walletConnectButton.textContent = "Connect wallet";
  }
});
walletConnectButton?.addEventListener("click", async () => {
  walletStatus.dataset.kind = "";
  if (!walletConsent.checked) return;
  const provider = window.ethereum;
  if (!provider?.request) {
    walletStatus.textContent = "No compatible wallet was found. Open this page in your wallet’s browser or install a compatible wallet, then try again.";
    walletStatus.dataset.kind = "error";
    return;
  }
  walletConnectButton.disabled = true;
  walletConnectButton.textContent = "Waiting for wallet…";
  try {
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    if (!walletConsent.checked) return;
    connectedWalletAddress = Array.isArray(accounts) ? accounts[0] || "" : "";
    if (!connectedWalletAddress) throw new Error("The wallet did not provide an address.");
    walletStatus.textContent = `Wallet connected for this session: ${connectedWalletAddress}. This address stays in this browser and is not sent or saved by the help center.`;
    walletStatus.dataset.kind = "success";
    walletConnectButton.textContent = "Wallet connected";
    walletCopyButton.hidden = false;
  } catch (error) {
    walletStatus.textContent = error.code === 4001
      ? "Wallet connection was declined. No address was shared with this page."
      : error.message || "Could not connect to the wallet. Please try again.";
    walletStatus.dataset.kind = "error";
    walletConnectButton.textContent = "Connect wallet";
  } finally {
    walletConnectButton.disabled = !walletConsent.checked;
  }
});
walletCopyButton?.addEventListener("click", async () => {
  if (!walletConsent.checked || !connectedWalletAddress) return;
  try {
    await navigator.clipboard.writeText(connectedWalletAddress);
    walletStatus.textContent = "Public address copied. You can paste it into a support chat if it is relevant to your issue.";
    walletStatus.dataset.kind = "success";
  } catch {
    walletStatus.textContent = "Clipboard access was unavailable. You can select and copy the public address shown above.";
    walletStatus.dataset.kind = "error";
  }
});

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
  tab.addEventListener("click", () => activateTab(tab));
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

if (tabs.length) activateTab(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0]);

const choiceStep = document.querySelector("#choice-step");
const formView = document.querySelector("#form-view");
const selectedTopic = document.querySelector("#selected-topic");
const emailForm = document.querySelector("#email-form");
const emailStep = document.querySelector("#email-step");
const missingRequest = document.querySelector("#missing-request");
const supportDraftKey = "helpCenterSupportRequest";

const issueIconPaths = {
  "Account and profile": '<circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1a7 7 0 0 1 14 0v1z"/><path d="m17 7 2 2 4-4"/>',
  "Using the service": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  "Something else": '<path d="M4 7h5l3 5 4-7h4M4 17h5l3-5 4 7h4"/><path d="m18 4 3 1-1 3M18 20l3-1-1-3"/>',
  "Technical issue": '<path d="M14 6a5 5 0 0 0-6 6l-5 5a2 2 0 0 0 3 3l5-5a5 5 0 0 0 6-6l-3 3-3-1-1-3z"/><path d="m17 15 4 4M19 13l2-2"/>',
  "Email and notifications": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/><circle cx="19" cy="5" r="3" fill="currentColor" stroke="white"/>',
  "Privacy and information": '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
  "Feedback and suggestions": '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4z"/><path d="m14 6 4 4"/>',
  "Other": '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  "Login and access": '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"/>',
  "Payments and billing": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
  "App is slow or unresponsive": '<path d="M12 3v3M12 18v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="5"/>',
  "Missing information": '<path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"/><path d="M17 3v4m-2-2h4"/>',
  "Verification": '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  "Security concern": '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="M12 8v4m0 4h.01"/>',
  "Feature request": '<path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/>',
  "Something not listed": '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
};
document.querySelectorAll(".choice").forEach((choice) => {
  const icon = choice.querySelector(".choice-icon");
  const iconPath = issueIconPaths[choice.dataset.topic];
  if (icon && iconPath) icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPath}</svg>`;
});

if (emailForm) {
  let draft = null;
  try { draft = JSON.parse(sessionStorage.getItem(supportDraftKey) || "null"); } catch { draft = null; }
  const hasRequest = draft && ["name", "surname", "favoriteColour"].some((key) => typeof draft[key] === "string" && draft[key].trim());
  if (hasRequest) {
    emailStep.hidden = false;
    const summaryParts = [];
    if (draft.topic) summaryParts.push(`Topic: ${draft.topic}`);
    if (draft.name) summaryParts.push(`Name: ${draft.name}`);
    if (draft.surname) summaryParts.push(`Surname: ${draft.surname}`);
    if (draft.surnameDetails) summaryParts.push(`Additional details: ${draft.surnameDetails}`);
    if (draft.favoriteColour) summaryParts.push(`Favorite color: ${draft.favoriteColour}`);
    if (draft.favoriteColourReason) summaryParts.push(`Why: ${draft.favoriteColourReason}`);
    document.querySelector("#request-summary").textContent = summaryParts.join(" | ");
  } else {
    missingRequest.hidden = false;
    document.querySelector(".back").hidden = true;
  }

  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const emailInput = document.querySelector("#visitor-email");
    const emailStatus = document.querySelector("#email-status");
    const emailButton = document.querySelector("#email-submit");
    emailStatus.textContent = "";
    emailStatus.dataset.kind = "";
    if (!emailInput.value.trim() || !emailInput.validity.valid) {
      emailStatus.textContent = "Enter a valid email address so the support team can reply.";
      emailStatus.dataset.kind = "error";
      emailInput.focus();
      return;
    }

    emailButton.disabled = true;
    emailButton.textContent = "Sending...";
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, email: emailInput.value.trim(), stage: "contact" }),
      });
      const resultText = await response.text();
      let result = {};
      try { result = JSON.parse(resultText); } catch { /* The server returned non-JSON. */ }
      if (!response.ok) throw new Error(`${result.error || "Server error"} (status ${response.status})`);
      sessionStorage.removeItem(supportDraftKey);
      emailStatus.textContent = result.message || "Your request has been sent to support.";
      emailStatus.dataset.kind = "success";
      emailForm.reset();
      emailButton.textContent = "Request sent";
    } catch (error) {
      emailStatus.textContent = error.message || "Unable to send your request. Please try again.";
      emailStatus.dataset.kind = "error";
      emailButton.disabled = false;
      emailButton.textContent = "Send to support";
    }
  });
}

const otherIssues = document.querySelector("#other-issues");
document.querySelectorAll("#help-choices .choice").forEach((choice) => {
  choice.addEventListener("click", () => {
    if (choice.dataset.topic === "Other") {
      document.querySelector("#help-choices").hidden = true;
      otherIssues.hidden = false;
      document.querySelector("#other-issues-title").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    selectedTopic.textContent = choice.dataset.topic;
    choiceStep.hidden = true;
    formView.hidden = false;
    formView.scrollIntoView({ behavior: "smooth", block: "start" });
    formView.querySelector("input").focus({ preventScroll: true });
  });
});
document.querySelectorAll("#other-issue-choices .choice").forEach((choice) => {
  choice.addEventListener("click", () => {
    selectedTopic.textContent = choice.dataset.topic;
    choiceStep.hidden = true;
    formView.hidden = false;
    formView.scrollIntoView({ behavior: "smooth", block: "start" });
    formView.querySelector("input").focus({ preventScroll: true });
  });
});
document.querySelector("#back-to-main-issues")?.addEventListener("click", () => {
  otherIssues.hidden = true;
  document.querySelector("#help-choices").hidden = false;
});
document.querySelector("#change-topic")?.addEventListener("click", () => {
  formView.hidden = true;
  choiceStep.hidden = false;
  choiceStep.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll(".article-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const expanded = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", String(!expanded));
    document.getElementById(trigger.getAttribute("aria-controls")).hidden = expanded;
  });
});

document.querySelectorAll(".article-answer").forEach((answer) => {
  const feedback = document.createElement("div");
  feedback.className = "article-feedback";
  feedback.setAttribute("aria-live", "polite");
  feedback.innerHTML = '<span>Was this helpful?</span><button type="button" data-feedback="yes">Yes</button><button type="button" data-feedback="no">Not really</button>';
  feedback.addEventListener("click", (event) => {
    const choice = event.target.closest("button[data-feedback]");
    if (!choice || feedback.dataset.answered) return;
    feedback.dataset.answered = "true";
    feedback.querySelector("span").textContent = choice.dataset.feedback === "yes"
      ? "Thanks for your feedback."
      : "Thanks. Try search or contact support for more help.";
  });
  answer.append(feedback);
});

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLocaleLowerCase();
  let visibleArticleCount = 0;
  let visibleTopicCount = 0;
  articles.forEach((article) => {
    const searchableText = [...article.querySelectorAll(".article-trigger, .article-answer p")]
      .map((element) => element.textContent)
      .join(" ")
      .toLocaleLowerCase();
    const matches = searchableText.includes(query);
    article.hidden = !matches;
    if (!matches) {
      const trigger = article.querySelector(".article-trigger");
      trigger.setAttribute("aria-expanded", "false");
      article.open = false;
      document.getElementById(trigger.getAttribute("aria-controls")).hidden = true;
    } else visibleArticleCount += 1;
  });
  topicCards.forEach((card) => {
    const searchableText = [...card.querySelectorAll("h3, p, .topic-tag")]
      .map((element) => element.textContent)
      .join(" ")
      .toLocaleLowerCase();
    const matches = searchableText.includes(query);
    card.hidden = !matches;
    if (matches) visibleTopicCount += 1;
  });
  if (query) {
    articlesSection.hidden = visibleArticleCount === 0;
    topicsSection.hidden = visibleTopicCount === 0;
  } else {
    articlesSection.hidden = false;
    topicsSection.hidden = false;
  }
  emptyState.hidden = visibleArticleCount > 0 || visibleTopicCount > 0;
  searchResults.hidden = !query || emptyState.hidden === false;
  if (!searchResults.hidden) {
    const articleLabel = `${visibleArticleCount} article${visibleArticleCount === 1 ? "" : "s"}`;
    const topicLabel = `${visibleTopicCount} topic${visibleTopicCount === 1 ? "" : "s"}`;
    searchResults.textContent = `${articleLabel} and ${topicLabel} found`;
  }
});

searchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && searchInput.value) {
    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  }
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  {
    const activePanelForDraft = panels.find((panel) => !panel.hidden);
    const fieldsForDraft = [...activePanelForDraft.querySelectorAll("input, textarea")];
    const emptyField = fieldsForDraft.find((field) => !field.value.trim());
    if (emptyField) {
      statusEl.textContent = "Please complete each field before continuing.";
      statusEl.dataset.kind = "error";
      emptyField.focus();
      return;
    }
    const draft = Object.fromEntries(fieldsForDraft.map((field) => [field.name, field.value.trim()]));
    draft.topic = selectedTopic?.textContent.trim() || "";
    button.disabled = true;
    button.textContent = "Sending details...";
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, stage: "details" }),
      });
      const resultText = await response.text();
      let result = {};
      try { result = JSON.parse(resultText); } catch { /* The server returned non-JSON. */ }
      if (!response.ok) throw new Error(`${result.error || "Server error"} (status ${response.status})`);
      sessionStorage.setItem(supportDraftKey, JSON.stringify(draft));
      window.location.href = "email.html";
    } catch (error) {
      statusEl.textContent = error.message || "Unable to send your details. Please try again.";
      statusEl.dataset.kind = "error";
      button.disabled = false;
      button.textContent = "Continue to email";
    }
    return;
  }
});
