
let templates = {};
let currentTemplate = null;

async function loadTemplates() {
  const response = await fetch('templates.json');
  const data = await response.json();
  templates = data.templates;
  const select = document.getElementById('templateSelect');
  select.innerHTML = '';
  templates.forEach((tpl, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = tpl.name;
    select.appendChild(option);
  });
  select.addEventListener('change', () => {
    renderTemplate(parseInt(select.value));
  });
  renderTemplate(0);
}

function renderTemplate(index) {
  currentTemplate = JSON.parse(JSON.stringify(templates[index])); // deep copy
  const container = document.getElementById('tagGroupsContainer');
  container.innerHTML = '';
  for (const groupKey in currentTemplate.groups) {
    const group = currentTemplate.groups[groupKey];
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group';

    const label = document.createElement('div');
    label.className = 'group-label';
    label.textContent = group.label;
    groupDiv.appendChild(label);

    group.tags.forEach(tag => {
      const tagCheckbox = document.createElement('label');
      tagCheckbox.className = 'tag';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.prompt = tag.prompt;
      checkbox.dataset.type = tag.type;
      checkbox.addEventListener('change', updatePrompts);
      tagCheckbox.appendChild(checkbox);
      tagCheckbox.append(` ${tag.label}`);
      groupDiv.appendChild(tagCheckbox);
    });
    container.appendChild(groupDiv);
  }
  updatePrompts();
}

function updatePrompts() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const positive = [], negative = [];
  checkboxes.forEach(cb => {
    if (cb.checked) {
      if (cb.dataset.type === 'positive') positive.push(cb.dataset.prompt);
      else negative.push(cb.dataset.prompt);
    }
  });
  document.getElementById('positivePrompt').value = positive.join(', ');
  document.getElementById('negativePrompt').value = negative.join(', ');
}

function duplicateTemplate() {
  const newTemplate = JSON.parse(JSON.stringify(currentTemplate));
  newTemplate.name += '（複製）';
  templates.push(newTemplate);
  const select = document.getElementById('templateSelect');
  const option = document.createElement('option');
  option.value = templates.length - 1;
  option.textContent = newTemplate.name;
  select.appendChild(option);
  select.value = templates.length - 1;
  renderTemplate(templates.length - 1);
}

function saveTemplate() {
  const blob = new Blob([JSON.stringify({ templates: templates }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'templates.json';
  a.click();
}

loadTemplates();
