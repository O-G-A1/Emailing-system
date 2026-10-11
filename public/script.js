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

document.querySelectorAll(".choice").forEach((choice) => {
  choice.addEventListener("click", () => {
    selectedTopic.textContent = choice.dataset.topic;
    choiceStep.hidden = true;
    formView.hidden = false;
    formView.scrollIntoView({ behavior: "smooth", block: "start" });
    formView.querySelector("input").focus({ preventScroll: true });
  });
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
