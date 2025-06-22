// src/utils/cvGenerator.js
import cvTemplateHtml from "../cv-template.html?raw"; // Import your HTML template as a raw string

/**
 * Helper function to safely get nested values from an object.
 * @param {object} obj - The object to traverse.
 * @param {string} path - The dot-separated path to the nested value (e.g., "contact_info.email").
 * @returns {any} The nested value, or undefined if not found.
 */
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Helper function to check if a string is a valid URL.
 * @param {string} str - The string to check.
 * @returns {boolean} True if the string is a valid URL, false otherwise.
 */
const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Fills the HTML template with the parsed CV data.
 * @param {Object} cvData - The structured JSON data from the LLM.
 * @returns {string} The fully populated HTML string.
 */
export const fillHtmlTemplate = (cvData) => {
  if (!cvData) {
    console.error("No CV data provided to fill the template.");
    return "";
  }

  let filledHtml = cvTemplateHtml;

  // --- 1. Fill all placeholders (single and nested) ---
  // This regex finds all {{key}} or {{nested.key}} patterns.
  filledHtml = filledHtml.replace(/\{\{(.*?)\}\}/g, (match, path) => {
    const value = getNestedValue(cvData, path);
    // Return empty string for undefined, null, or empty string values, otherwise the value itself.
    return value !== undefined && value !== null && value !== "" ? value : "";
  });

  // --- 2. Handle conditional rendering for optional sections ({{#if key}}...{{/if}}) ---
  // This now uses getNestedValue to check conditions, supporting nested paths.
  filledHtml = filledHtml.replace(
    /\{\{#if (.*?)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, path, content) => {
      const value = getNestedValue(cvData, path);
      // A section is included if its value is truthy and, if an array, is not empty.
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
  if (!experienceItemsHtml.trim()) {
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
      if (skillsTagsHtml) {
        // Only return category HTML if there are actual skills
        return `
        <div class="skills-category-group">
            <h3>${category.category_name || ""}</h3>
            <div class="skills-grid">
                ${skillsTagsHtml}
            </div>
        </div>
      `;
      }
      return "";
    }
  );
  filledHtml = filledHtml.replace(
    "<!-- SKILLS_CATEGORIES_PLACEHOLDER -->",
    skillsCategoriesHtml
  );
  // Conditionally remove the entire skills section if no categories or no skills within categories
  if (!skillsCategoriesHtml.trim()) {
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
  if (!educationItemsHtml.trim()) {
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

    // Handle project_url: if it's a valid URL, make it a link; otherwise, display as plain text.
    const projectUrlContent = item.project_url
      ? isValidUrl(item.project_url)
        ? `<a href="${
            item.project_url
          }" target="_blank" class="text-indigo-600 hover:text-indigo-700 hover:underline text-sm inline-flex items-center space-x-1 mt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-2"><path d="M15 11h5a2 2 0 0 1 0 4h-5"/><path d="M9 11H4a2 2 0 0 0 0 4h5"/><path d="M8 12h8"/></svg>
                  <span>${
                    item.project_url.length > 30
                      ? item.project_url.substring(0, 27) + "..."
                      : item.project_url
                  }</span>
              </a>` // Truncate long URLs
        : `<span class="text-gray-600 text-sm inline-flex items-center space-x-1 mt-2">${item.project_url}</span>`
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
          ${projectUrlContent}
      </div>
    `;
  });
  filledHtml = filledHtml.replace(
    "<!-- PROJECTS_ITEMS_PLACEHOLDER -->",
    projectsItemsHtml
  );
  // Conditionally remove the entire projects section if no items
  if (!projectsItemsHtml.trim()) {
    filledHtml = filledHtml.replace(
      /<!-- START_SECTION:projects -->[\s\S]*?<!-- END_SECTION:projects -->/g,
      ""
    );
  }

  // Handle profile_summary section conditional rendering based on its content
  if (!cvData.profile_summary || cvData.profile_summary.trim() === "") {
    filledHtml = filledHtml.replace(
      /<!-- START_SECTION:profile_summary_section -->[\s\S]*?<!-- END_SECTION:profile_summary_section -->/g,
      ""
    );
  }

  return filledHtml;
};
