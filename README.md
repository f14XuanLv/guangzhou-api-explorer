
# 广州-行政区-街道-道路 API 展示 (Guangzhou API Explorer)

This project is an interactive web application designed to explore and test the "广州地理信息查询 API" (Guangzhou Geographic Information API). It provides a user-friendly interface to construct API requests, send them, and view the responses.

## 主要功能 (Key Features)

*   **交互式 API 测试 (Interactive API Testing)**: Allows users to easily test different API endpoints (`/districts`, `/streets`, `/roads`) with various parameters.
*   **API 文档展示 (Embedded API Documentation)**: Displays the API documentation directly within the application for quick reference.
*   **可配置 API 地址 (Configurable API URLs)**:
    *   **主 API 基础URL (Primary API Base URL)**: Used for all API interaction examples.
    *   **备选 API 基础URL (Secondary API Base URL)**: Prioritized for fetching the list of administrative districts. If it fails or is not provided, the primary URL is used as a fallback.
*   **动态参数输入 (Dynamic Parameter Inputs)**: Provides input fields tailored to each API endpoint's parameters, including dropdowns for administrative districts.
*   **请求与响应可视化 (Request & Response Visualization)**: Clearly displays the constructed request URL and the formatted JSON response or error message from the API.
*   **一键复制 (Copy to Clipboard)**: Easily copy request URLs and API responses.
*   **响应式设计 (Responsive Design)**: Adapts to different screen sizes for usability on desktops, tablets, and mobile devices.
*   **离线优先获取行政区 (Offline-first District Fetching Strategy)**: Attempts to use a secondary (potentially more stable or geographically closer) URL for fetching district data before falling back to the primary URL.

## 如何使用 (How to Use)

1.  Clone or download this project.
2.  Open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Safari, Edge).
3.  The application will load, and you can start interacting with the API examples.

No complex build process is required for the current setup as it uses ES modules directly imported via `esm.sh`.

## API 配置 (API Configuration)

The application allows you to configure two API base URLs:

*   **主 API 基础URL (Primary API Base URL)**:
    *   This URL is used for making all the API calls in the "API 交互示例" (API Interaction Examples) section.
    *   It also serves as a fallback for fetching the list of administrative districts if the secondary URL fails or is not set.
    *   Default: `https://guangzhou-api-v2.526404.xyz`

*   **备选 API 基础URL (Secondary API Base URL)**:
    *   This URL is prioritized when fetching the list of administrative districts (used to populate dropdowns).
    *   This allows for specifying a potentially more reliable or performant endpoint for this critical initial data.
    *   Default: `https://guangzhou-api-v2.2748685958.workers.dev`

You can edit these URLs directly in the "API 配置" (API Configuration) section of the application. Click the "测试连接 & 获取行政区" (Test Connection & Fetch Districts) button to re-fetch districts using the configured URLs (prioritizing the secondary URL).

## 广州地理信息查询 API 概览 (Guangzhou Geographic Information API Overview)

The API this explorer interacts with provides information about Guangzhou's administrative districts, streets, and roads.

### 主要端点 (Key Endpoints):

*   **`GET /districts`**:
    *   Fetches a list of all administrative districts in Guangzhou.
    *   Example Response: `["白云区", "从化区", ...]`

*   **`GET /streets`**:
    *   Queries street information.
    *   Supports filtering by `district` (district name) and/or fuzzy search by `name` (street name).
    *   Example Response: `[{"street_name": "五山街道", "district_name": "天河区"}, ...]`

*   **`GET /roads`**:
    *   Queries road information. This is the most comprehensive endpoint.
    *   Supports filtering by `district`, `street`, fuzzy search by `name` (road name), and pagination (`page`, `pageSize`).
    *   Example Response:
        ```json
        {
          "meta": { "totalRecords": 1234, "page": 1, ... },
          "data": [
            { "road_name": "中山大道西", "streets": ["五山街道"], "districts": ["天河区"] },
            ...
          ]
        }
        ```

For detailed API documentation, refer to the "API 文档 (README.md)" section embedded within the application.

## 技术栈 (Technology Stack)

*   **React 19** (with Hooks)
*   **TypeScript**
*   **HTML5**
*   **CSS3** (Flexbox for layout)
*   **ES Modules (ESM)**: Dependencies like React are imported directly in the browser via `esm.sh`.

## 项目结构 (Project Structure)

*   `index.html`: The main HTML file that loads the application.
*   `index.tsx`: The main TypeScript file containing the React application logic and components.
*   `index.css`: Stylesheet for the application.
*   `README.md`: This file.
*   `metadata.json`: Project metadata (not directly used by the runtime but good for project context).
