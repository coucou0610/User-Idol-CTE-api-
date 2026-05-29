/**
 * Idol Manager 独立 API 服务
 * 用于调用独立配置的 AI API 生成通告、商店、日报等内容
 */

(function () {
  "use strict";

  // ========== 配置管理 ==========

  const STORAGE_KEYS = {
    API_CONFIG: "idol_manager_api_config",
    PRESETS: "idol_manager_presets",
    CONTEXT_COUNT: "idol_manager_context_count",
  };

  /**
   * 获取API配置
   */
  function getApiConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("[Idol API] 读取API配置失败:", e);
    }

    return {
      url: "",
      key: "",
      model: "",
      temperature: 0.8,
      max_tokens: 2000,
    };
  }

  /**
   * 保存API配置
   */
  function saveApiConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(config));
      console.info("[Idol API] API配置已保存");
      return true;
    } catch (e) {
      console.error("[Idol API] 保存API配置失败:", e);
      return false;
    }
  }

  /**
   * 获取上下文读取数量
   */
  function getContextCount() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTEXT_COUNT);
      return stored ? parseInt(stored) : 3;
    } catch (e) {
      return 3;
    }
  }

  /**
   * 保存上下文读取数量
   */
  function saveContextCount(count) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTEXT_COUNT, count.toString());
      return true;
    } catch (e) {
      console.error("[Idol API] 保存上下文数量失败:", e);
      return false;
    }
  }

  /**
   * 获取预设配置
   */
  function getPresets() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("[Idol API] 读取预设失败:", e);
    }

    // 默认预设（留空，用户自行填写）
    return {
      contracts: {
        name: "通告生成预设",
        system: "",
        userPrompt: "请生成当前可用的通告列表",
      },
      shop: {
        name: "商店生成预设",
        system: "",
        userPrompt: "请生成当前商店的商品列表",
      },
      news: {
        name: "日报生成预设",
        system: "",
        userPrompt: "请生成今日的娱乐新闻快报",
      },
    };
  }

  /**
   * 保存预设配置
   */
  function savePresets(presets) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
      console.info("[Idol API] 预设已保存");
      return true;
    } catch (e) {
      console.error("[Idol API] 保存预设失败:", e);
      return false;
    }
  }

  // ========== 上下文读取 ==========

  /**
   * 获取聊天上下文
   * @param {number} count - 读取的消息数量
   * @returns {Array} 消息列表
   */
  function getChatContext(count) {
    let context = window.SillyTavern ? window.SillyTavern.getContext() : null;
    if (!context || !context.chat) {
      console.warn("[Idol API] 无法获取聊天上下文");
      return [];
    }

    const chat = context.chat;
    const messages = [];

    // 从最新消息开始，向前读取指定数量
    const startIndex = Math.max(0, chat.length - count);
    for (let i = startIndex; i < chat.length; i++) {
      const msg = chat[i];
      if (msg && msg.mes) {
        messages.push({
          role: msg.is_user ? "user" : "assistant",
          content: msg.mes,
        });
      }
    }

    console.info(`[Idol API] 读取了 ${messages.length} 条上下文消息`);
    return messages;
  }

  // ========== API 调用 ==========

  let currentAbortController = null;

  /**
   * 终止当前请求
   */
  function abortCurrentRequest() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
      console.info("[Idol API] 请求已终止");
    }
  }

  /**
   * 构建完整的 API URL
   * @param {string} baseUrl - 基础 URL
   * @returns {string} 完整的 API URL
   */
  function buildApiUrl(baseUrl) {
    // 移除末尾的斜杠
    baseUrl = baseUrl.trim().replace(/\/+$/, "");

    // 如果已经包含 /chat/completions，直接返回
    if (baseUrl.endsWith("/chat/completions")) {
      return baseUrl;
    }

    // 如果以 /v1 结尾，添加 /chat/completions
    if (baseUrl.endsWith("/v1")) {
      return baseUrl + "/chat/completions";
    }

    // 如果不包含 /v1，添加 /v1/chat/completions
    if (!baseUrl.includes("/v1")) {
      return baseUrl + "/v1/chat/completions";
    }

    // 其他情况，直接添加 /chat/completions
    return baseUrl + "/chat/completions";
  }

  /**
   * 调用 AI API
   * @param {string} type - 类型 (contracts/shop/news)
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Object>} 响应结果
   */
  async function callAiApi(type, onProgress) {
    const config = getApiConfig();

    // 检查配置
    if (!config.url || !config.key || !config.model) {
      return {
        success: false,
        error: "请先配置 API 信息（URL、Key、Model）",
      };
    }

    // 构建完整的 API URL
    const apiUrl = buildApiUrl(config.url);
    console.info(`[Idol API] 使用 API 地址: ${apiUrl}`);

    const presets = getPresets();
    const preset = presets[type];

    if (!preset || !preset.system) {
      return {
        success: false,
        error: `请先配置 ${preset?.name || type} 的预设内容`,
      };
    }

    // 构建消息列表
    const messages = [];

    // 添加系统提示
    if (preset.system) {
      messages.push({
        role: "system",
        content: preset.system,
      });
    }

    // 添加上下文
    const contextCount = getContextCount();
    const contextMessages = getChatContext(contextCount);
    messages.push(...contextMessages);

    // 添加用户提示
    if (preset.userPrompt) {
      messages.push({
        role: "user",
        content: preset.userPrompt,
      });
    }

    console.info(`[Idol API] 开始调用 ${type} API, 消息数: ${messages.length}`);

    // 创建 AbortController
    currentAbortController = new AbortController();

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.key}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature || 0.8,
          max_tokens: config.max_tokens || 2000,
          stream: false,
        }),
        signal: currentAbortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 请求失败: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // 提取内容
      let content = "";
      if (data.choices && data.choices[0] && data.choices[0].message) {
        content = data.choices[0].message.content;
      } else if (data.message && data.message.content) {
        content = data.message.content;
      } else {
        throw new Error("无法解析 API 响应");
      }

      console.info(`[Idol API] ${type} 生成成功, 内容长度: ${content.length}`);

      return {
        success: true,
        content: content,
        type: type,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        console.info("[Idol API] 请求被用户终止");
        return {
          success: false,
          error: "请求已终止",
        };
      }

      // 检查是否是 CORS 错误
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        console.error("[Idol API] 网络错误或 CORS 问题:", error);
        return {
          success: false,
          error: `网络连接失败。可能的原因：\n1. API 地址不正确（当前: ${apiUrl}）\n2. API 服务器未响应\n3. CORS 跨域限制（需要 API 服务器支持跨域请求）\n\n请检查：\n- API 地址是否正确\n- 网络连接是否正常\n- API 服务是否支持浏览器直接访问`,
        };
      }

      console.error("[Idol API] API 调用失败:", error);
      return {
        success: false,
        error: error.message || "未知错误",
      };
    } finally {
      currentAbortController = null;
    }
  }

  // ========== 导出到全局 ==========

  window.IdolApiService = {
    // 配置管理
    getApiConfig,
    saveApiConfig,
    getContextCount,
    saveContextCount,

    // 预设管理
    getPresets,
    savePresets,

    // API 调用
    callAiApi,
    abortCurrentRequest,

    // 上下文
    getChatContext,
  };

  console.info("[Idol API Service] 模块已加载");
})();
