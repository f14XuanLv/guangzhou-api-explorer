import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

const PRIMARY_DEFAULT_BASE_URL = 'https://guangzhou-api-v2.526404.xyz';
const SECONDARY_DEFAULT_BASE_URL = 'https://guangzhou-api-v2.2748685958.workers.dev';

const API_DOCUMENTATION = `
# 广州地理信息查询 API v2.0

这是一个基于反规范化数据模型构建的高性能查询 API，由 Cloudflare Workers 和 Neon 数据库驱动。它专注于提供快速、灵活的地理实体关系查询。

**在线交互式 Demo**: \`https://guangzhou-roads.526404.xyz/\` (Note: This demo link is part of the original docs, the current app serves as a client to the API itself)

---

## API 端点

API 设计遵循 RESTful 原则，通过不同的路径来查询不同类型的实体关系。

### 端点 1: \`GET /districts\`

获取广州市所有行政区的列表。非常适合用于填充前端的下拉选择框。

*   **URL**: \`/districts\`
*   **参数**: 无
*   **成功响应 (\`200 OK\`)**:
    \`\`\`json
    [
      "白云区",
      "从化区",
      "番禺区",
      "海珠区",
      "花都区",
      "黄埔区",
      "荔湾区",
      "南沙区",
      "天河区",
      "越秀区",
      "增城区"
    ]
    \`\`\`

---

### 端点 2: \`GET /streets\`

查询街道信息，特别是街道与区的关系。

*   **URL**: \`/streets\`
*   **参数**:
    *   \`district\` (string, 可选): 按所属区名进行过滤。
    *   \`name\` (string, 可选): 按街道名进行模糊搜索。
*   **成功响应 (\`200 OK\`)**: 返回一个包含街道对象的数组。
    \`\`\`json
    [
      {
        "street_name": "五山街道",
        "district_name": "天河区"
      },
      {
        "street_name": "冼村街道",
        "district_name": "天河区"
      }
    ]
    \`\`\`

---

### 端点 3: \`GET /roads\`

查询道路信息，这是最核心、最灵活的端点。

*   **URL**: \`/roads\`
*   **参数**:
    *   \`district\` (string, 可选): 按所属区名进行过滤。
    *   \`street\` (string, 可选): 按所属街道名进行过滤。
    *   \`name\` (string, 可选): 按道路名进行模糊搜索。
    *   \`page\` (number, 可选): 分页页码，默认 \`1\`。
    *   \`pageSize\` (number, 可选): 每页数量，默认 \`20\`。
*   **成功响应 (\`200 OK\`)**: 返回一个包含元数据和道路数据对象的 JSON。
    \`\`\`json
    {
      "meta": {
        "totalRecords": 1234,
        "page": 1,
        "pageSize": 2,
        "totalPages": 617
      },
      "data": [
        {
          "road_name": "中山大道西",
          "streets": ["五山街道", "天园街道"],
          "districts": ["天河区"]
        },
        {
          "road_name": "华南快速干线",
          "streets": ["五山街道", "龙洞街道", ...],
          "districts": ["天河区", "白云区"]
        }
      ]
    }
    \`\`\`

---

### API 使用样例

#### 样例 1: 获取所有区
*   **需求**: 填充区名下拉框。
*   **请求**: \`GET /districts\`

#### 样例 2: 查询某个区的所有街道
*   **需求**: 查看天河区有哪些街道。
*   **请求**: \`GET /streets?district=天河区\`

#### 样例 3: 模糊搜索街道
*   **需求**: 查找所有名字里带“沙”的街道及其所属的区。
*   **请求**: \`GET /streets?name=沙\`

#### 样例 4: 基础道路查询
*   **需求**: 查询天河区的所有道路（第一页）。
*   **请求**: \`GET /roads?district=天河区\`

#### 样例 5: 复杂反向查询
*   **需求**: “中山大道西”这条路到底属于哪些街道？哪些区？
*   **请求**: \`GET /roads?name=中山大道西\`
*   **分析**: 查看返回结果中该道路的 \`streets\` 和 \`districts\` 数组。

#### 样例 6: 终极组合查询
*   **需求**: 查询天河区的“五山街道”下，所有名字里带“路”的道路。
*   **请求**: \`GET /roads?district=天河区&street=五山街道&name=路\`
`;

