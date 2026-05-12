# 🔍 Tyrian Lens

**Tyrian Lens** is a sophisticated, all-in-one companion application and overlay for *Guild Wars 2*. Designed to bridge the gap between in-game exploration and external data analysis, Tyrian Lens provides players with a powerful, modular interface to track their characters, master the market, and navigate the vast world of Tyria.

Built with a high-performance **C# / .NET 9** core and a modern **WebView2** front-end, it offers a seamless, premium experience for both casual explorers and hardcore legendary hunters.

---

## ✨ Key Features

### 🗺️ Dynamic GPS & Mapping
*   **Real-time Position Tracking**: Leveraging the **Mumble Link API** to show your exact location on an interactive map.
*   **Smart Map Switching**: Automatically switches between the Tyria surface map and the WvW Mists based on your in-game location.
*   **POI & Marker Overlay**: View Points of Interest, Waypoints, and custom gathering/farming markers.

### 💰 Trading Post & Market Intelligence
*   **Market Delta Sync**: Real-time synchronization with the Black Lion Trading Post for up-to-the-minute pricing.
*   **Investment Tracker**: Log your item purchases and track your Return on Investment (ROI) with automated price graphing.
*   **Smart Crafting Analysis**: Analyze your Material Storage vs. Market Prices to find the most profitable time-gated crafts.
*   **Delivery Notifications**: Integrated alerts for when your items are sold or ready for pickup.

### 🎒 Account & Hero Management
*   **Unified Inventory**: View your character inventory, bank, and material storage in one place.
*   **Wardrobe & Appearance**: Preview your unlocked skins and dyes with a high-fidelity visual interface.
*   **Character Planner**: Detail your gear, stats, and builds to plan your next legendary goal.

### 🏆 Achievement & Event Tracking
*   **Persistent Watchlist**: Track multiple achievements simultaneously with live progress bars.
*   **Event Timers**: Integrated world boss and meta-event timers with audio notifications.
*   **Daily Raid Framework (DRF)**: Direct integration with the DRF WebSocket for raid-specific tracking and data.

### 📖 Integrated Wiki Support
*   **Smart Wiki Lookup**: Click on any item or achievement to open the official Guild Wars 2 Wiki in an integrated side-panel, keeping you focused on the game.

---

## 🛠️ Technology Stack

*   **Backend**: C# (.NET 9) WinForms
*   **Rendering**: Microsoft WebView2 (Edge Chromium)
*   **Mapping**: Leaflet.js
*   **Data Handling**: Gw2Sharp & Newtonsoft.Json
*   **Game Link**: Mumble Link API

---

## 🚀 Getting Started

### Prerequisites
*   [.NET 9 Runtime](https://dotnet.microsoft.com/download/dotnet/9.0)
*   [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually included with Windows 10/11)

### Setup
1.  Download the latest release.
2.  Launch `TyrianLens.exe`.
3.  Add your **Guild Wars 2 API Key** (requires `account`, `inventories`, `characters`, `tradingpost`, `progression`, and `unlocks` permissions) via the in-app settings.

---

## 📜 Legal & Credits

### Data & Assets
*   **Guild Wars 2 Content**: All in-game assets, icons, and data provided via the API are property of ©2026 ArenaNet, LLC. All rights reserved. NCSOFT, the interlocking NC logo, ArenaNet, Guild Wars, Guild Wars 2, End of Dragons, Secrets of the Obscure, Janthir Wilds, and all associated logos and designs are trademarks or registered trademarks of NCSOFT Corporation.
*   **API Service**: Data is fetched via the official [Guild Wars 2 API](https://api.guildwars2.com/).

### Third-Party Libraries
*   **[Gw2Sharp](https://github.com/Archomeda/Gw2Sharp)**: Used for robust communication with the GW2 API.
*   **[Leaflet.js](https://leafletjs.com/)**: Powers the interactive map functionality.
*   **[Newtonsoft.Json](https://www.newtonsoft.com/json)**: High-performance JSON serialization.
*   **[WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)**: Used for the Chromium-based UI bridge.

### Disclaimer
*   Tyrian Lens is a third-party application and is **not affiliated with or endorsed by ArenaNet or NCSOFT**. Use of this application is at your own risk. It is designed to comply with the Guild Wars 2 User Agreement regarding third-party tools (no automation, only information display).

---

**Tyrian Lens** — *See Tyria in a new light.*
