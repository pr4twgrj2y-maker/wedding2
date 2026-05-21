const yuan = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

let state = {};
let activeInspoFilter = "全部";
let activeVendorCompareType = "全部";
const dialog = document.querySelector("#quick-dialog");
const form = document.querySelector("#quick-form");
const dialogTitle = document.querySelector("#dialog-title");
const dialogFields = document.querySelector("#dialog-fields");

// API 基础 URL
const API_BASE = '/api';

// 初始化
async function initialize() {
  await loadStateFromServer();
  render();
  
  window.setTimeout(() => {
    document.querySelector("#splash-screen")?.classList.add("is-hidden");
  }, 3200);
}

// 从服务器加载状态
async function loadStateFromServer() {
  try {
    const response = await fetch(`${API_BASE}/state`);
    state = await response.json();
  } catch (error) {
    console.error('加载状态失败:', error);
  }
}

// 保存状态到服务器
async function saveStateToServer() {
  try {
    await fetch(`${API_BASE}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch (error) {
    console.error('保存状态失败:', error);
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function money(value) {
  return yuan.format(Number(value || 0));
}

function analyzeInspiration(item) {
  const text = `${item.title || ""} ${item.tag || ""} ${item.note || ""}`.toLowerCase();
  let palette = "奶油白";
  let colors = ["#fffaf4", "#e7ded2", "#b8945f"];
  const keywords = new Set(["AI分析", "婚礼灵感"]);

  if (text.includes("绿") || text.includes("森") || text.includes("自然")) {
    palette = "白绿";
    colors = ["#f7f4ec", "#dbe7dc", "#91a996"];
    ["韩系", "白绿花艺", "自然", "低饱和"].forEach((word) => keywords.add(word));
  }
  if (text.includes("香槟") || text.includes("金") || text.includes("暖光")) {
    palette = "香槟金";
    colors = ["#fff8ec", "#e8d4b6", "#b8945f"];
    ["暖光", "香槟色", "精致", "蜡烛感"].forEach((word) => keywords.add(word));
  }
  if (text.includes("粉") || text.includes("玫瑰") || text.includes("花")) {
    palette = "玫瑰粉";
    colors = ["#fff4f1", "#e9b7ae", "#b76f6a"];
    ["柔和", "花艺", "浪漫", "空气感"].forEach((word) => keywords.add(word));
  }
  if (text.includes("红") || text.includes("避雷") || text.includes("不要")) {
    ["避雷", "不要大红", "控制饱和度"].forEach((word) => keywords.add(word));
  }
  if (text.includes("礼服") || text.includes("纱")) keywords.add("礼服参考");
  if (text.includes("车")) keywords.add("车队款式");

  return { palette, colors, keywords: Array.from(keywords).slice(0, 6) };
}

function render() {
  saveStateToServer();
  renderHeader();
  renderRecommendations();
  renderTasks();
  renderVendors();
  renderBudget();
  renderGuests();
  renderInspirations();
  renderProfiles();
  renderFlow();
}

function renderHeader() {
  const target = new Date(`${state.weddingDate}T00:00:00`);
  const diff = Math.max(0, Math.ceil((target - new Date()) / 86400000));
  const tasksTotal = state.tasks?.length || 0;
  const tasksDone = state.tasks?.filter((task) => task.done).length || 0;
  const progress = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const spent = state.expenses?.filter((item) => item.paid).reduce((sum, item) => sum + Number(item.amount), 0) || 0;
  const projected = state.expenses?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

  document.querySelector("#wedding-date-label").textContent = state.weddingDate.replaceAll("-", ".");
  document.querySelector("#days-left").textContent = diff;
  document.querySelector("#progress-percent").textContent = `${progress}%`;
  document.querySelector("#progress-count").textContent = `${tasksDone}/${tasksTotal}`;
  document.querySelector("#progress-bar").style.width = `${progress}%`;
  document.querySelector("#spent-total").textContent = money(spent);
  document.querySelector("#budget-btn").textContent = money(state.totalBudget);
  document.querySelector("#budget-alert").textContent =
    projected > state.totalBudget
      ? `按当前报价会超出 ${money(projected - state.totalBudget)}`
      : `预计还剩 ${money(state.totalBudget - projected)} 可安排`;

  const urgent = state.tasks?.find((task) => !task.done);
  document.querySelector("#urgent-line").textContent = urgent
    ? `最紧急：${urgent.title}`
    : "今天可以安心休息一下。";
}

function renderRecommendations() {
  const signedHotel = state.vendors?.some((vendor) => vendor.type?.includes("酒店") && vendor.signed);
  const unsignedVendors = state.vendors?.filter((vendor) => !vendor.signed).length || 0;
  const guestCount = state.guests?.reduce((sum, guest) => sum + Number(guest.count), 0) || 0;
  const ideas = [];

  if (signedHotel) ideas.push("确定桌数和备桌规则");
  if (unsignedVendors) ideas.push(`还有 ${unsignedVendors} 个商家没签约`);
  if (state.vendors?.some((vendor) => vendor.type === "接亲车队" && !vendor.signed)) ideas.push("车队路线和超时费还没锁");
  if (guestCount < 80) ideas.push("继续补宾客名单");
  if (state.inspirations?.length < 10) ideas.push("把截图集中丢进灵感墙");
  ideas.push("每周复盘一次尾款日期");

  document.querySelector("#recommendations").innerHTML = ideas
    .slice(0, 5)
    .map((item) => `<span class="chip">✓ ${item}</span>`)
    .join("");
}

function renderTasks() {
  document.querySelector("#task-list").innerHTML = (state.tasks || [])
    .map(
      (task) => `
        <article class="task-item">
          <input type="checkbox" ${task.done ? "checked" : ""} data-action="toggle-task" data-id="${task.id}" />
          <div>
            <p class="task-title">${escapeHtml(task.title)}</p>
            <p class="task-meta">${escapeHtml(task.category)} · ${escapeHtml(task.due)}</p>
          </div>
          <button class="danger-btn" data-action="delete-task" data-id="${task.id}" title="删除">×</button>
        </article>
      `,
    )
    .join("");
}

function renderVendors() {
  const vendorTypes = ["全部", ...new Set(state.vendors?.map((vendor) => vendor.type) || [])];
  document.querySelector("#vendor-filters").innerHTML = vendorTypes
    .map(
      (type) =>
        `<button class="mini-pill ${type === activeVendorCompareType ? "active" : ""}" data-action="filter-vendor-type" data-type="${escapeHtml(type)}">${escapeHtml(type)}</button>`,
    )
    .join("") + `<button class="primary-btn compact add-inline-btn" id="add-vendor-btn">+ 新商家</button>`;

  renderVendorComparison();

  document.querySelector("#vendor-grid").innerHTML = (state.vendors || [])
    .map(
      (vendor) => `
        <article class="vendor-card">
          <div class="vendor-top">
            <div>
              <p class="eyebrow">${escapeHtml(vendor.type)}</p>
              <h3>${escapeHtml(vendor.name)}</h3>
            </div>
            <span class="status ${vendor.signed ? "" : "pending"}">${vendor.signed ? "已签约" : "待确认"}</span>
          </div>
          <div class="vendor-price">${money(vendor.quote)}</div>
          <dl>
            <dt>风格</dt><dd>${escapeHtml(vendor.style)}</dd>
            <dt>款式</dt><dd>${escapeHtml(vendor.outfit)}</dd>
            <dt>定金</dt><dd>${money(vendor.deposit)}</dd>
            <dt>尾款</dt><dd>${money(vendor.final)}</dd>
            <dt>微信</dt><dd>${escapeHtml(vendor.wechat)}</dd>
            <dt>联系</dt><dd>${escapeHtml(vendor.contact)}</dd>
            <dt>备注</dt><dd>${escapeHtml(vendor.note)}</dd>
          </dl>
          <div class="card-actions">
            <button class="ghost-btn compact" data-action="view-vendor" data-id="${vendor.id}">详情</button>
            <button class="ghost-btn compact" data-action="toggle-vendor-sign" data-id="${vendor.id}">${vendor.signed ? "取消签约" : "标记签约"}</button>
            <button class="danger-btn" data-action="delete-vendor" data-id="${vendor.id}" title="删除">×</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function getComparedVendors() {
  return activeVendorCompareType === "全部"
    ? state.vendors || []
    : state.vendors?.filter((vendor) => vendor.type === activeVendorCompareType) || [];
}

function renderVendorComparison() {
  const vendors = getComparedVendors();
  const comparison = document.querySelector("#vendor-comparison");
  if (!vendors.length) {
    comparison.innerHTML = "<p class=\"muted\">这个分类还没有商家。</p>";
    return;
  }

  const quotes = vendors.map((vendor) => Number(vendor.quote || 0));
  const lowest = Math.min(...quotes);
  const highest = Math.max(...quotes);
  const average = Math.round(quotes.reduce((sum, value) => sum + value, 0) / quotes.length);
  const unpaidFinal = vendors.reduce((sum, vendor) => sum + (vendor.signed ? Number(vendor.final || 0) : 0), 0);
  const cheapest = vendors.find((vendor) => Number(vendor.quote || 0) === lowest);

  comparison.innerHTML = `
    <div class="compare-summary">
      <div><span>对比范围</span><strong>${escapeHtml(activeVendorCompareType)}</strong></div>
      <div><span>最低报价</span><strong>${money(lowest)}</strong></div>
      <div><span>最高报价</span><strong>${money(highest)}</strong></div>
      <div><span>平均报价</span><strong>${money(average)}</strong></div>
      <div><span>已签尾款</span><strong>${money(unpaidFinal)}</strong></div>
    </div>
    <div class="compare-alert">
      当前最省：<strong>${escapeHtml(cheapest?.name || "-")}</strong>。价格低不等于最合适，重点看套餐范围、超时费、原片/成片交付和备注里没问清楚的部分。
    </div>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th>商家</th>
            <th>类型</th>
            <th>报价</th>
            <th>微信</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          ${vendors
            .map((vendor) => {
              const quote = Number(vendor.quote || 0);
              const isLowest = quote === lowest;
              return `
                <tr class="${isLowest ? "best-row" : ""}">
                  <td><button class="link-btn" data-action="view-vendor" data-id="${vendor.id}">${escapeHtml(vendor.name)}</button></td>
                  <td><button class="type-btn" data-action="filter-vendor-type" data-type="${escapeHtml(vendor.type)}">${escapeHtml(vendor.type)}</button></td>
                  <td><strong>${money(quote)}</strong></td>
                  <td>${escapeHtml(vendor.wechat)}</td>
                  <td>
                    <span class="table-status ${vendor.signed ? "" : "pending"}">${vendor.signed ? "已签" : "待定"}</span>
                    <p class="risk-note">${escapeHtml(getVendorRisk(vendor))}</p>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getVendorRisk(vendor) {
  const risks = [];
  if (!vendor.signed) risks.push("未签约");
  if (!vendor.depositPaid) risks.push("定金未付");
  if ((vendor.package || "").includes("待补充")) risks.push("套餐缺失");
  if ((vendor.schedule || "").includes("待确认")) risks.push("档期待确认");
  if (vendor.type === "接亲车队") risks.push("确认超时/停车/高速费");
  return risks.length ? risks.join("、") : "暂无明显风险";
}

function openVendorDetail(vendor) {
  dialogTitle.textContent = `${vendor.type}详情`;
  dialogFields.innerHTML = `
    <div class="vendor-modal">
      <div>
        <p class="eyebrow">${escapeHtml(vendor.type)}</p>
        <h3>${escapeHtml(vendor.name)}</h3>
        <div class="detail-price">${money(vendor.quote)}</div>
      </div>
      <div class="detail-grid">
        <span>套餐</span><strong>${escapeHtml(vendor.package)}</strong>
        <span>款式</span><strong>${escapeHtml(vendor.outfit)}</strong>
        <span>档期</span><strong>${escapeHtml(vendor.schedule)}</strong>
        <span>定金</span><strong>${money(vendor.deposit)} · ${vendor.depositPaid ? "已付" : "未付"}</strong>
        <span>尾款</span><strong>${money(vendor.final)}</strong>
        <span>微信</span><strong>${escapeHtml(vendor.wechat)}</strong>
        <span>联系</span><strong>${escapeHtml(vendor.contact)}</strong>
        <span>风险</span><strong>${escapeHtml(getVendorRisk(vendor))}</strong>
      </div>
      <p class="detail-note">${escapeHtml(vendor.note)}</p>
    </div>
  `;
  form.onsubmit = (event) => {
    event.preventDefault();
    dialog.close();
  };
  dialog.showModal();
}

function renderBudget() {
  document.querySelector("#expense-list").innerHTML = (state.expenses || [])
    .map(
      (expense) => `
        <article class="expense-item">
          <span class="status ${expense.paid ? "" : "pending"}">${expense.paid ? "已付" : "未付"}</span>
          <div>
            <p class="task-title">${escapeHtml(expense.item)}</p>
            <p class="task-meta">${escapeHtml(expense.category)} · ${money(expense.amount)}</p>
          </div>
          <button class="danger-btn" data-action="delete-expense" data-id="${expense.id}" title="删除">×</button>
        </article>
      `,
    )
    .join("");

  const byCategory = (state.expenses || []).reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});

  document.querySelector("#category-summary").innerHTML = Object.entries(byCategory)
    .map(([category, total]) => `<div class="summary-row"><span>${escapeHtml(category)}</span><strong>${money(total)}</strong></div>`)
    .join("");
}

function renderGuests() {
  const guestTotal = state.guests?.reduce((sum, guest) => sum + Number(guest.count), 0) || 0;
  const giftTotal = state.guests?.reduce((sum, guest) => sum + Number(guest.gift), 0) || 0;
  document.querySelector("#guest-total").textContent = guestTotal;
  document.querySelector("#table-total").textContent = Math.ceil(guestTotal / 10);
  document.querySelector("#gift-total").textContent = money(giftTotal);
  document.querySelector("#guest-table").innerHTML = (state.guests || [])
    .map(
      (guest) => `
        <tr>
          <td>${escapeHtml(guest.name)}</td>
          <td>${escapeHtml(guest.side)}</td>
          <td>${guest.count}</td>
          <td>${guest.attending ? "是" : "待定"}</td>
          <td>${money(guest.gift)}</td>
          <td>${escapeHtml(guest.seat)}</td>
          <td><button class="danger-btn" data-action="delete-guest" data-id="${guest.id}" title="删除">×</button></td>
        </tr>
      `,
    )
    .join("");
}

function renderInspirations() {
  const inspirations = activeInspoFilter === "全部"
    ? state.inspirations || []
    : state.inspirations?.filter((item) => item.palette === activeInspoFilter || item.keywords?.includes(activeInspoFilter)) || [];

  document.querySelectorAll("[data-action='filter-inspo']").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === activeInspoFilter);
  });

  document.querySelector("#inspiration-wall").innerHTML = inspirations
    .map(
      (item) => `
        <article class="inspo-card" style="--accent:${item.colors?.[0] || '#fff'}; --pin-h:${item.height || 300}px">
          <div class="pin-image">
            ${
              item.image
                ? `<img src="${item.image}" alt="${escapeHtml(item.title)}" />`
                : `<div class="pin-placeholder">${escapeHtml(item.palette || "AI")}</div>`
            }
          </div>
          <div class="inspo-tag-row">
            <span class="status">${escapeHtml(item.tag)}</span>
            <div class="swatch">${(item.colors || []).map((color) => `<i style="--c:${color}"></i>`).join("")}</div>
          </div>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="card-meta">${escapeHtml(item.note)}</p>
            <div class="keyword-row">${(item.keywords || []).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}</div>
          </div>
          <button class="danger-btn" data-action="delete-inspo" data-id="${item.id}" title="删除">×</button>
        </article>
      `,
    )
    .join("");
}