interface ApiParam {
  name: string;
  type: 'text' | 'district-dropdown' | 'number';
  defaultValue?: string | number;
  placeholder?: string;
  label: string;
}

interface ApiExample {
  id: string;
  title: string;
  description: string;
  method: 'GET';
  pathTemplate: string;
  queryParams: ApiParam[];
}

const API_EXAMPLES: ApiExample[] = [
  {
    id: 'get-districts',
    title: '获取所有行政区',
    description: '获取广州市所有行政区的列表。此接口用于填充下方示例中的行政区下拉选择框。',
    method: 'GET',
    pathTemplate: '/districts',
    queryParams: [],
  },
  {
    id: 'get-streets-by-district-or-name',
    title: '查询街道信息',
    description: '根据行政区筛选街道，和/或根据街道名称进行模糊搜索。',
    method: 'GET',
    pathTemplate: '/streets',
    queryParams: [
      { name: 'district', type: 'district-dropdown', label: '行政区 (可选)', placeholder: '例如：天河区' },
      { name: 'name', type: 'text', label: '街道名 (模糊搜索, 可选)', placeholder: '例如：五山' },
    ],
  },
  {
    id: 'get-roads-complex',
    title: '查询道路信息 (复杂查询)',
    description: '根据行政区、街道、道路名（模糊搜索）筛选道路，支持分页。',
    method: 'GET',
    pathTemplate: '/roads',
    queryParams: [
      { name: 'district', type: 'district-dropdown', label: '行政区 (可选)', placeholder: '例如：天河区' },
      { name: 'street', type: 'text', label: '街道名 (可选)', placeholder: '例如：五山街道' },
      { name: 'name', type: 'text', label: '道路名 (模糊搜索, 可选)', placeholder: '例如：中山大道' },
      { name: 'page', type: 'number', label: '页码', defaultValue: 1, placeholder: '1' },
      { name: 'pageSize', type: 'number', label: '每页数量', defaultValue: 20, placeholder: '20' },
    ],
  },
  {
    id: 'street-to-districts',
    title: '查询街道所属行政区',
    description: '根据街道名称，查询其属于一个或多个行政区。使用 /streets 接口。',
    method: 'GET',
    pathTemplate: '/streets',
    queryParams: [
      { name: 'name', type: 'text', label: '街道名 (模糊搜索)', placeholder: '输入街道名 (例如：沙河)' },
    ],
  },
  {
    id: 'road-to-streets-districts',
    title: '查询道路所属街道和行政区',
    description: '根据道路名称，查询其属于哪些街道和行政区。使用 /roads 接口。',
    method: 'GET',
    pathTemplate: '/roads',
    queryParams: [
      { name: 'name', type: 'text', label: '道路名 (模糊搜索)', placeholder: '输入道路名 (例如：中山大道西)' },
    ],
  },
];

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("无法复制文本: ", err);
      // Optionally, show an error message to the user
    }
  };

  return (
    <button onClick={handleCopy} className="button copy-button" disabled={!textToCopy} aria-label={copied ? "已复制!" : "复制文本"}>
      {copied ? "已复制!" : "复制"}
    </button>
  );
};


