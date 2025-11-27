document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
          const activityCard = document.createElement("div");
          activityCard.className = "activity-card";

          const spotsLeft = details.max_participants - details.participants.length;

          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;

          // Build participants section programmatically so we can attach delete handlers
          const participantsSection = document.createElement("div");
          participantsSection.className = "participants-section";
          const heading = document.createElement("h5");
          heading.textContent = "Signed Up:";
          participantsSection.appendChild(heading);

          const ul = document.createElement("ul");
          ul.className = "participants-list";

          if (details.participants.length > 0) {
            details.participants.forEach(p => {
              const li = document.createElement("li");
              const span = document.createElement("span");
              span.textContent = p;

              const btn = document.createElement("button");
              btn.className = "delete-btn";
              btn.title = `Unregister ${p}`;
              btn.type = "button";
              btn.innerHTML = "✖";

              btn.addEventListener("click", async () => {
                if (!confirm(`Remove ${p} from ${name}?`)) return;
                try {
                  const resp = await fetch(
                    `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                    { method: "DELETE" }
                  );

                  const result = await resp.json();

                  if (resp.ok) {
                    messageDiv.textContent = result.message;
                    messageDiv.className = "success";
                    messageDiv.classList.remove("hidden");
                    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
                    // Refresh activities to update counts
                    fetchActivities();
                  } else {
                    messageDiv.textContent = result.detail || "Failed to remove participant";
                    messageDiv.className = "error";
                    messageDiv.classList.remove("hidden");
                  }
                } catch (err) {
                  messageDiv.textContent = "Failed to remove participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                  console.error("Error removing participant", err);
                }
              });

              li.appendChild(span);
              li.appendChild(btn);
              ul.appendChild(li);
            });
          } else {
            const li = document.createElement("li");
            li.innerHTML = "<em>No participants yet</em>";
            ul.appendChild(li);
          }

          participantsSection.appendChild(ul);
          activityCard.appendChild(participantsSection);

          activitiesList.appendChild(activityCard);

          // Add option to select dropdown
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so UI shows the newly registered participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
