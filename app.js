let templates = {};
let currentTemplate = null;
let currentTemplateName = '';

async function loadTemplateList() {
  const response = await fetch('./templates/template_list.json');
  const data = await response.json();
  const select = document.getElementById('templateSelect');
  select.innerHTML = '';

  data.templates.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    loadTemplate(select.value);
  });

  if (data.templates.length > 0) {
    loadTemplate(data.templates[0]);
  }
}

async function loadTemplate(name) {
  const response = await fetch(`templates/${name}.json`);
  const data = await response.json();
  currentTemplate = data;
  currentTemplateName = name;
  renderGroups();
}

function renderGroups() {
  const container = document.getElementById('groupContainer');
  container.innerHTML = '';

  for (const group of currentTemplate.groups) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group';

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `<strong>${group.label}</strong> 
      <button onclick="addTag('${group.id}')">タグ追加</button>
      <button onclick="deleteGroup('${group.id}')">グループ削除</button>`;
    groupDiv.appendChild(header);

    const tagContainer = document.createElement('div');
    tagContainer.id = `tags-${group.id}`;

    for (const tag of group.tags) {
      const tagElem = createTagElement(group.id, tag);
      tagContainer.appendChild(tagElem);
    }

    groupDiv.appendChild(tagContainer);
    container.appendChild(groupDiv);
  }

  updatePrompts();
}

function createTagElement(groupId, tag) {
  const span = document.createElement('span');
  span.className = 'tag';
  span.textContent = tag.label;
  span.dataset.prompt = tag.prompt;
  span.dataset.type = tag.type;
  span.addEventListener('click', () => {
    span.classList.toggle('selected');
    updatePrompts();
  });
  return span;
}

function updatePrompts() {
  const positive = [];
  const negative = [];

  document.querySelectorAll('.tag.selected').forEach(tag => {
    if (tag.dataset.type === 'positive') {
      positive.push(tag.dataset.prompt);
    } else {
      negative.push(tag.dataset.prompt);
    }
  });

  document.getElementById('positivePrompt').value = positive.join(', ');
  document.getElementById('negativePrompt').value = negative.join(', ');
}

function addGroup() {
  const label = prompt('新しいグループ名を入力してください:');
  if (label) {
    const id = 'group' + Date.now();
    currentTemplate.groups.push({ id, label, tags: [] });
    renderGroups();
  }
}

function deleteGroup(groupId) {
  currentTemplate.groups = currentTemplate.groups.filter(g => g.id !== groupId);
  renderGroups();
}

function addTag(groupId) {
  const label = prompt('タグの表示名を入力してください:');
  const promptText = prompt('プロンプトに追加する英語テキストを入力してください:');
  const type = confirm('正のプロンプトですか？（OKなら正／キャンセルならネガティブ）') ? 'positive' : 'negative';
  if (label && promptText) {
    const group = currentTemplate.groups.find(g => g.id === groupId);
    group.tags.push({ label, prompt: promptText, type });
    renderGroups();
  }
}

function duplicateTemplate() {
  const name = prompt('新しいテンプレート名を入力してください:');
  if (name) {
    const newTemplate = JSON.parse(JSON.stringify(currentTemplate));
    currentTemplate = newTemplate;
    currentTemplateName = name;
    renderGroups();
    alert('テンプレートを複製しました。保存してください。');
  }
}

function saveTemplate() {
  const blob = new Blob([JSON.stringify(currentTemplate, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${currentTemplateName}.json`;
  a.click();
}

loadTemplateList();