const ApiCallExampleCard: React.FC<{
  example: ApiExample;
  apiBaseUrl: string; // This will be the primaryApiBaseUrl from App state
  districts: string[];
  isLoadingDistricts: boolean;
}> = ({ example, apiBaseUrl, districts, isLoadingDistricts }) => {
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const initialParams: Record<string, string> = {};
    example.queryParams.forEach(p => {
      if (p.defaultValue !== undefined) {
        initialParams[p.name] = String(p.defaultValue);
      } else {
        initialParams[p.name] = '';
      }
    });
    return initialParams;
  });
  const [response, setResponse] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [requestUrl, setRequestUrl] = useState<string | null>(null);

  const handleParamChange = (paramName: string, value: string) => {
    setParamValues(prev => ({ ...prev, [paramName]: value }));
  };

  const handleSubmit = async () => {
    if (!apiBaseUrl) {
      setError("主 API 基础URL未设置。API调用需要此URL。");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const query = new URLSearchParams();
    for (const key in paramValues) {
      if (paramValues[key]) {
        query.append(key, paramValues[key]);
      }
    }
    
    const fullUrl = `${apiBaseUrl.replace(/\/$/, '')}${example.pathTemplate}?${query.toString()}`;
    setRequestUrl(fullUrl);

    try {
      const res = await fetch(fullUrl);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `请求失败，状态码: ${res.status}`);
      }
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "发生未知错误。");
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="api-example-card section">
      <h3>{example.title}</h3>
      <p>{example.description}</p>
      <p><strong>接口:</strong> <code>{example.method} {example.pathTemplate}</code></p>
      
      <div className="params-container">
        {example.queryParams.map(param => (
          <div key={param.name} className="param-item">
            <label htmlFor={`${example.id}-${param.name}`}>{param.label}:</label>
            {param.type === 'district-dropdown' ? (
              <select
                id={`${example.id}-${param.name}`}
                value={paramValues[param.name] || ''}
                onChange={(e) => handleParamChange(param.name, e.target.value)}
                disabled={isLoadingDistricts || districts.length === 0}
                aria-label={param.label}
              >
                <option value="">-- 选择行政区 (可选) --</option>
                {isLoadingDistricts && <option value="" disabled>加载行政区中...</option>}
                {!isLoadingDistricts && districts.length === 0 && !isLoadingDistricts && <option value="" disabled>无法加载行政区列表</option>}
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input
                type={param.type === 'number' ? 'number' : 'text'}
                id={`${example.id}-${param.name}`}
                value={paramValues[param.name] || ''}
                onChange={(e) => handleParamChange(param.name, e.target.value)}
                placeholder={param.placeholder}
                aria-label={param.label}
              />
            )}
          </div>
        ))}
      </div>
      
      {example.queryParams.length > 0 && <div style={{height: '10px'}}></div>} 

      <button onClick={handleSubmit} disabled={isLoading || !apiBaseUrl} className="button" aria-busy={isLoading}>
        {isLoading && <span className="loader" aria-hidden="true"></span>}
        发送请求
      </button>

      {requestUrl && (
        <div className="request-url-area">
          <div className="area-header">
            <h4>请求URL:</h4>
            <CopyButton textToCopy={requestUrl} />
          </div>
          <code>{requestUrl}</code>
        </div>
      )}

      {isLoading && <p aria-live="polite">加载响应中...</p>}
      
      {error && (
        <div className="response-area error-message" aria-live="assertive">
           <div className="area-header">
            <h4>错误:</h4>
          </div>
          <pre>{error}</pre>
        </div>
      )}
      {response && (
        <div className="response-area success-message">
          <div className="area-header">
            <h4>响应:</h4>
            <CopyButton textToCopy={JSON.stringify(response, null, 2)} />
          </div>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [primaryApiBaseUrl, setPrimaryApiBaseUrl] = useState<string>(PRIMARY_DEFAULT_BASE_URL);
  const [secondaryApiBaseUrl, setSecondaryApiBaseUrl] = useState<string>(SECONDARY_DEFAULT_BASE_URL);
  const [districts, setDistricts] = useState<string[]>([]);
  const [districtsError, setDistrictsError] = useState<string | null>(null);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState<boolean>(true);
  const [lastUsedUrlForDistricts, setLastUsedUrlForDistricts] = useState<string | null>(null);


  const fetchDistricts = useCallback(async () => {
    setIsLoadingDistricts(true);
    setDistrictsError(null);
    setDistricts([]);
    setLastUsedUrlForDistricts(null);
    let loadedSuccessfully = false;
  
    const urlsToTry: { url: string; name: string; type: 'secondary' | 'primary' }[] = [];
    const secondaryTrimmed = secondaryApiBaseUrl.trim();
    const primaryTrimmed = primaryApiBaseUrl.trim();

    if (secondaryTrimmed) {
      urlsToTry.push({ url: secondaryTrimmed.replace(/\/$/, ''), name: '备选URL', type: 'secondary' });
    }
    if (primaryTrimmed) {
      urlsToTry.push({ url: primaryTrimmed.replace(/\/$/, ''), name: '主URL', type: 'primary' });
    }
    
    if (urlsToTry.length === 0) {
      setDistrictsError("主API基础URL和备选API基础URL均未设置。");
      setIsLoadingDistricts(false);
      return;
    }
  
    let combinedErrors = [];
  
    for (const { url, name } of urlsToTry) {
      try {
        console.log(`Attempting to fetch districts from ${name}: ${url}/districts`);
        const response = await fetch(`${url}/districts`);
        if (!response.ok) {
          throw new Error(`从 ${name} (${url}) 获取行政区失败 - 状态: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data) && data.every(item => typeof item === 'string')) {
          setDistricts(data);
          setDistrictsError(null); 
          setLastUsedUrlForDistricts(`${name} (${url})`);
          loadedSuccessfully = true;
          console.log(`Districts loaded successfully from ${name}: ${url}`);
          break; 
        } else {
          throw new Error(`从 ${name} (${url}) 获取的行政区数据格式不正确。`);
        }
      } catch (error: any) {
        console.warn(error.message);
        combinedErrors.push(error.message);
      }
    }
  
    if (!loadedSuccessfully) {
      setDistrictsError(combinedErrors.filter(Boolean).join('; ') || '无法从任何配置的URL加载行政区列表。');
    }
    setIsLoadingDistricts(false);
  }, [primaryApiBaseUrl, secondaryApiBaseUrl]);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  const handlePrimaryBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrimaryApiBaseUrl(e.target.value);
  };

  const handleSecondaryBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondaryApiBaseUrl(e.target.value);
  };
  
  const handleRefreshDistricts = () => {
    fetchDistricts();
  };

  return (
    <div className="app-container">
      <div className="left-panel">
        <header>
          <h1>广州-行政区-街道-道路 API 展示</h1>
        </header>

        <div className="section api-config-section">
          <h2>API 配置</h2>
          <div className="config-item">
            <label htmlFor="primaryApiBaseUrl">主 API 基础URL (用于API调用):</label>
            <input
              type="text"
              id="primaryApiBaseUrl"
              value={primaryApiBaseUrl}
              onChange={handlePrimaryBaseUrlChange}
              aria-describedby="primaryBaseUrlNote"
            />
            <p id="primaryBaseUrlNote" className="base-url-note">
              此URL将用于所有“API交互示例”中的请求。也作为获取行政区的备用选项。<br/>
              默认: <code>{PRIMARY_DEFAULT_BASE_URL}</code>
            </p>
          </div>
          <div className="config-item">
            <label htmlFor="secondaryApiBaseUrl">备选 API 基础URL (优先用于获取行政区):</label>
            <input
              type="text"
              id="secondaryApiBaseUrl"
              value={secondaryApiBaseUrl}
              onChange={handleSecondaryBaseUrlChange}
              aria-describedby="secondaryBaseUrlNote"
            />
            <p id="secondaryBaseUrlNote" className="base-url-note">
              此URL将优先用于获取行政区列表。如果为空或失败，将尝试使用主URL。<br/>
              默认: <code>{SECONDARY_DEFAULT_BASE_URL}</code>
            </p>
          </div>
          <button onClick={handleRefreshDistricts} style={{marginTop: '10px'}} className="button" disabled={isLoadingDistricts}>
              {isLoadingDistricts ? <><span className="loader"></span> 正在连接...</> : '测试连接 & 获取行政区'}
          </button>
          {isLoadingDistricts && <p className="info-message" aria-live="polite">正在加载行政区列表...</p>}
          {districtsError && !isLoadingDistricts && <p className="error-message" aria-live="assertive">行政区加载错误: {districtsError}</p>}
          {!isLoadingDistricts && !districtsError && districts.length > 0 && 
            <p className="success-message" aria-live="polite">
              已成功加载行政区列表 {lastUsedUrlForDistricts ? `(使用 ${lastUsedUrlForDistricts})` : ''}。
            </p>
          }
          {!isLoadingDistricts && !districtsError && districts.length === 0 && !isLoadingDistricts &&
            <p className="error-message" aria-live="polite">未能加载行政区列表。请检查API基础URL或网络连接。</p>
          }
        </div>

        <div className="section">
          <h2>API 文档 (README.md)</h2>
          <div className="api-docs-container" role="document" aria-label="API Documentation">
            <pre>{API_DOCUMENTATION}</pre>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <div className="section">
          <h2>API 交互示例</h2>
          {API_EXAMPLES.map(example => (
            <ApiCallExampleCard
              key={example.id}
              example={example}
              apiBaseUrl={primaryApiBaseUrl} 
              districts={districts}
              isLoadingDistricts={isLoadingDistricts}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<React.StrictMode><App /></React.StrictMode>);
} else {
  console.error("未能找到ID为 'root' 的根元素");
}