// src/utils/cvGenerator.js
import cvTemplateHtml from "../cv-template.html?raw"; // Import your HTML template as a raw string

/**
 * Fills the HTML template with the parsed CV data.
 * @param {Object} cvData - The structured JSON data from the LLM.
 * @returns {string} The fully populated HTML string.
 */
export const fillHtmlTemplate = (cvData) => {
  if (!cvData) {
    console.error("No CV data provided to fill the template.");
    return ""; // Return empty string or handle error as appropriate
  }

  let filledHtml = cvTemplateHtml; // Start with the imported HTML template string

  // --- 1. Fill single placeholders (e.g., {{name}}, {{title}}) ---
  const singlePlaceholders = [
    "name",
    "title",
    "email",
    "phone",
    "linkedin_url",
    "github_url",
    "website_url",
    "location",
    "profile_summary",
  ];
  singlePlaceholders.forEach((key) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g"); // Regex for {{key}}
    filledHtml = filledHtml.replace(placeholder, cvData[key] || "");
  });

  // --- 2. Handle conditional rendering for optional links (e.g., {{#if github_url}}...{{/if}}) ---
  // This uses a regex to find {{#if key}}...{{/if}} blocks and replaces them conditionally.
  // The content inside the if block needs to be HTML safe.
  filledHtml = filledHtml.replace(
    /\{\{#if (.*?)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, key, content) => {
      const value = cvData[key];
      // Check if the key exists and its value is truthy (not null, undefined, false, 0, or empty string/array)
      if (value) {
        if (Array.isArray(value) && value.length === 0) {
          return ""; // If it's an empty array, hide the section
        }
        return content; // Include content if key exists and has a truthy value
      }
      return ""; // Otherwise, remove the content
    }
  );

  // --- 3. Fill repeatable sections and handle conditional section rendering ---

  // Helper function to process an array of items and generate their HTML
  const processItems = (items, itemTemplateGenerator) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return ""; // Return empty string if no items
    }
    return items.map((item) => itemTemplateGenerator(item)).join("");
  };

  // EXPERIENCE ITEMS
  const experienceItemsHtml = processItems(cvData.experience_items, (item) => {
    const responsibilitiesHtml =
      item.responsibilities && Array.isArray(item.responsibilities)
        ? item.responsibilities.map((resp) => `<li>${resp}</li>`).join("")
        : "";
    return `
      <div class="experience-item">
          <h3 class="text-lg font-semibold text-gray-800">${
            item.job_title || ""
          }</h3>
          <p class="text-sm text-gray-600">${item.company || ""} ${
      item.location ? `| ${item.location}` : ""
    }</p>
          <p class="text-sm text-gray-500 italic mb-2">${item.dates || ""}</p>
          <ul class="bullet-list text-gray-700 text-base">
              ${responsibilitiesHtml}
          </ul>
      </div>
    `;
  });
  filledHtml = filledHtml.replace(
    "<!-- EXPERIENCE_ITEMS_PLACEHOLDER -->",
    experienceItemsHtml
  );
  // Conditionally remove the entire experience section if no items
  if (!experienceItemsHtml) {
    filledHtml = filledHtml.replace(
      /<!-- START_SECTION:experience -->[\s\S]*?<!-- END_SECTION:experience -->/g,
      ""
    );
  }

  // SKILLS CATEGORIES
  const skillsCategoriesHtml = processItems(
    cvData.skills_categories,
    (category) => {
      const skillsTagsHtml =
        category.skills && Array.isArray(category.skills)
          ? category.skills.map((skill) => `<span>${skill}</span>`).join("")
          : "";
      // Only return category HTML if there are actual skills
      if (skillsTagsHtml) {
        return `
        <div class="skills-category-group">
            <h3>${category.category_name || ""}</h3>
            <div class="skills-grid">
                ${skillsTagsHtml}
            </div>
        </div>
      `;
      }
      return ""; // Do not render category if no skills
    }
  );
  filledHtml = filledHtml.replace(
    "<!-- SKILLS_CATEGORIES_PLACEHOLDER -->",
    skillsCategoriesHtml
  );
  // Conditionally remove the entire skills section if no categories or no skills within categories
  if (!skillsCategoriesHtml.trim()) {
    // Use .trim() as it might contain just whitespace if no categories had skills
    filledHtml = filledHtml.replace(
      /<!-- START_SECTION:skills -->[\s\S]*?<!-- END_SECTION:skills -->/g,
      ""
    );
  }

  // EDUCATION ITEMS
  const educationItemsHtml = processItems(cvData.education_items, (item) => {
    return `
      <div class="education-item">
          <h3 class="text-lg font-semibold text-gray-800">${
            item.degree || ""
          }</h3>
          <p class="text-sm text-gray-600">${item.institution || ""} ${
      item.location ? `| ${item.location}` : ""
    }</p>
          <p class="text-sm text-gray-500 italic">${item.dates || ""}</p>
          ${
            item.notes
              ? `<p class="text-base text-gray-700 mt-1">${item.notes}</p>`
              : ""
          }
      </div>
    `;
  });
  filledHtml = filledHtml.replace(
    "<!-- EDUCATION_ITEMS_PLACEHOLDER -->",
    educationItemsHtml
  );
  // Conditionally remove the entire education section if no items
  if (!educationItemsHtml) {
    filledHtml = filledHtml.replace(
      /<!-- START_SECTION:education -->[\s\S]*?<!-- END_SECTION:education -->/g,
      ""
    );
  }

  // PROJECTS ITEMS
  const projectsItemsHtml = processItems(cvData.project_items, (item) => {
    const descriptionHtml =
      item.description && Array.isArray(item.description)
        ? item.description.map((desc) => `<li>${desc}</li>`).join("")
        : "";
    return `
      <div class="project-item">
          <h3 class="text-lg font-semibold text-gray-800">${
            item.project_name || ""
          }</h3>
          <p class="text-sm text-gray-500 italic mb-2">${item.dates || ""}</p>
          <ul class="bullet-list text-gray-700 text-base">
              ${descriptionHtml}
          </ul>
          ${
            item.project_url
              ? `
            <a href="${item.project_url}" target="_blank" class="text-indigo-600 hover:text-indigo-700 hover:underline text-sm inline-flex items-center space-x-1 mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-2"><path d="M15 11h5a2 2 0 0 1 0 4h-5"/><path d="M9 11H4a2 2 0 0 0 0 4h5"/><path d="M8 12h8"/></svg>
                <span>View Project</span>
            </a>`
              : ""
          }
      </div>
    `;
  });
  filledHtml = filledHtml.replace(
    "<!-- PROJECTS_ITEMS_PLACEHOLDER -->",
    projectsItemsHtml
  );
  // Conditionally remove the entire projects section if no items
  if (!projectsItemsHtml) {
    filledHtml = filledHtml.replace(
      /<!-- START_SECTION:projects -->[\s\S]*?<!-- END_SECTION:projects -->/g,
      ""
    );
  }

  return filledHtml;
};
