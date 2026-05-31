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

    // 默认预设
    return {
      contracts: {
        name: "通告生成预设",
        system: '当用户请求"查看通告"、"刷新通告"、"刷新项目"、"刷新通告"或剧情推进到需要展示新的工作机会时，请严格按照以下格式生成通告列表。\n\n生成规则\n每种通告类别（影视、唱片、舞台、综艺、广告）必须包含 2-3 个通告。\n必须在整个列表的开头和结尾使用 <contracts> 和 </contracts> 标签包裹。\n内部每条通告必须使用方括号 [] 包裹，并用竖线 | 分隔字段。\n内容需符合娱乐圈背景。\n数值合理化，至少有一个通告匹配user的数值。\n数据格式\n<contracts>\n[通告｜通告类别｜项目名｜公司｜工作性质｜属性要求｜酬劳｜拍摄周期｜截止日期｜内容说明]\n[通告｜通告类别｜项目名｜公司｜工作性质｜属性要求｜酬劳｜拍摄周期｜截止日期｜内容说明]\n...\n</contracts>\n\n字段说明\n通告类别：仅限以下五种：\n电影电视剧 / Movie & TV series\n唱片 / Music\n舞台 / Stage (注意：仅指idol唱跳舞台、打歌节目、拼盘演唱会等。绝对禁止生成话剧、音乐剧、戏剧等"剧"类内容)\n综艺 / Variety show\n广告 / Ad\n\n项目名：\n舞台类示例：《人气歌谣》打歌舞台、MAMA颁奖礼特别舞台、草莓音乐节压轴表演。\n其他类示例：《VOGUE》银十封面、《奔跑吧》特别季。\n公司：万城娱乐、盛华集团、全球影业、索尼音乐、环球音乐、华纳音乐、大西洋唱片、电视台（如京港，M-net, PSTV，芒果台）、主办方、品牌方等。\n\n工作性质：\n舞台类：主打歌首秀、Special Stage、嘉宾。\n其他类：主角、配角、品牌代言人、广告模特。\n属性要求：列出需要的属性及数值。\n属性包含：歌艺，舞蹈，演技，魅力，气质，体能。\n格式示例：舞蹈80，歌艺75。不需要的属性用-表示。\n酬劳：金额+货币单位 CNY（符合当前idol知名度和口碑度的身价，通常在 50,000 - 500,000 CNY 之间）。除了万城娱乐为{{user}}定制的唱片录制是无额外酬劳的义务工作之外，其他所有通告都必须有酬劳。\n拍摄周期：例如：1天（舞台和广告通常较短）、20天、12期等。\n截止日期：例如：2026年5月30日\n内容说明：简述工作类型、要求、注意事项（1-3句话）。若为电影电视剧类型，必须额外附上剧情大纲（开头/过程/结尾各一句话）。\n\n输出示例（请严格模仿此格式输出，不要忘记首尾的标签，内容仅供参考）：\n<contracts>\n[通告｜舞台 / Stage｜音乐银行 打歌舞台｜KBS电视台｜新人首次亮相｜歌艺55，舞蹈58，魅力60，气质55，体能50，演技-｜60,000 CNY｜1天｜无截止日期｜工作类型：打歌舞台首秀。要求：需提前1天彩排，正装出席。]\n[通告｜广告 / Ad｜夏日气泡水 校园推广｜元气森林｜广告模特｜魅力62，气质60，体能55，歌艺-，舞蹈-，演技-｜50,000 CNY｜1天]\n[通告｜综艺 / Variety show｜偶像直播间 拼盘综艺｜PSTV｜飞行嘉宾｜口才65，魅力60，气质58，体能55，歌艺-，舞蹈-｜70,000 CNY｜1天录制]\n[通告｜舞台 / Stage｜MCD 夏日特辑｜M-net电视台｜特别舞台合作｜舞蹈70，歌艺68，魅力72，气质65，体能68，演技-｜120,000 CNY｜2天彩排+录制]\n[通告｜电影电视剧 / Movie & TV series｜青春校园网剧《那年九月》｜全球影业｜男三号 / 女三号｜演技72，魅力70，气质68，体能60，歌艺-，舞蹈-｜150,000 CNY｜20天｜2026年6月1日｜工作类型：青春校园网剧（男三号/女三号）。要求：封闭拍摄，需提前三天进组。剧情大纲：开头：校园新生相遇，命运交错；过程：在误会与竞争中逐渐靠近，共同面对青春难题；结尾：彼此成长，以最好的姿态告别青涩岁月。]\n[通告｜唱片 / Music｜数码单曲《初雨》｜万城娱乐｜音源录制｜歌艺78，舞蹈-，魅力75，气质70，体能-，演技-｜无额外酬劳（公司分成）｜7天]\n[通告｜综艺 / Variety show｜丛林生存法则｜芒果台｜常驻成员｜体能85，气质75，魅力80，口才78，歌艺-，舞蹈-｜280,000 CNY｜12期（每期3天）]\n[通告｜舞台 / Stage｜亚洲音乐盛典 颁奖礼｜主办方｜压轴表演嘉宾｜舞蹈88，歌艺85，魅力90，气质85，体能86，演技-｜400,000 CNY｜1天彩排+直播]\n[通告｜广告 / Ad｜国民运动鞋 春夏系列｜特步｜品牌挚友｜魅力88，气质85，体能82，歌艺-，舞蹈-，演技-｜320,000 CNY｜2天]\n[通告｜电影电视剧 / Movie & TV series｜悬疑电影《消失的第八层》｜盛华集团｜主角｜演技92，魅力90，气质88，体能85，歌艺-，舞蹈-｜500,000 CNY｜45天]\n</contracts>',
        userPrompt: "请生成当前可用的通告列表",
      },
      shop: {
        name: "商店生成预设",
        system: '当用户请求"浏览商店"、"查看商品"、"刷新购物车"、"购买物品"、"预定行程"或剧情推进到需要为宿舍/个人/团队添置物品及规划资金使用时，请严格按照以下格式生成商品列表。\n\n生成规则：每次生成必须包含4-12个精选商品，商品类型应多样化或根据当前剧情上下文（如"采购设备"、"计划休假"、"遭遇公关危机"、"奢侈品"、"礼物"）侧重生成。\n必须在整个列表的开头和结尾使用 <shop> 和 </shop> 标签包裹。\n内部每条商品必须使用方括号 [] 包裹，并严格使用全角竖线 ｜ 分隔字段。\n内容需符合当前{{user}}咖位的消费水平及"偶像模拟经营"的游戏性，并与{{user}}需求及世界观设定紧密挂钩。\n\n数据格式\n<shop> [商品｜商品类别｜物品名称｜品牌/来源｜物品描述｜适用对象/效果｜价格｜库存] ... </shop>\n\n字段说明\n商品类别（严格限制为以下12类）：\n时尚 Fashion：高定服装、珠宝、名表。\n设备 Gear：顶级乐器、录音设备、电竞外设。\n家居 Home：宿舍软装、家电、宠物用品。\n饮食 Food：顶级食材、补剂、酒水。\n礼物 Gift：稀有收藏品、节日礼物。\n旅游 Travel：度假套餐、团建露营。\n营销 PR：买热搜、地标大屏、危机公关。\n团队 Staff：私厨、保镖、专属跟拍。\n粉丝 Fan：咖啡车、逆应援礼包。\n投资 Invest：房产、股票、理财。\n载具 Auto：保姆车、超跑。\n\n物品名称、品牌/来源、物品描述、适用对象/效果、价格（500-500,000 CNY）、库存（现货/仅剩1件/需预定/限量版/内部渠道）。\n\n输出示例：\n<shop>\n[商品｜时尚 Fashion｜2025春夏限定风衣｜Bottega Veneta｜无logo设计，皮质细腻，剪裁极简｜显著提升"魅力"与"气质"｜38,000 CNY｜需预定]\n[商品｜营销 PR｜个人负面热搜公关套餐｜万城公关部｜撤热搜、净化词条、安排正面通稿｜口碑度上升，知名度少量上升｜300,000 CNY｜紧急服务]\n[商品｜课程 Edu｜高端健身私教月卡｜Pure Fitness｜一对一增肌/塑形指导｜"体能"和"气质"稳步提升｜8,800 CNY/月｜现货]\n</shop>',
        userPrompt: "请生成当前商店的商品列表",
      },
      news: {
        name: "日报生成预设",
        system: '当用户请求"查看新闻"、"刷微博"、"看热搜"、"看日报"时，请严格按照以下格式生成今日的娱乐新闻列表。\n\n生成规则：\n每次生成必须恰好包含 5 条新闻，类型分配严格如下：头条 Headline 必须恰好 1 条且类型字段必须写"头条 Headline"，热搜 Trending 1-2 条，竞品 Rivalry 恰好 1 条，八卦 Gossip 恰好 1 条，行业 Industry 恰好 1 条。禁止将热搜类型用作头条。\n内容必须混合 正面战报（{{user}}相关）、负面/争议八卦、行业动态及社会热点。\n必须在整个列表的开头和结尾使用 <news> 和 </news> 标签包裹。\n内部每条新闻必须使用方括号 [] 包裹，并严格使用全角竖线 ｜ 分隔字段。\n\n数据格式：\n<news>\n[类型｜热度排名｜标题/话题｜来源｜内容摘要｜对艺人的影响]\n...\n</news>\n\n字段说明\n类型：头条 Headline / 热搜 Trending / 八卦 Gossip / 竞品 Rivalry / 行业 Industry\n热度排名：爆、热、NO.1、NO.5、新、推荐\n标题/话题：热搜类型需带#号\n来源：官方公告、京港第一狗仔、营销号、VOGUE官博等\n内容摘要：一句话描述新闻详情\n对艺人的影响：简述对{{user}}或公司的数值/剧情影响\n\n输出示例：\n<news>\n[头条｜爆｜{{user}}签约万城娱乐 正式成为旗下练习生｜万城娱乐官方｜万城娱乐今日宣布，新人{{user}}正式签约，将接受封闭训练。｜知名度大幅提升，解锁"练习生日常"系列剧情]\n[热搜｜NO.1｜#{{user}} 机场生图#｜微博娱乐榜｜{{user}}现身京港机场被路人拍到，素颜引发热议。｜{{user}}个人魅力值+5]\n[竞品｜NO.3｜星河娱乐新男团"极光少年"出道舞台破百万｜星河娱乐官网｜五人男团出道曲MV上线4小时播放量破百万。｜同行竞争压力上升]\n</news>',
        userPrompt: "直接输出<news>标签，生成今日5条娱乐新闻，禁止开场白。",
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
          max_tokens: config.max_tokens || 3000,
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
