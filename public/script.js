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
    try { result = JSON.parse(text); } catch { /* Server replied with non-JSON. */ }
    if (!response.ok) throw new Error(`${result.error || "Server error"} (status ${response.status})`);
    statusEl.textContent = result.message || `Sent (status ${response.status})`;
    statusEl.dataset.kind = "success";
    form.reset();
    activateTab(tabs[0]);
  } catch (error) {
    statusEl.textContent = error.message || "Unable to send your response. Please try again.";
    statusEl.dataset.kind = "error";
  } finally {
    button.disabled = false;
    button.textContent = "Send my response";
  }
});
