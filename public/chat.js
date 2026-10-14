const faqChatPanel = document.querySelector("#faq-chat-panel");
const faqChatLog = document.querySelector("#faq-chat-log");
const faqChatOptions = document.querySelector("#faq-chat-options");
const faqChatClose = document.querySelector("#faq-chat-close");

const faqChatAnswers = {
  "Account access":
    "For sign-in or locked-account issues, use the account recovery or password reset option in the official Onchain app. If you suspect unauthorized access, secure your account through the official app and review its security settings.",
  "Deposits and withdrawals":
    "Check the transfer status in the app and confirm that the asset and network are supported. For an on-chain transfer, you can check its transaction hash on the explorer for that network. A pending transfer may take time to confirm.",
  "Pending transaction":
    "A pending transaction may be waiting for network confirmation. Check its status in the app or on the relevant network explorer, and avoid submitting the same transfer again while its status is unclear.",
  "Fees and pricing":
    "Review the fee estimate shown in the app before confirming. Network fees can change with network conditions, and the final amount should be visible before you approve a transaction.",
  "Buy, sell, or swap":
    "Before confirming, check the selected asset, network, amount, and any fee or quote shown in the app. If an order or swap is still processing, check its status before trying again.",
  "Account security":
    "Use the official app or website and review your account security settings. Be cautious with unsolicited links or requests for account information. If something looks suspicious, use the official support flow.",
  "Verification":
    "Check the verification steps and document requirements shown in the official app. Make sure your information is accurate and submit documents only through the app’s official verification flow.",
};

const faqChatMainOptions = Object.keys(faqChatAnswers);

function addFaqChatMessage(text, from) {
  const message = document.createElement("p");
  message.className = "faq-chat-message";
  message.dataset.from = from;
  message.textContent = text;
  faqChatLog.append(message);
  faqChatLog.scrollTop = faqChatLog.scrollHeight;
}

function renderFaqChatOptions(labels) {
  faqChatOptions.replaceChildren();
  labels.forEach((label) => {
    if (label === "Browse help topics") {
      const link = document.createElement("a");
      link.className = "faq-chat-option faq-chat-option-link";
      link.href = "help.html";
      link.textContent = label;
      faqChatOptions.append(link);
      return;
    }
    const option = document.createElement("button");
    option.className = "faq-chat-option";
    option.type = "button";
    option.textContent = label;
    option.addEventListener("click", () => {
      addFaqChatMessage(label, "visitor");
      if (faqChatAnswers[label]) {
        addFaqChatMessage(faqChatAnswers[label], "assistant");
        renderFaqChatOptions(["Ask another question", "Browse help topics"]);
      } else if (label === "Ask another question") {
        addFaqChatMessage("Choose a topic and I’ll show a quick answer.", "assistant");
        renderFaqChatOptions(faqChatMainOptions);
      }
    });
    faqChatOptions.append(option);
  });
}

document.querySelectorAll("[data-open-chat]").forEach((trigger) => {
  trigger.setAttribute("aria-controls", "faq-chat-panel");
  trigger.setAttribute("aria-expanded", "false");
  trigger.addEventListener("click", () => {
    faqChatPanel.hidden = false;
    document.querySelectorAll("[data-open-chat]").forEach((item) =>
      item.setAttribute("aria-expanded", String(item === trigger)),
    );
    faqChatClose.focus();
  });
});

function closeFaqChat() {
  faqChatPanel.hidden = true;
  document.querySelectorAll("[data-open-chat]").forEach((item) =>
    item.setAttribute("aria-expanded", "false"),
  );
  document.querySelector("[data-open-chat]")?.focus();
}

faqChatClose.addEventListener("click", closeFaqChat);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !faqChatPanel.hidden) closeFaqChat();
});
renderFaqChatOptions(faqChatMainOptions);
