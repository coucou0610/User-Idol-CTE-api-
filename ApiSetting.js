/**
 * Idol Manager 设置界面
 * 用于配置 API 和预设
 */

(function () {
  "use strict";

  /**
   * 创建设置面板HTML
   */
  function createSettingsHTML() {
    if (!window.IdolApiService) {
      console.error("[IdolSettings] IdolApiService not loaded");
      return "<div style='color:red;padding:20px;'>API服务未加载，请刷新页面重试。</div>";
    }
    const config = window.IdolApiService.getApiConfig();
    const presets = window.IdolApiService.getPresets();
    const contextCount = window.IdolApiService.getContextCount();

    return `
            <div class="idol-settings-panel">
                <div class="idol-settings-header">
                    <h2>插件设置</h2>
                    <button class="idol-settings-close" onclick="window.IdolSettings.closeSettings()">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>

                <div class="idol-settings-content">
                    <!-- API 配置 -->
                    <div class="idol-settings-section idol-settings-api-section">
                        <h3><i class="fa-solid fa-plug"></i> API 配置</h3>
                        <div class="idol-settings-form">
                            <div class="idol-form-group">
                                <label>API 地址</label>
                                <input type="text" id="idol-api-url" value="${config.url || ""}" 
                                       placeholder="https://api.example.com/v1">
                            </div>
                            <div class="idol-form-group">
                                <label>API 密钥</label>
                                <div class="idol-api-key-row">
                                    <input type="password" id="idol-api-key" value="${config.key || ""}" 
                                           placeholder="sk-...">
                                    <button class="idol-btn idol-btn-secondary idol-fetch-models-btn" onclick="window.IdolSettings.fetchModels()">
                                        <i class="fa-solid fa-rotate"></i> 获取模型
                                    </button>
                                </div>
                            </div>
                            <div class="idol-form-group">
                                <label>模型名称</label>
                                <div class="idol-model-row">
                                    <input type="text" id="idol-api-model" value="${config.model || ""}" 
                                           placeholder="gpt-4" style="display:none">
                                    <select id="idol-model-select" class="idol-model-select" onchange="window.IdolSettings.onModelSelect()">
                                        <option value="${config.model || ""}">${config.model || "-- 点击获取模型 --"}</option>
                                    </select>
                                </div>
                                <small id="idol-model-status"></small>
                            </div>
                            <div class="idol-form-row">
                                <div class="idol-form-group">
                                    <label>Temperature</label>
                                    <input type="number" id="idol-api-temp" value="${config.temperature || 0.8}" 
                                           min="0" max="2" step="0.1">
                                </div>
                                <div class="idol-form-group">
                                    <label>Max Tokens</label>
                                    <input type="number" id="idol-api-tokens" value="${config.max_tokens || 2000}" 
                                           min="100" max="8000" step="100">
                                </div>
                            </div>
                            <button class="idol-btn idol-btn-primary" onclick="window.IdolSettings.saveApiConfig()">
                                <i class="fa-solid fa-save"></i> 保存 API 配置
                            </button>
                        </div>
                    </div>

                    <!-- 上下文配置 -->
                    <div class="idol-settings-section idol-settings-context-section">
                        <h3><i class="fa-solid fa-comments"></i> 上下文配置</h3>
                        <div class="idol-settings-form">
                            <div class="idol-form-group">
                                <label>读取消息数量</label>
                                <input type="number" id="idol-context-count" value="${contextCount}" 
                                       min="0" max="20" step="1">
                                <small>生成内容时读取最近的N条消息作为上下文（默认3条，0表示不读取）</small>
                            </div>
                            <button class="idol-btn idol-btn-primary" onclick="window.IdolSettings.saveContextCount()">
                                <i class="fa-solid fa-save"></i> 保存上下文配置
                            </button>
                        </div>
                    </div>

                    <!-- 预设配置 -->
                    <div class="idol-settings-section idol-settings-presets-section">
                        <h3><i class="fa-solid fa-file-lines"></i> 预设配置</h3>
                        <p style="font-size:12px; color:#888; margin:0 0 16px 0;">⚠️ 留空即使用内置默认预设，无需填写。仅在需要自定义时修改。</p>
                        
                        <!-- 通告预设 -->
                        <div class="idol-preset-block">
                            <h4>通告生成预设</h4>
                            <div class="idol-form-group">
                                <label>System Prompt</label>
                                <textarea id="idol-preset-contracts-system" rows="6" 
                                          placeholder="留空则使用内置默认预设。仅在需要自定义时填写，填写后将覆盖默认预设。">${presets.contracts.system || ""}</textarea>
                            </div>
                            <div class="idol-form-group">
                                <label>User Prompt</label>
                                <input type="text" id="idol-preset-contracts-user" 
                                       value="${presets.contracts.userPrompt || ""}"
                                       placeholder="请生成当前可用的通告列表">
                            </div>
                        </div>

                        <!-- 商店预设 -->
                        <div class="idol-preset-block">
                            <h4>商店生成预设</h4>
                            <div class="idol-form-group">
                                <label>System Prompt</label>
                                <textarea id="idol-preset-shop-system" rows="6" 
                                          placeholder="留空则使用内置默认预设。仅在需要自定义时填写，填写后将覆盖默认预设。">${presets.shop.system || ""}</textarea>
                            </div>
                            <div class="idol-form-group">
                                <label>User Prompt</label>
                                <input type="text" id="idol-preset-shop-user" 
                                       value="${presets.shop.userPrompt || ""}"
                                       placeholder="请生成当前商店的商品列表">
                            </div>
                        </div>

                        <!-- 日报预设 -->
                        <div class="idol-preset-block">
                            <h4>日报生成预设</h4>
                            <div class="idol-form-group">
                                <label>System Prompt</label>
                                <textarea id="idol-preset-news-system" rows="6" 
                                          placeholder="请输入日报生成的系统提示词...">${presets.news.system || ""}</textarea>
                            </div>
                            <div class="idol-form-group">
                                <label>User Prompt</label>
                                <input type="text" id="idol-preset-news-user" 
                                       value="${presets.news.userPrompt || ""}"
                                       placeholder="请生成今日的娱乐新闻快报">
                            </div>
                        </div>

                        <button class="idol-btn idol-btn-primary" onclick="window.IdolSettings.savePresets()">
                            <i class="fa-solid fa-save"></i> 保存所有预设
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * 获取可用模型列表
   */
  async function fetchModels() {
    const url = document.getElementById("idol-api-url").value.trim();
    const key = document.getElementById("idol-api-key").value.trim();
    const statusEl = document.getElementById("idol-model-status");
    const selectEl = document.getElementById("idol-model-select");
    const btn = document.querySelector(".idol-fetch-models-btn");

    if (!url || !key) {
      statusEl.textContent = "⚠️ 请先填写 API 地址和密钥";
      statusEl.style.color = "#f0a500";
      return;
    }

    // 规范化 base URL
    let baseUrl = url.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, "");

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 获取中...';
    statusEl.textContent = "";
    selectEl.style.display = "none";

    try {
      const res = await fetch(`${baseUrl}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const models = (data.data || data.models || [])
        .map((m) => (typeof m === "string" ? m : m.id))
        .filter(Boolean)
        .sort();

      if (models.length === 0) {
        throw new Error("未返回任何模型");
      }

      // 填充下拉列表
      selectEl.innerHTML = '<option value="">-- 选择模型 --</option>';
      const currentModel = document.getElementById("idol-api-model").value;
      models.forEach((id) => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = id;
        if (id === currentModel) opt.selected = true;
        selectEl.appendChild(opt);
      });

      selectEl.style.display = "block";
      document.getElementById("idol-api-model").style.display = "none";
      statusEl.textContent = `✅ 获取到 ${models.length} 个模型`;
      statusEl.style.color = "#4caf50";
    } catch (err) {
      statusEl.textContent = `❌ 获取失败，请手动输入模型名称`;
      statusEl.style.color = "#e94560";
      document.getElementById("idol-api-model").style.display = "block";
      selectEl.style.display = "none";
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-rotate"></i> 获取模型';
    }
  }

  /**
   * 下拉选择模型时同步到输入框
   */
  function onModelSelect() {
    const selectEl = document.getElementById("idol-model-select");
    const inputEl = document.getElementById("idol-api-model");
    if (selectEl.value) {
      inputEl.value = selectEl.value;
    }
  }

  /**
   * 显示设置面板
   */
  function showSettings() {
    const oldPanel = document.getElementById("idol-settings-overlay");
    if (oldPanel) oldPanel.remove();

    const overlay = document.createElement("div");
    overlay.id = "idol-settings-overlay";
    overlay.className = "idol-settings-overlay";
    overlay.innerHTML = createSettingsHTML();

    document.body.appendChild(overlay);

    // SillyTavern顶部栏偏移修正（与主面板相同逻辑）
    const panel = overlay.querySelector(".idol-settings-panel");
    if (panel) {
        const topBarHeight = 60;
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const panelH = Math.min(vh - topBarHeight - 20, panel.offsetHeight || 600);
        const panelW = Math.min(vw * 0.9, 800);
        const topPos = topBarHeight + Math.max(0, (vh - topBarHeight - 20 - panelH) / 2);
        const leftPos = Math.max(0, (vw - panelW) / 2);
        overlay.style.alignItems = "flex-start";
        overlay.style.justifyContent = "center";
        overlay.style.paddingTop = topPos + "px";
        panel.style.maxHeight = (vh - topPos - 20) + "px";
    }

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeSettings();
    });
  }

  /**
   * 在偶像系统主面板内渲染设置页
   */
  function renderSettings(container) {
    if (!container) return;
    const oldPanel = document.getElementById("idol-settings-overlay");
    if (oldPanel) oldPanel.remove();

    container.innerHTML = `
      <div class="idol-settings-inline">
        ${createSettingsHTML()}
      </div>
    `;
  }

  /**
   * 关闭设置面板
   */
  function closeSettings() {
    const overlay = document.getElementById("idol-settings-overlay");
    if (overlay) overlay.remove();
  }

  /**
   * 保存 API 配置
   */
  function saveApiConfig() {
    const config = {
      url: document.getElementById("idol-api-url").value.trim(),
      key: document.getElementById("idol-api-key").value.trim(),
      model: document.getElementById("idol-api-model").value.trim(),
      temperature:
        parseFloat(document.getElementById("idol-api-temp").value) || 0.8,
      max_tokens:
        parseInt(document.getElementById("idol-api-tokens").value) || 2000,
    };

    if (window.IdolApiService.saveApiConfig(config)) {
      alert("API 配置已保存！");
    } else {
      alert("保存失败，请重试");
    }
  }

  /**
   * 保存上下文配置
   */
  function saveContextCount() {
    const count =
      parseInt(document.getElementById("idol-context-count").value) || 3;

    if (window.IdolApiService.saveContextCount(count)) {
      alert("上下文配置已保存！");
    } else {
      alert("保存失败，请重试");
    }
  }

  /**
   * 保存预设配置
   */
  function savePresets() {
    const presets = {
      contracts: {
        name: "通告生成预设",
        system: document
          .getElementById("idol-preset-contracts-system")
          .value.trim(),
        userPrompt: document
          .getElementById("idol-preset-contracts-user")
          .value.trim(),
      },
      shop: {
        name: "商店生成预设",
        system: document.getElementById("idol-preset-shop-system").value.trim(),
        userPrompt: document
          .getElementById("idol-preset-shop-user")
          .value.trim(),
      },
      news: {
        name: "日报生成预设",
        system: document.getElementById("idol-preset-news-system").value.trim(),
        userPrompt: document
          .getElementById("idol-preset-news-user")
          .value.trim(),
      },
    };

    if (window.IdolApiService.savePresets(presets)) {
      alert("预设配置已保存！");
    } else {
      alert("保存失败，请重试");
    }
  }

  // ========== 导出到全局 ==========

  window.IdolSettings = {
    showSettings,
    renderSettings,
    closeSettings,
    saveApiConfig,
    saveContextCount,
    savePresets,
    fetchModels,
    onModelSelect,
  };

  console.info("[Idol Settings] 模块已加载");
})();
