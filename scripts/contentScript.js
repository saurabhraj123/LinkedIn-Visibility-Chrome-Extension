// global variables
let csrfToken = "";

// icons
const dragIcon = chrome.runtime.getURL("assets/drag.png");
const publicIcon = chrome.runtime.getURL("assets/public.png");
const privateIcon = chrome.runtime.getURL("assets/private.png");
const privateCharacteristicsIcon = chrome.runtime.getURL(
  "assets/private_characteristics.png"
);

// HTML as a string for draggable options with icons
const htmlContent = `
  <div
    id="visibility-control"
    style="visibility: hidden; width: 60px; position: fixed; top: calc(50% - 127px); left: 0; z-index: 1000; background: white; border: 1px solid #ccc; border-radius: 8px;"
  >
    <div
      id="drag-handle"
      style="cursor: grab; padding: 15px; padding-bottom: 0px; text-align: center; border-radius: 5px; font-weight: bold;"
    >
      <img
        src="${dragIcon}"
        style="width: 30px; height: 30px; pointer-events: none;"
      />
    </div>
    <div
      id="options"
      style="display: flex; flex-direction: column; gap: 4px; padding-bottom: 15px"
    >
      <div
        class="option"
        id="public-option"
        style="margin: 5px; cursor: pointer; display: flex; align-items: center; border-radius: 5px;  padding: 8px 10px;"
      >
        <img
          src="${publicIcon}"
          alt="Public Icon"
          style="width: 30px; height: 30px;"
        />
        <div class="customTooltip">
              <div>Public</div>
              <div>Your full name and headline will be visible when you view someone’s profile.</div>
        </div>
      </div>
      <div
        class="option"
        id="private-option"
        style="margin: 5px; cursor: pointer; display: flex; align-items: center; border-radius: 5px; padding: 8px 10px;"
      >
        <img
          src="${privateIcon}"
          alt="Private Icon"
          style="width: 30px; height: 30px;"
        />
        <div class="customTooltip">
              <div>Private</div>
              <div>Your profile will remain completely anonymous when you view other profiles. No identifying details will be shown.</div>
        </div>
      </div>
      <div
        class="option"
        id="anonymous"
        style="margin: 5px; cursor: pointer; display: flex; align-items: center; border-radius: 5px; padding: 8px 10px;"
      >
        <img
          src="${privateCharacteristicsIcon}"
          alt="Unlisted Icon"
          style="width: 30px; height: 30px;"
        />
        <div class="customTooltip">
           <div>Anonymous</div>
          <div>Only general characteristics (such as industry and title) will be visible when you view a profile. Your name remains hidden.</div>
        </div>
        </div>
      </div>
    </div>
  </div>
`;

// Create a div element and insert the HTML content into it
const div = document.createElement("div");
div.innerHTML = htmlContent;

// Append the new div to the body of the page
document.body.appendChild(div);

const body = {
  value: "DISCLOSE_FULL",
  settingDisplayType: "RADIO",
  entityUrn: "urn:li:settingEntity:300101",
  key: "discloseAsProfileViewer",
  hasChild: false,
};

function highlightSelectedOption(selectedId) {
  const options = document.querySelectorAll(".option");

  options.forEach((option) => {
    option.style.background = "";
  });

  const selectedOption = document.getElementById(selectedId);
  if (selectedOption?.style) selectedOption.style.background = "aliceblue";
}

function updateVisibility(value) {
  const body = {
    value, // DISCLOSE_FULL, DISCLOSE_ANONYMOUS, HIDE
    settingDisplayType: "RADIO",
    entityUrn: "urn:li:settingEntity:300101",
    key: "discloseAsProfileViewer",
    hasChild: false,
  };

  fetch(
    "https://www.linkedin.com/mysettings-api/settingsApiSettings/discloseAsProfileViewer",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Csrf-Token": csrfToken,
        "X-Restli-Protocol-Version": "2.0.0", // specify the version of LinkedIn’s RESTful API protocol that your request adheres to
      },
      body: JSON.stringify(body),
      credentials: "include", // Include cookies for authentication
    }
  )
    .then((response) => {
      // Check if the status code is not OK
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    })
    .then(() => {
      // Update the UI only if the request was successful
      const idMap = {
        DISCLOSE_FULL: "public-option",
        DISCLOSE_ANONYMOUS: "anonymous",
        HIDE: "private-option",
      };

      highlightSelectedOption(idMap[value]);
    })
    .catch((error) => {
      alert("Profile visibility is not changed. Something went wrong.");
    });
}

