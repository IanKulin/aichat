// Code block copy functionality
export function addCopyButtonsToCodeBlocks() {
  const codeBlocks = document.querySelectorAll(
    ".message.assistant pre:not(.copy-button-added)"
  );

  codeBlocks.forEach((pre) => {
    // Mark this code block as processed
    pre.classList.add("copy-button-added");

    // Create wrapper div if it doesn't exist
    if (!pre.parentElement.classList.contains("code-block-wrapper")) {
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentElement.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
    }

    // Create copy button
    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.textContent = "Copy";
    copyButton.setAttribute("aria-label", "Copy code to clipboard");

    // Add click handler
    copyButton.addEventListener("click", async () => {
      try {
        const codeElement = pre.querySelector("code");
        const textToCopy = codeElement
          ? codeElement.textContent
          : pre.textContent;

        await navigator.clipboard.writeText(textToCopy);

        // Visual feedback
        const originalText = copyButton.textContent;
        copyButton.textContent = "Copied!";
        copyButton.classList.add("copied");

        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.classList.remove("copied");
        }, 2000);
      } catch (err) {
        // Fallback for older browsers or when clipboard API fails
        console.warn("Failed to copy to clipboard:", err);

        // Try older method
        try {
          const textArea = document.createElement("textarea");
          const codeElement = pre.querySelector("code");
          textArea.value = codeElement
            ? codeElement.textContent
            : pre.textContent;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);

          // Visual feedback
          const originalText = copyButton.textContent;
          copyButton.textContent = "Copied!";
          copyButton.classList.add("copied");

          setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.classList.remove("copied");
          }, 2000);
        } catch (fallbackErr) {
          // If all else fails, show error feedback
          const originalText = copyButton.textContent;
          copyButton.textContent = "Failed";

          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        }
      }
    });

    // Add button to wrapper
    pre.parentElement.appendChild(copyButton);
  });
}
