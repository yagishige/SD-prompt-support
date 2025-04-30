
let templates = {};
let currentTemplate = null;
let currentTemplateName = '';
let editingGroupId = null;
let editingTagContext = null;

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
  const response = await fetch(`./templates/${name}.json`);
  const data = await response.json();
  currentTemplate = data;
  currentTemplateName = name;
  renderGroups();
}

function renderGroups() {
  const container = document.getElementById('groupContainer');
  container.innerHTML = '';

  currentTemplate.groups.forEach((group, index) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group';
    groupDiv.dataset.groupId = group.id;

    const header = document.createElement('div');
    header.className = 'group-header';

    header.innerHTML = `
      <strong>${group.label}</strong>
      <div>
        <button onclick="openGroupEditModal('${group.id}')">編集</button>
        <button onclick="deleteGroup('${group.id}')">削除</button>
        <button onclick="addTag('${group.id}')">タグ追加</button>
      </div>`;

    groupDiv.appendChild(header);

    const tagContainer = document.createElement('div');
    tagContainer.id = `tags-${group.id}`;

    group.tags.forEach(tag => {
      const tagElem = createTagElement(group.id, tag);
      tagContainer.appendChild(tagElem);
    });

    groupDiv.appendChild(tagContainer);
    container.appendChild(groupDiv);
  });

  Sortable.create(container, {
    animation: 150,
    onEnd: () => {
      const newOrder = [...container.children].map(el => el.dataset.groupId);
      currentTemplate.groups.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
    }
  });
}

function openGroupEditModal(groupId) {
  editingGroupId = groupId;
  const group = currentTemplate.groups.find(g => g.id === groupId);
  document.getElementById('groupEditName').value = group.label;
  document.getElementById('groupModal').classList.remove('hidden');
}

function confirmGroupEdit() {
  const name = document.getElementById('groupEditName').value.trim();
  if (name && editingGroupId) {
    const group = currentTemplate.groups.find(g => g.id === editingGroupId);
    group.label = name;
    closeModal('groupModal');
    renderGroups();
  }
}

function addGroup() {
  const id = 'group' + Date.now();
  currentTemplate.groups.push({ id, label: '新しいグループ', tags: [] });
  renderGroups();
}

function deleteGroup(groupId) {
  if (confirm('このグループを削除してよろしいですか？')) {
    currentTemplate.groups = currentTemplate.groups.filter(g => g.id !== groupId);
    renderGroups();
  }
}

function createTagElement(groupId, tag) {
  const span = document.createElement('span');
  span.className = 'tag';
  span.textContent = tag.label;
  span.dataset.prompt = tag.prompt;
  span.dataset.type = tag.type;
  span.dataset.groupId = groupId;

  span.addEventListener('click', () => {
    span.classList.toggle('selected');
    if (span.classList.contains('selected')) {
      addToPromptList(tag.prompt, tag.type, 1.0);
    } else {
      removeFromPromptList(tag.prompt, tag.type);
    }
  });

  let pressTimer;
  span.addEventListener('mousedown', (e) => {
    pressTimer = setTimeout(() => {
      openTagEditModal(groupId, tag);
    }, 600);
  });
  span.addEventListener('mouseup', () => clearTimeout(pressTimer));
  span.addEventListener('mouseleave', () => clearTimeout(pressTimer));

  return span;
}

function openTagEditModal(groupId, tag) {
  editingTagContext = { groupId, tag };
  document.getElementById('tagEditLabel').value = tag.label;
  document.getElementById('tagEditPrompt').value = tag.prompt;
  document.getElementById('tagEditType').value = tag.type;
  document.getElementById('tagModal').classList.remove('hidden');
}

function confirmTagEdit() {
  const { groupId, tag } = editingTagContext;
  tag.label = document.getElementById('tagEditLabel').value.trim();
  tag.prompt = document.getElementById('tagEditPrompt').value.trim();
  tag.type = document.getElementById('tagEditType').value;
  closeModal('tagModal');
  renderGroups();
}

function deleteTag() {
  const { groupId, tag } = editingTagContext;
  const group = currentTemplate.groups.find(g => g.id === groupId);
  group.tags = group.tags.filter(t => t !== tag);
  closeModal('tagModal');
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

function addToPromptList(prompt, type, weight) {
  const li = document.createElement('li');
  li.dataset.prompt = prompt;
  li.dataset.weight = weight;
  li.textContent = prompt;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = "0.0";
  slider.max = "3.0";
  slider.step = "0.1";
  slider.value = weight;
  slider.className = 'weight-slider';
  slider.addEventListener('input', () => {
    li.dataset.weight = slider.value;
    updateOutput();
  });

  li.appendChild(slider);

  if (type === 'positive') {
    document.getElementById('positivePromptList').appendChild(li);
  } else {
    document.getElementById('negativePromptList').appendChild(li);
  }
  updateOutput();
}

function removeFromPromptList(prompt, type) {
  const list = (type === 'positive') ? document.getElementById('positivePromptList') : document.getElementById('negativePromptList');
  [...list.children].forEach(li => {
    if (li.dataset.prompt === prompt) {
      list.removeChild(li);
    }
  });
  updateOutput();
}

function updateOutput() {
  const positives = [...document.getElementById('positivePromptList').children];
  const negatives = [...document.getElementById('negativePromptList').children];

  const positivePrompts = positives.map(li => formatPrompt(li.dataset.prompt, li.dataset.weight));
  const negativePrompts = negatives.map(li => formatPrompt(li.dataset.prompt, li.dataset.weight));

  const output = positivePrompts.join(', ') + (negativePrompts.length ? " --neg " + negativePrompts.join(', ') : '');
  document.getElementById('outputPrompt').value = output;
}

function formatPrompt(prompt, weight) {
  return (parseFloat(weight) === 1.0) ? prompt : `(${prompt}:${weight})`;
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
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

new Sortable(positivePromptList, { animation: 150, onSort: updateOutput });
new Sortable(negativePromptList, { animation: 150, onSort: updateOutput });
