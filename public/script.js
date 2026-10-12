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

const minimumLoadingTime = (startedAt, minimumMs = 450) =>
  new Promise((resolve) => setTimeout(resolve, Math.max(0, minimumMs - (performance.now() - startedAt))));

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
const walletOptions = document.querySelector("#wallet-options");
const discoveredWallets = new Map();
let connectedWalletAddress = "";
window.addEventListener("eip6963:announceProvider", (event) => {
  const detail = event.detail;
  if (detail?.info?.uuid && detail?.provider?.request) {
    discoveredWallets.set(detail.info.uuid, {
      name: typeof detail.info.name === "string" ? detail.info.name : "Ethereum wallet",
      provider: detail.provider,
    });
  }
});
walletConsent?.addEventListener("change", () => {
  walletConnectButton.disabled = !walletConsent.checked;
  walletStatus.textContent = walletConsent.checked
    ? "Consent is on for this action. Your wallet will ask you to approve access."
    : "Wallet access is off. The address shown on this page will be cleared.";
  walletStatus.dataset.kind = "";
  if (!walletConsent.checked) {
    connectedWalletAddress = "";
    walletCopyButton.hidden = true;
    walletOptions.hidden = true;
    walletOptions.replaceChildren();
    walletConnectButton.textContent = "Find wallets";
  }
});
walletConnectButton?.addEventListener("click", async () => {
  walletStatus.dataset.kind = "";
  if (!walletConsent.checked) return;
  walletConnectButton.disabled = true;
  walletConnectButton.textContent = "Looking for wallets…";
  try {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (!walletConsent.checked) return;
    const providers = [...discoveredWallets.values()];
    const injected = window.ethereum;
    if (injected?.providers?.length) {
      injected.providers.forEach((provider, index) => {
        if (provider?.request && !providers.some((item) => item.provider === provider)) {
          providers.push({ name: provider.isMetaMask ? "MetaMask" : `Browser wallet ${index + 1}`, provider });
        }
      });
    } else if (injected?.request && !providers.some((item) => item.provider === injected)) {
      providers.push({ name: injected.isMetaMask ? "MetaMask" : "Browser wallet", provider: injected });
    }
    if (!providers.length) {
      walletStatus.textContent = "No Ethereum-compatible wallet exposed a browser connection. Try opening this site inside your wallet app. Other wallet types need a wallet-connection service to be configured.";
      walletStatus.dataset.kind = "error";
    } else {
      walletOptions.replaceChildren();
      const heading = document.createElement("p");
      heading.textContent = "Choose a wallet to continue. Your wallet will ask you to approve access.";
      walletOptions.append(heading);
      providers.forEach(({ name, provider }) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "wallet-option";
        option.textContent = name;
        option.addEventListener("click", () => connectSelectedWallet(provider));
        walletOptions.append(option);
      });
      walletOptions.hidden = false;
      walletStatus.textContent = `${providers.length} compatible wallet${providers.length === 1 ? "" : "s"} available.`;
    }
  } catch (error) {
    walletStatus.textContent = error.message || "Could not discover wallets. Please try again.";
    walletStatus.dataset.kind = "error";
  } finally {
    walletConnectButton.disabled = !walletConsent.checked;
    walletConnectButton.textContent = "Find wallets";
  }
});
async function connectSelectedWallet(provider) {
  if (!walletConsent.checked || !provider?.request) return;
  walletOptions.querySelectorAll("button").forEach((option) => { option.disabled = true; });
  walletStatus.textContent = "Waiting for wallet approval…";
  walletStatus.dataset.kind = "";
  try {
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    if (!walletConsent.checked) return;
    connectedWalletAddress = Array.isArray(accounts) ? accounts[0] || "" : "";
    if (!connectedWalletAddress) throw new Error("The wallet did not provide an address.");
    walletStatus.textContent = `Wallet connected for this session: ${connectedWalletAddress}. This address stays in this browser and is not sent or saved by the help center.`;
    walletStatus.dataset.kind = "success";
    walletCopyButton.hidden = false;
    walletOptions.hidden = true;
  } catch (error) {
    walletStatus.textContent = error.code === 4001
      ? "Wallet connection was declined. No address was shared with this page."
      : error.message || "Could not connect to the wallet. Please try again.";
    walletStatus.dataset.kind = "error";
    walletOptions.querySelectorAll("button").forEach((option) => { option.disabled = false; });
  }
}
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
  "Buy, sell, and swap": '<path d="M7 7h13l-3-3m3 3-3 3M17 17H4l3 3m-3-3 3-3"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/>',
  "Send or receive crypto": '<path d="M7 17 17 7M7 7h10v10"/><path d="M4 12v7h7"/>',
  "Deposits and withdrawals": '<path d="M12 3v18m-7-7 7 7 7-7M5 7l7-4 7 4"/>',
  "Wallet access and recovery": '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3"/>',
  "Pending or missing transaction": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2m4-9 2-2m-2 0h2v2"/>',
  "Network or token support": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  "Security or suspicious activity": '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
  "Other crypto question": '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  "Account access": '<circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1a7 7 0 0 1 14 0v1z"/>',
  "Verification and limits": '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
  "Fees and pricing": '<circle cx="12" cy="12" r="9"/><path d="M16 8.5c-.7-.7-1.6-1-3-1-1.7 0-3 .9-3 2.3 0 3.4 6 1.7 6 5.1 0 1.4-1.3 2.6-3.2 2.6-1.4 0-2.6-.5-3.5-1.4M12 5v14"/>',
  "Scam or fraud report": '<path d="M12 9v4m0 4h.01"/><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0z"/>',
  "App or technical issue": '<path d="M12 3v3M12 18v3M3 12h3m12 0h3"/><circle cx="12" cy="12" r="5"/><path d="m5.6 5.6 2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/>',
  "Cards and payments": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18m-14 5h4"/>',
  "Staking and rewards": '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
  "Other support question": '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
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

    const loadingStartedAt = performance.now();
    emailButton.disabled = true;
    emailButton.classList.add("is-loading");
    emailButton.setAttribute("aria-busy", "true");
    emailButton.textContent = "Submitting request...";
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
      await minimumLoadingTime(loadingStartedAt);
      emailButton.classList.remove("is-loading");
      emailButton.removeAttribute("aria-busy");
      sessionStorage.removeItem(supportDraftKey);
      emailStatus.textContent = result.message || "Your request has been sent to support.";
      emailStatus.dataset.kind = "success";
      emailForm.reset();
      emailButton.textContent = "Request submitted";
    } catch (error) {
      await minimumLoadingTime(loadingStartedAt);
      emailButton.classList.remove("is-loading");
      emailButton.removeAttribute("aria-busy");
      emailStatus.textContent = error.message || "Unable to send your request. Please try again.";
      emailStatus.dataset.kind = "error";
      emailButton.disabled = false;
      emailButton.textContent = "Submit support request";
    }
  });
}

const otherIssues = document.querySelector("#other-issues");
document.querySelectorAll("#help-choices .choice").forEach((choice) => {
  choice.addEventListener("click", () => {
    if (choice.dataset.topic === "Other crypto question") {
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
    const loadingStartedAt = performance.now();
    button.disabled = true;
    button.classList.add("is-loading");
    button.setAttribute("aria-busy", "true");
    button.textContent = "Processing your request...";
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
      await minimumLoadingTime(loadingStartedAt);
      sessionStorage.setItem(supportDraftKey, JSON.stringify(draft));
      window.location.href = "email.html";
    } catch (error) {
      await minimumLoadingTime(loadingStartedAt);
      button.classList.remove("is-loading");
      button.removeAttribute("aria-busy");
      statusEl.textContent = error.message || "Unable to send your details. Please try again.";
      statusEl.dataset.kind = "error";
      button.disabled = false;
      button.textContent = "Prepare support request";
    }
    return;
  }
});