// Add event listeners for options
document.getElementById("public-option").addEventListener("click", () => {
  updateVisibility("DISCLOSE_FULL");
});

document.getElementById("private-option").addEventListener("click", () => {
  updateVisibility("HIDE");
});

document.getElementById("anonymous").addEventListener("click", () => {
  updateVisibility("DISCLOSE_ANONYMOUS");
});

// Add draggable functionality
let dragElement = document.getElementById("visibility-control");
let dragHandle = document.getElementById("drag-handle");

dragHandle.onmousedown = function (e) {
  let offsetX = e.clientX - dragElement.getBoundingClientRect().left;
  let offsetY = e.clientY - dragElement.getBoundingClientRect().top;

  document.onmousemove = function (e) {
    dragElement.style.left = e.clientX - offsetX + "px";
    dragElement.style.top = e.clientY - offsetY + "px";
  };

  e.preventDefault(); // to avoid text selections

  document.onmouseup = function () {
    document.onmousemove = null;
    document.onmouseup = null;

    console.log({ top: dragElement.style.top, left: dragElement.style.left });

    chrome.storage.local.set({
      position: {
        top: dragElement.style.top,
        left: dragElement.style.left,
      },
    });
  };
};

// // Style tooltips to show on hover
let tooltips = document.querySelectorAll(".customTooltip");
tooltips.forEach((customTooltip) => {
  customTooltip.style.display = "none";
  customTooltip.style.position = "absolute";
  customTooltip.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  customTooltip.style.color = "white";
  customTooltip.style.padding = "5px";
  customTooltip.style.borderRadius = "5px";
  customTooltip.style.fontSize = "12px";
  customTooltip.style.width = "200px";
});

document.querySelectorAll(".option").forEach((option) => {
  option.addEventListener("mouseover", (e) => {
    const customTooltip = option.querySelector(".customTooltip");
    if (customTooltip) {
      customTooltip.style.display = "block";

      const tooltipWidth = customTooltip.offsetWidth;
      const optionLeft = dragElement.offsetLeft;
      const optionWidth = option.offsetWidth;
      const screenWidth = window.innerWidth;

      // If the tooltip overflows the screen's right edge, position it to the left
      if (optionLeft + optionWidth + tooltipWidth + 10 > screenWidth) {
        customTooltip.style.left = -1 * tooltipWidth - 5 + "px"; // Position to the left of the option
      } else {
        customTooltip.style.left = optionWidth + 15 + "px"; // Position to the right of the option
      }

      customTooltip.style.top = option.offsetTop + "px";
    }
  });

  option.addEventListener("mouseout", (e) => {
    const customTooltip = option.querySelector(".customTooltip");
    if (customTooltip) customTooltip.style.display = "none";
  });
});

function setContainerPosition() {
  chrome.storage.local.get("position", (result) => {
    if (result.position) {
      const { top, left } = result.position;
      dragElement.style.top = top || "76px"; // Default position if no stored value
      dragElement.style.left = left || "20px"; // Default position if no stored value
    }
    dragElement.style.visibility = "visible";
  });
}

window.onload = () => {
  chrome.runtime.sendMessage({ action: "getCsrfToken" }, (response) => {
    setContainerPosition();

    if (response && response.csrfToken) {
      csrfToken = response.csrfToken;
    }

    fetch(
      "https://www.linkedin.com/mysettings-api/settingsApiSettingCards/profileViewingOptions",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Csrf-Token": csrfToken,
          "X-Restli-Protocol-Version": "2.0.0", // specify the version of LinkedIn’s RESTful API protocol that your request adheres to
        },
      }
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        if (data) {
          const selectedValue = data.settings[0].settingDisplayValues.find(
            (option) => option.selected
          )?.value;

          const idMap = {
            DISCLOSE_FULL: "public-option",
            DISCLOSE_ANONYMOUS: "anonymous",
            HIDE: "private-option",
          };

          highlightSelectedOption(idMap[selectedValue]);
        }
      })
      .catch((err) => {});
  });
};