function renderProfiles() {
  document.querySelector("#couple-grid").innerHTML = (state.profiles || [])
    .map(
      (profile) => `
        <article class="profile-card">
          <div class="profile-head">
            <div>
              <p class="eyebrow">${escapeHtml(profile.person)}</p>
              <h3>${escapeHtml(profile.person)}管理</h3>
            </div>
            <span class="status">体重 ${escapeHtml(profile.weight)}</span>
          </div>
          <div class="profile-list">
            <div><span>服装</span><strong>${escapeHtml(profile.outfit)}</strong></div>
            <div><span>妆容</span><strong>${escapeHtml(profile.makeup)}</strong></div>
            <div><span>试穿</span><strong>${escapeHtml(profile.fitting)}</strong></div>
            <div><span>细节</span><strong>${escapeHtml(profile.grooming)}</strong></div>
          </div>
          <p class="detail-note">${escapeHtml(profile.note)}</p>
          <button class="danger-btn" data-action="delete-profile" data-id="${profile.id}" title="删除">×</button>
        </article>
      `,
    )
    .join("");
}

function renderFlow() {
  document.querySelector("#flow-list").innerHTML = (state.flow || [])
    .map(
      (step, index) => `
        <article class="flow-item">
          <span class="drag-handle">${index + 1}</span>
          <div>
            <p class="task-title">${escapeHtml(step.title)}</p>
            <p class="task-meta">${escapeHtml(step.detail)}</p>
          </div>
          <div class="flow-actions">
            <button data-action="move-flow" data-dir="-1" data-id="${step.id}" title="上移">↑</button>
            <button data-action="move-flow" data-dir="1" data-id="${step.id}" title="下移">↓</button>
          </div>
          <button class="danger-btn" data-action="delete-flow" data-id="${step.id}" title="删除">×</button>
        </article>
      `,
    )
    .join("");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || !file.size) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function openForm(title, fields, onSubmit) {
  dialogTitle.textContent = title;
  dialogFields.innerHTML = `<div class="field-grid">${fields
    .map((field) => {
      const common = `name="${field.name}" ${field.required ? "required" : ""}`;
      if (field.type === "select") {
        return `<label>${field.label}<select ${common}>${field.options
          .map((option) => `<option value="${option.value}">${option.label}</option>`)
          .join("")}</select></label>`;
      }
      if (field.type === "file") return `<label>${field.label}<input type="file" accept="image/*" ${common} /></label>`;
      if (field.type === "textarea") return `<label>${field.label}<textarea ${common}></textarea></label>`;
      return `<label>${field.label}<input type="${field.type || "text"}" ${common} value="${field.value || ""}" /></label>`;
    })
    .join("")}</div>`;

  form.onsubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    for (const field of fields) {
      if (field.type === "file") {
        data[field.name] = await readFileAsDataUrl(formData.get(field.name));
      }
    }
    onSubmit(data);
    dialog.close();
    form.reset();
    render();
  };

  dialog.showModal();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action], .nav-item, #add-task-btn, #add-vendor-btn, #add-expense-btn, #add-guest-btn, #add-inspo-btn, #add-profile-item-btn, #add-step-btn, #edit-date-btn, #budget-btn");
  if (!target) return;

  if (target.classList.contains("nav-item")) {
    document.querySelectorAll(".nav-item, .view").forEach((item) => item.classList.remove("active"));
    target.classList.add("active");
    document.querySelector(`#view-${target.dataset.view}`).classList.add("active");
    return;
  }

  const action = target.dataset.action;
  const id = target.dataset.id;

  if (target.id === "edit-date-btn") {
    openForm("修改婚礼日期", [{ label: "婚礼日期", name: "date", type: "date", required: true, value: state.weddingDate }], (data) => {
      state.weddingDate = data.date;
    });
  }

  if (target.id === "budget-btn") {
    openForm("修改总预算", [{ label: "总预算", name: "budget", type: "number", required: true, value: state.totalBudget }], (data) => {
      state.totalBudget = Number(data.budget);
    });
  }

  if (target.id === "add-task-btn") {
    openForm(
      "新增待办",
      [
        { label: "事项", name: "title", required: true },
        { label: "分类", name: "category", value: "婚庆" },
        { label: "截止时间", name: "due", value: "本周" },
      ],
      (data) => state.tasks.unshift({ id: uid(), done: false, ...data }),
    );
  }

  if (target.id === "add-vendor-btn") {
    openForm(
      "新增商家",
      [
        { label: "类型", name: "type", required: true, value: "摄影" },
        { label: "商家名", name: "name", required: true },
        { label: "风格", name: "style" },
        { label: "联系方式 / 链接", name: "contact" },
        { label: "商家微信", name: "wechat" },
        { label: "报价", name: "quote", type: "number", value: 0 },
        { label: "定金", name: "deposit", type: "number", value: 0 },
        { label: "尾款", name: "final", type: "number", value: 0 },
        { label: "套餐 / 服务范围", name: "package", type: "textarea" },
        { label: "款式 / 风格细节", name: "outfit", type: "textarea" },
        { label: "档期 / 试妆 / 路线", name: "schedule", type: "textarea" },
        { label: "备注", name: "note", type: "textarea" },
      ],
      (data) =>
        state.vendors.unshift({
          id: uid(),
          ...data,
          quote: Number(data.quote),
          deposit: Number(data.deposit),
          final: Number(data.final),
          signed: false,
          depositPaid: false,
        }),
    );
  }

  if (target.id === "add-expense-btn") {
    openForm(
      "新增预算",
      [
        { label: "分类", name: "category", required: true },
        { label: "项目", name: "item", required: true },
        { label: "金额", name: "amount", type: "number", required: true },
        {
          label: "状态",
          name: "paid",
          type: "select",
          options: [
            { label: "未付", value: "false" },
            { label: "已付", value: "true" },
          ],
        },
      ],
      (data) => state.expenses.unshift({ id: uid(), ...data, amount: Number(data.amount), paid: data.paid === "true" }),
    );
  }

  if (target.id === "add-guest-btn") {
    openForm(
      "新增宾客",
      [
        { label: "姓名 / 分组", name: "name", required: true },
        { label: "关系", name: "side", value: "朋友" },
        { label: "人数", name: "count", type: "number", value: 1 },
        { label: "红包", name: "gift", type: "number", value: 0 },
        { label: "座位", name: "seat", value: "待排" },
      ],
      (data) => state.guests.unshift({ id: uid(), ...data, count: Number(data.count), gift: Number(data.gift), attending: true }),
    );
  }

  if (target.id === "add-inspo-btn") {
    openForm(
      "新增灵感",
      [
        { label: "标题", name: "title", required: true },
        { label: "上传图片", name: "image", type: "file" },
        { label: "分类", name: "tag", value: "现场" },
        { label: "备注", name: "note", type: "textarea" },
      ],
      (data) => {
        const analysis = analyzeInspiration(data);
        state.inspirations.unshift({
          id: uid(),
          ...data,
          ...analysis,
          height: 250 + Math.floor(Math.random() * 180),
        });
      },
    );
  }

  if (target.id === "add-profile-item-btn") {
    openForm(
      "新增个人记录",
      [
        {
          label: "对象",
          name: "person",
          type: "select",
          options: [
            { label: "新娘", value: "新娘" },
            { label: "新郎", value: "新郎" },
          ],
        },
        { label: "体重 / 尺寸", name: "weight", value: "待记录" },
        { label: "服装", name: "outfit", type: "textarea" },
        { label: "妆容 / 发型", name: "makeup", type: "textarea" },
        { label: "试穿 / 量体", name: "fitting", type: "textarea" },
        { label: "配饰 / 细节", name: "grooming", type: "textarea" },
        { label: "备注", name: "note", type: "textarea" },
      ],
      (data) => state.profiles.unshift({ id: uid(), ...data }),
    );
  }

  if (target.id === "add-step-btn") {
    openForm(
      "新增流程",
      [
        { label: "流程名", name: "title", required: true },
        { label: "展开事项", name: "detail", type: "textarea" },
      ],
      (data) => state.flow.push({ id: uid(), ...data }),
    );
  }

  if (action === "toggle-task") {
    const task = state.tasks.find((item) => item.id === id);
    task.done = !task.done;
    render();
  }

  if (action === "filter-inspo") {
    activeInspoFilter = target.dataset.filter;
    renderInspirations();
  }

  if (action === "filter-vendor-type") {
    activeVendorCompareType = target.dataset.type;
    renderVendors();
  }

  if (action === "view-vendor") {
    const vendor = state.vendors.find((item) => item.id === id);
    if (vendor) openVendorDetail(vendor);
  }

  if (action === "toggle-vendor-sign") {
    const vendor = state.vendors.find((item) => item.id === id);
    vendor.signed = !vendor.signed;
    render();
  }

  if (action === "toggle-vendor-deposit") {
    const vendor = state.vendors.find((item) => item.id === id);
    vendor.depositPaid = !vendor.depositPaid;
    render();
  }

  if (action?.startsWith("delete-")) {
    const key = {
      "delete-task": "tasks",
      "delete-vendor": "vendors",
      "delete-expense": "expenses",
      "delete-guest": "guests",
      "delete-inspo": "inspirations",
      "delete-profile": "profiles",
      "delete-flow": "flow",
    }[action];
    state[key] = state[key].filter((item) => item.id !== id);
    render();
  }

  if (action === "move-flow") {
    const index = state.flow.findIndex((item) => item.id === id);
    const next = index + Number(target.dataset.dir);
    if (next >= 0 && next < state.flow.length) {
      [state.flow[index], state.flow[next]] = [state.flow[next], state.flow[index]];
      render();
    }
  }
});

// 初始化应用
initialize();
