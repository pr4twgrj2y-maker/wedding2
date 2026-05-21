const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 初始化数据
function initializeData() {
  if (!fs.existsSync(DATA_FILE)) {
    const today = new Date();
    const defaultWeddingDate = new Date(today);
    defaultWeddingDate.setDate(defaultWeddingDate.getDate() + 128);

    const initialState = {
      weddingDate: defaultWeddingDate.toISOString().slice(0, 10),
      totalBudget: 180000,
      tasks: [
        { id: uid(), title: "确认酒店桌数和最低消费", category: "酒店", due: "本周", done: false },
        { id: uid(), title: "约 2 家婚庆看方案", category: "婚庆", due: "3 天内", done: false },
        { id: uid(), title: "整理 20 张喜欢的现场布置图", category: "灵感", due: "今晚", done: true },
        { id: uid(), title: "问摄影档期和双机报价", category: "摄影", due: "明天", done: false },
      ],
      vendors: [
        {
          id: uid(),
          type: "酒店",
          name: "湖畔宴会厅",
          style: "白绿韩系",
          contact: "林经理 / 138****8821",
          wechat: "hotel-lin",
          quote: 68000,
          deposit: 10000,
          final: 58000,
          signed: true,
          depositPaid: true,
          package: "A 厅 20 桌起 / 含基础灯光音响",
          outfit: "白绿仪式区 / 香槟色桌布",
          schedule: "试菜待约，合同已归档",
          note: "合同、菜单、场地图都放这里",
        },
      ],
      expenses: [
        { id: uid(), category: "酒店", item: "宴席定金", amount: 10000, paid: true },
        { id: uid(), category: "婚庆", item: "方案预估", amount: 18000, paid: false },
      ],
      guests: [
        { id: uid(), name: "张阿姨", side: "女方亲戚", count: 2, attending: true, gift: 0, seat: "待排" },
      ],
      inspirations: [
        {
          id: uid(),
          title: "韩系白绿",
          tag: "现场",
          note: "白绿花艺，暖光蜡烛，香槟色桌布",
          colors: ["#f7f4ec", "#dbe7dc", "#a9bfae"],
          image: "",
          height: 320,
          palette: "白绿",
          keywords: ["韩系极简", "白绿花艺", "暖光", "自然"],
        },
      ],
      profiles: [
        {
          id: uid(),
          person: "新娘",
          weight: "48.5 kg",
          outfit: "晨袍 / 秀禾 / 主纱 / 敬酒服",
          makeup: "韩系清透，底妆干净，眼妆不要浓",
          fitting: "主纱已试，敬酒服待定",
          grooming: "美甲、胸贴、美瞳、饰品待购买",
          note: "试妆当天带主纱照片和手捧花参考图",
        },
      ],
      flow: [
        { id: uid(), title: "接亲", detail: "红包、游戏道具、摄影跟拍" },
        { id: uid(), title: "敬茶", detail: "茶具、父母胸花、摄影机位" },
      ],
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(initialState, null, 2));
  }
}

// 工具函数
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadState() {
  if (!fs.existsSync(DATA_FILE)) {
    initializeData();
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

// API 路由

// 获取完整状态
app.get('/api/state', (req, res) => {
  try {
    const state = loadState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 保存状态
app.post('/api/state', (req, res) => {
  try {
    saveState(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增任务
app.post('/api/tasks', (req, res) => {
  try {
    const state = loadState();
    const newTask = {
      id: uid(),
      done: false,
      ...req.body,
    };
    state.tasks.unshift(newTask);
    saveState(state);
    res.json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新任务
app.put('/api/tasks/:id', (req, res) => {
  try {
    const state = loadState();
    const task = state.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    Object.assign(task, req.body);
    saveState(state);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除任务
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const state = loadState();
    state.tasks = state.tasks.filter((t) => t.id !== req.params.id);
    saveState(state);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增商家
app.post('/api/vendors', (req, res) => {
  try {
    const state = loadState();
    const newVendor = {
      id: uid(),
      signed: false,
      depositPaid: false,
      ...req.body,
    };
    state.vendors.unshift(newVendor);
    saveState(state);
    res.json(newVendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增支出
app.post('/api/expenses', (req, res) => {
  try {
    const state = loadState();
    const newExpense = {
      id: uid(),
      ...req.body,
    };
    state.expenses.unshift(newExpense);
    saveState(state);
    res.json(newExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增宾客
app.post('/api/guests', (req, res) => {
  try {
    const state = loadState();
    const newGuest = {
      id: uid(),
      attending: true,
      ...req.body,
    };
    state.guests.unshift(newGuest);
    saveState(state);
    res.json(newGuest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增灵感
app.post('/api/inspirations', (req, res) => {
  try {
    const state = loadState();
    const newInspo = {
      id: uid(),
      ...req.body,
    };
    state.inspirations.unshift(newInspo);
    saveState(state);
    res.json(newInspo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新婚礼日期
app.put('/api/wedding-date', (req, res) => {
  try {
    const state = loadState();
    state.weddingDate = req.body.weddingDate;
    saveState(state);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新总预算
app.put('/api/budget', (req, res) => {
  try {
    const state = loadState();
    state.totalBudget = req.body.totalBudget;
    saveState(state);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除通用路由
app.delete('/api/:type/:id', (req, res) => {
  try {
    const state = loadState();
    const { type, id } = req.params;
    const typeMap = {
      vendors: 'vendors',
      expenses: 'expenses',
      guests: 'guests',
      inspirations: 'inspirations',
      profiles: 'profiles',
      flow: 'flow',
    };
    
    if (typeMap[type] && state[typeMap[type]]) {
      state[typeMap[type]] = state[typeMap[type]].filter((item) => item.id !== id);
      saveState(state);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid type' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 初始化数据并启动服务
initializeData();
app.listen(PORT, () => {
  console.log(`婚礼准备系统运行在 http://localhost:${PORT}`);
  console.log(`前端: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
