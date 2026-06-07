using System;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;
using Gw2Sharp;
using System.Globalization;
using System.Drawing;
using System.Threading.Tasks;
using System.Runtime.InteropServices;
using System.Diagnostics;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using DiscordRPC;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace GW2PS
{
    public partial class Form1 : Form
    {
        private Microsoft.Web.WebView2.WinForms.WebView2 mapView = new Microsoft.Web.WebView2.WinForms.WebView2();
        private IGw2Client gw2Client = new Gw2Client();
        private System.Windows.Forms.Timer gpsTimer = new System.Windows.Forms.Timer();
        private bool isWikiIntegrated = true;

        private DiscordRpcClient? discordClient;
        private bool isDiscordRpcEnabled = false;
        private string lastCharacterName = "";
        private DateTime sessionStartTime;
        private int discordTickCounter = 0;
        private int lastPresenceMapId = -1;
        private string lastPresenceCharName = "";
        private string currentMapName = "Tyria";

        private int lastMapId = -1;
        private double mapRectX, mapRectY, mapRectW, mapRectH;
        private double contRectX, contRectY, contRectW, contRectH;

        private ClientWebSocket? drfSocket;
        private CancellationTokenSource? drfTokenSource;

        public const int WM_NCLBUTTONDOWN = 0xA1;
        public const int HT_CAPTION = 0x2;
        public const int WM_NCHITTEST = 0x84;
        public const int HTBOTTOMRIGHT = 17;

        [DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
        [DllImport("user32.dll")]
        public static extern bool ReleaseCapture();
        
        private NotifyIcon notifyIcon;

        public static void LogError(Exception? ex)
        {
            try
            {
                string logPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "error_log.txt");
                File.AppendAllText(logPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {ex?.Message}\n{ex?.StackTrace}\n");
            }
            catch { }
        }

        public Form1()
        {
            InitializeComponent();
            this.Text = "Tyrian Lens";
            this.Size = new Size(1400, 900);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.DoubleBuffered = true;
            this.SetStyle(ControlStyles.ResizeRedraw, true);

            Application.ThreadException += (s, ev) => LogError(ev.Exception);
            AppDomain.CurrentDomain.UnhandledException += (s, ev) => LogError(ev.ExceptionObject as Exception);

            notifyIcon = new NotifyIcon();
            notifyIcon.Icon = SystemIcons.Information;
            try {
                if (File.Exists(@"Assets\app_icon.ico")) notifyIcon.Icon = new Icon(@"Assets\app_icon.ico");
            } catch { }
            notifyIcon.Visible = true;
            notifyIcon.Text = "Tyrian Lens";

            mapView.Dock = DockStyle.Fill;
            this.Controls.Add(mapView);

            InitializeAsync();
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WM_NCHITTEST)
            {
                Point pos = new Point(m.LParam.ToInt32());
                pos = this.PointToClient(pos);
                if (pos.X >= this.ClientSize.Width - 16 && pos.Y >= this.ClientSize.Height - 16)
                {
                    m.Result = (IntPtr)HTBOTTOMRIGHT;
                    return;
                }
            }
            base.WndProc(ref m);
        }

        private async void InitializeAsync()
        {
            string userDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TyrianLens");
            string dontShowFilePath = Path.Combine(userDataFolder, "hide_welcome.txt");

            bool initialized = false;
            try
            {
                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
                await mapView.EnsureCoreWebView2Async(env);
                initialized = true;
            }
            catch (Exception ex)
            {
                LogError(ex);
                // Fallback 1: Try with GPU hardware acceleration disabled (highly common on fresh Windows resets/generic drivers)
                try
                {
                    var options = new CoreWebView2EnvironmentOptions("--disable-gpu");
                    var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder, options);
                    await mapView.EnsureCoreWebView2Async(env);
                    initialized = true;
                }
                catch (Exception fallbackEx)
                {
                    LogError(fallbackEx);
                    // Fallback 2: Try using alternative temp folder + GPU disabled (handles profile/OneDrive permission locking)
                    try
                    {
                        string altUserDataFolder = Path.Combine(Path.GetTempPath(), "TyrianLensTemp");
                        var options = new CoreWebView2EnvironmentOptions("--disable-gpu");
                        var env = await CoreWebView2Environment.CreateAsync(null, altUserDataFolder, options);
                        await mapView.EnsureCoreWebView2Async(env);
                        initialized = true;
                    }
                    catch (Exception finalEx)
                    {
                        LogError(finalEx);
                        MessageBox.Show(
                            $"Failed to initialize the browser engine (WebView2).\n\n" +
                            $"Primary Error: {ex.Message}\n\n" +
                            $"GPU-Disabled Fallback: {fallbackEx.Message}\n\n" +
                            $"Temp-Folder Fallback: {finalEx.Message}\n\n" +
                            $"Please make sure the Microsoft WebView2 Evergreen Runtime is fully installed and your GPU drivers are updated.",
                            "Browser Engine Error",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error
                        );
                    }
                }
            }

            if (!initialized) return;

            mapView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            mapView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            mapView.CoreWebView2.Settings.AreDevToolsEnabled = false;

            mapView.CoreWebView2.NewWindowRequested += (s, e) =>
            {
                e.Handled = true;
                if (isWikiIntegrated && e.Uri.Contains("wiki.guildwars2.com"))
                {
                    mapView.CoreWebView2.PostWebMessageAsString($"openWiki:{e.Uri}");
                }
                else
                {
                    Process.Start(new ProcessStartInfo(e.Uri) { UseShellExecute = true });
                }
            };

            string localFolder = AppDomain.CurrentDomain.BaseDirectory;

#if DEBUG
            // In Debug mode, map gw2ps.local directly to the project source root folder
            string debugRoot = Path.GetFullPath(Path.Combine(localFolder, @"..\..\.."));
            if (Directory.Exists(debugRoot) && File.Exists(Path.Combine(debugRoot, "GW2PS_DEV.csproj")))
            {
                mapView.CoreWebView2.SetVirtualHostNameToFolderMapping("gw2ps.local", debugRoot, CoreWebView2HostResourceAccessKind.Allow);
            }
            else
            {
                mapView.CoreWebView2.SetVirtualHostNameToFolderMapping("gw2ps.local", localFolder, CoreWebView2HostResourceAccessKind.Allow);
            }
#else
            mapView.CoreWebView2.SetVirtualHostNameToFolderMapping("gw2ps.local", localFolder, CoreWebView2HostResourceAccessKind.Allow);
#endif

#if DEBUG
            _ = mapView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync("window.isDevMode = true;");
#else
            _ = mapView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync("window.isDevMode = false;");
#endif

            mapView.CoreWebView2.WebMessageReceived += (s, e) => {
                string? msg = null;
                try { msg = e.TryGetWebMessageAsString(); } catch { }

                if (msg != null)
                {
                    if (msg.StartsWith("setWikiIntegrated:")) isWikiIntegrated = msg.Split(':')[1].ToLower() == "true";
                    else if (msg == "hide_welcome_forever")
                    {
                        if (!Directory.Exists(userDataFolder)) Directory.CreateDirectory(userDataFolder);
                        File.WriteAllText(dontShowFilePath, "hidden");
                    }
                    else if (msg == "wipe_all_data")
                    {
                        try { if (Directory.Exists(userDataFolder)) Directory.Delete(userDataFolder, true); Application.Restart(); Environment.Exit(0); }
                        catch (Exception ex) { MessageBox.Show("Error wiping data: " + ex.Message); }
                    }
                    else if (msg == "close") this.Invoke((MethodInvoker)delegate { this.Close(); });
                    else if (msg == "minimize") this.Invoke((MethodInvoker)delegate { this.WindowState = FormWindowState.Minimized; });
                    else if (msg == "fullscreen") this.Invoke((MethodInvoker)delegate {
                        if (this.WindowState == FormWindowState.Maximized) this.WindowState = FormWindowState.Normal;
                        else this.WindowState = FormWindowState.Maximized;
                    });
                    else if (msg == "drag") { ReleaseCapture(); SendMessage(this.Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0); }
                    else if (msg == "resize") { ReleaseCapture(); SendMessage(this.Handle, WM_NCLBUTTONDOWN, HTBOTTOMRIGHT, 0); }
                    else if (msg == "toggleOnTop") this.Invoke((MethodInvoker)delegate { this.TopMost = !this.TopMost; });
                    else if (msg.StartsWith("copy:"))
                    {
                        string code = msg.Substring(5);
                        if (!string.IsNullOrWhiteSpace(code)) Clipboard.SetText(code);
                    }
                }
            };

            // Grabs the Static API Token from your UI
            mapView.CoreWebView2.WebMessageReceived += async (s, e) => {
                try
                {
                    string rawJson = e.WebMessageAsJson;
                    string cleanJson = rawJson;
                    if (cleanJson.StartsWith("\"")) {
                        cleanJson = cleanJson.Replace("\\\"", "\"").Replace("\\\\", "\\").Trim('"');
                    }

                    if (cleanJson.Contains("updateDRFToken"))
                    {
                        int start = cleanJson.IndexOf("\"token\":\"") + 9;
                        if (start > 8)
                        {
                            int end = cleanJson.IndexOf("\"", start);
                            if (end > start)
                            {
                                string token = cleanJson.Substring(start, end - start);
                                if (!string.IsNullOrWhiteSpace(token))
                                {
                                    await ConnectToDRF(token);
                                }
                            }
                        }
                    }
                    else if (cleanJson.StartsWith("{"))
                    {
                        try {
                            var json = System.Text.Json.JsonDocument.Parse(cleanJson);
                             if (json.RootElement.TryGetProperty("action", out var act)) {
                                 string actionStr = act.GetString() ?? "";
                                 if (actionStr == "trayNotification") {
                                     string title = json.RootElement.GetProperty("title").GetString() ?? "";
                                     string text = json.RootElement.GetProperty("text").GetString() ?? "";
                                     notifyIcon.ShowBalloonTip(5000, title, text, ToolTipIcon.Info);
                                 }
                                else if (actionStr == "setDiscordRpcEnabled") {
                                    bool enabled = json.RootElement.GetProperty("value").GetBoolean();
                                    SetDiscordRpcEnabled(enabled);
                                }
                                else if (actionStr == "openLogFolder") {
                                    string srcLogPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "error_log.txt");
                                    if (!File.Exists(srcLogPath)) {
                                        File.WriteAllText(srcLogPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] LOG INITIALIZED - NO ERRORS RECORDED YET.\n");
                                    }
                                    
                                    string destLogPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "tyrian_lens_log.txt");
                                     File.Copy(srcLogPath, destLogPath, true);
                                     _ = mapView.CoreWebView2.ExecuteScriptAsync("window.showToast('TYRIAN_LENS_LOG.TXT SAVED TO DESKTOP');");
                                 }
#if DEBUG
                                 else if (actionStr == "devDeleteMarker") {
                                     string file = json.RootElement.GetProperty("file").GetString() ?? "farming_markers.json";
                                     var pos = json.RootElement.GetProperty("pos");
                                     double px = pos[0].GetDouble();
                                     double py = pos[1].GetDouble();
                                     DevDeleteMarker(file, px, py);
                                     _ = mapView.CoreWebView2.ExecuteScriptAsync($"if(window.showToast) window.showToast('MARKER DELETED FROM {file.ToUpper()}');");
                                     _ = mapView.CoreWebView2.ExecuteScriptAsync("var frame = document.getElementById('map-frame'); if(frame && frame.contentWindow && frame.contentWindow.reloadMarkers) frame.contentWindow.reloadMarkers();");
                                 }
                                else if (actionStr == "devDeleteCategory") {
                                    string file = json.RootElement.GetProperty("file").GetString() ?? "farming_markers.json";
                                    string layer = json.RootElement.GetProperty("layer").GetString() ?? "";
                                    DevDeleteCategory(file, layer);
                                    _ = mapView.CoreWebView2.ExecuteScriptAsync($"if(window.showToast) window.showToast('CATEGORY {layer.ToUpper()} DELETED');");
                                    _ = mapView.CoreWebView2.ExecuteScriptAsync("var frame = document.getElementById('map-frame'); if(frame && frame.contentWindow && frame.contentWindow.reloadMarkers) frame.contentWindow.reloadMarkers();");
                                }
                                else if (actionStr == "devShiftCategory128") {
                                    string file = json.RootElement.GetProperty("file").GetString() ?? "farming_markers.json";
                                    string layer = json.RootElement.GetProperty("layer").GetString() ?? "";
                                    DevShiftCategory128(file, layer);
                                    _ = mapView.CoreWebView2.ExecuteScriptAsync($"if(window.showToast) window.showToast('CATEGORY {layer.ToUpper()} SHIFTED +128 SOUTH');");
                                    _ = mapView.CoreWebView2.ExecuteScriptAsync("var frame = document.getElementById('map-frame'); if(frame && frame.contentWindow && frame.contentWindow.reloadMarkers) frame.contentWindow.reloadMarkers();");
                                }
                                else if (actionStr == "devMoveMarker") {
                                    string file = json.RootElement.GetProperty("file").GetString() ?? "farming_markers.json";
                                    var origPos = json.RootElement.GetProperty("origPos");
                                    double ox = origPos[0].GetDouble();
                                    double oy = origPos[1].GetDouble();
                                    var newPos = json.RootElement.GetProperty("newPos");
                                    double nx = newPos[0].GetDouble();
                                    double ny = newPos[1].GetDouble();
                                    double nz = json.RootElement.GetProperty("alt").GetDouble();
                                    DevMoveMarker(file, ox, oy, nx, ny, nz);
                                    _ = mapView.CoreWebView2.ExecuteScriptAsync($"if(window.showToast) window.showToast('MARKER MOVED');");
                                    _ = mapView.CoreWebView2.ExecuteScriptAsync("var frame = document.getElementById('map-frame'); if(frame && frame.contentWindow && frame.contentWindow.reloadMarkers) frame.contentWindow.reloadMarkers();");
                                }
#endif
                            }
                        } catch { }
                    }
                }
                catch { }
            };

            mapView.Source = new Uri("https://gw2ps.local/modules/index.html");
            gpsTimer.Interval = 100;
            gpsTimer.Tick += GpsTimer_Tick;
            gpsTimer.Start();
        }

        private async Task ConnectToDRF(string apiToken)
        {
            if (drfSocket != null && drfTokenSource != null)
            {
                drfTokenSource.Cancel();
                try { await drfSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Reconnecting", CancellationToken.None); } catch { }
                drfSocket.Dispose();
            }

            if (string.IsNullOrWhiteSpace(apiToken)) return;

            drfSocket = new ClientWebSocket();
            drfTokenSource = new CancellationTokenSource();

            try
            {
                _ = mapView.CoreWebView2.ExecuteScriptAsync("window.showToast('SYNCING WITH DRF...');");

                Uri serverUri = new Uri("wss://drf.rs/ws/");

                // 1. Connect first (No subprotocols or special headers needed here per GitHub code)
                await drfSocket.ConnectAsync(serverUri, CancellationToken.None);

                // 2. THE BLISHHUD MASTER LOGIC: 
                // Send the Static API Key as a UTF8 string prefixed with "Bearer "
                string authMessage = $"Bearer {apiToken}";
                var bytes = Encoding.UTF8.GetBytes(authMessage);

                await drfSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);

                _ = mapView.CoreWebView2.ExecuteScriptAsync("window.showToast('DRF TRACKER ACTIVE!');");

                _ = Task.Run(ReceiveDRFData);
            }
            catch (Exception ex)
            {
                string safeError = ex.Message.Replace("'", "\\'").Replace("\n", " ");
                _ = mapView.CoreWebView2.ExecuteScriptAsync($"window.showToast('DRF ERROR: {safeError}');");
            }
        }

        private async Task ReceiveDRFData()
        {
            var buffer = new byte[1024 * 4];
            try
            {
                while (drfSocket != null && drfSocket.State == WebSocketState.Open && drfTokenSource != null && !drfTokenSource.Token.IsCancellationRequested)
                {
                    using (var ms = new MemoryStream())
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await drfSocket.ReceiveAsync(new ArraySegment<byte>(buffer), drfTokenSource.Token);
                            ms.Write(buffer, 0, result.Count);
                        } while (!result.EndOfMessage);

                        if (result.MessageType == WebSocketMessageType.Close) break;

                        string jsonMessage = Encoding.UTF8.GetString(ms.ToArray());

                        this.Invoke((MethodInvoker)delegate {
                            try
                            {
                                mapView.CoreWebView2.PostWebMessageAsJson(jsonMessage);
                            }
                            catch (Exception ex)
                            {
                                LogError(ex);
                            }
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                LogError(ex);
            }
        }

        private void GpsTimer_Tick(object? sender, EventArgs e)
        {
            try
            {
                var mumble = gw2Client.Mumble;
                mumble.Update();

                // Discord Rich Presence polling (throttled to avoid spam)
                try
                {
                    if (isDiscordRpcEnabled && discordClient != null && !string.IsNullOrEmpty(mumble.RawIdentity))
                    {
                        discordTickCounter++;
                        bool forceUpdate = false;
                        
                        string charName = mumble.CharacterName;
                        int professionId = (int)mumble.Profession;
                        int specId = mumble.Specialization;

                        if (charName != lastPresenceCharName || mumble.MapId != lastPresenceMapId)
                        {
                            lastPresenceCharName = charName;
                            lastPresenceMapId = mumble.MapId;
                            forceUpdate = true;
                        }

                        // Update every 10 seconds (100 ticks of 100ms) or on forceUpdate
                        if (forceUpdate || discordTickCounter >= 100)
                        {
                            discordTickCounter = 0;
                            UpdateDiscordPresence(charName, professionId, specId);
                        }
                    }
                }
                catch { }

                if (mumble.MapId == 0) return;

                if (mumble.MapId != lastMapId)
                {
                    var _ = Task.Run(() => UpdateMapMetadata(mumble.MapId));
                    lastMapId = mumble.MapId;
                }

                if (mapRectW != 0 && mapView.CoreWebView2 != null)
                {
                    double avatarXInches = mumble.AvatarPosition.X * 39.3700787;
                    double avatarZInches = mumble.AvatarPosition.Z * 39.3700787;
                    double fX = contRectX + ((avatarXInches - mapRectX) / mapRectW * contRectW);
                    double fY = contRectY + ((1 - ((avatarZInches - mapRectY) / mapRectH)) * contRectH);
                    string script = $"var frame = document.getElementById('map-frame'); if(frame && frame.contentWindow && frame.contentWindow.updatePlayerLocation) frame.contentWindow.updatePlayerLocation({fX.ToString(CultureInfo.InvariantCulture)}, {fY.ToString(CultureInfo.InvariantCulture)}, {mumble.CameraFront.X.ToString(CultureInfo.InvariantCulture)}, {mumble.CameraFront.Z.ToString(CultureInfo.InvariantCulture)}, {mumble.AvatarPosition.Y.ToString(CultureInfo.InvariantCulture)});";
                    mapView.CoreWebView2.ExecuteScriptAsync(script);
                }
            }
            catch { }
        }

        private async Task UpdateMapMetadata(int mapId)
        {
            try
            {
                var mapData = await gw2Client.WebApi.V2.Maps.GetAsync(mapId);
                currentMapName = mapData.Name;
                mapRectX = mapData.MapRect.TopLeft.X;
                mapRectY = mapData.MapRect.BottomRight.Y;
                mapRectW = mapData.MapRect.BottomRight.X - mapData.MapRect.TopLeft.X;
                mapRectH = mapData.MapRect.TopLeft.Y - mapData.MapRect.BottomRight.Y;
                contRectX = mapData.ContinentRect.TopLeft.X;
                contRectY = mapData.ContinentRect.TopLeft.Y;
                contRectW = mapData.ContinentRect.BottomRight.X - mapData.ContinentRect.TopLeft.X;
                contRectH = mapData.ContinentRect.BottomRight.Y - mapData.ContinentRect.TopLeft.Y;

                this.Invoke((MethodInvoker)delegate {
                    if (mapView.CoreWebView2 != null)
                    {
                        _ = mapView.CoreWebView2.ExecuteScriptAsync($"var frame = document.getElementById('map-frame'); if(frame && frame.contentWindow) {{ frame.contentWindow.currentMapId = {mapId}; frame.contentWindow.currentMapName = '{currentMapName.Replace("'", "\\'")}'; }}");
                    }
                });
            }
            catch { }
        }

        private void SetDiscordRpcEnabled(bool enabled)
        {
            isDiscordRpcEnabled = enabled;
            if (enabled)
            {
                if (discordClient == null)
                {
                    // User's custom Client ID
                    discordClient = new DiscordRpcClient("1507749876094472202");
                    discordClient.Initialize();
                    lastPresenceCharName = ""; // Force immediate presence refresh
                    lastPresenceMapId = -1;
                }
            }
            else
            {
                if (discordClient != null)
                {
                    try
                    {
                        discordClient.ClearPresence();
                        discordClient.Dispose();
                    }
                    catch { }
                    discordClient = null;
                    lastPresenceCharName = "";
                    lastPresenceMapId = -1;
                }
            }
        }

        private void UpdateDiscordPresence(string charName, int professionId, int specId)
        {
            if (discordClient == null || !isDiscordRpcEnabled) return;

            if (string.IsNullOrEmpty(charName))
            {
                discordClient.SetPresence(new RichPresence()
                {
                    Details = "In Character Select",
                    State = "Main Menu",
                    Assets = new Assets()
                    {
                        LargeImageKey = "app_logo",
                        LargeImageText = "Tyrian Lens"
                    }
                });
                return;
            }

            if (charName != lastCharacterName)
            {
                lastCharacterName = charName;
                sessionStartTime = DateTime.UtcNow;
            }

            string specName = GetSpecializationName(specId, professionId);
            string baseProfName = GetBaseProfessionName(professionId);
            string classDisplay = specId > 0 && specName != baseProfName ? $"{specName} ({baseProfName})" : baseProfName;
            
            string details = $"{charName}";
            string state = $"Exploring {currentMapName}";

            var presence = new RichPresence()
            {
                Details = details,
                State = state,
                Timestamps = new Timestamps()
                {
                    Start = sessionStartTime
                },
                Assets = new Assets()
                {
                    LargeImageKey = "app_logo",
                    LargeImageText = "Tyrian Lens",
                    SmallImageKey = specName.ToLowerInvariant(),
                    SmallImageText = classDisplay
                }
            };

            discordClient.SetPresence(presence);
        }

        private static string GetSpecializationName(int specId, int professionId)
        {
            return specId switch
            {
                // Guardian
                5 => "Dragonhunter",
                62 => "Firebrand",
                65 => "Willbender",
                // Warrior
                18 => "Berserker",
                61 => "Spellbreaker",
                68 => "Bladesworn",
                // Engineer
                27 => "Scrapper",
                58 => "Holosmith",
                70 => "Mechanist",
                // Ranger
                30 => "Druid",
                55 => "Soulbeast",
                72 => "Untamed",
                // Thief
                7 => "Daredevil",
                57 => "Deadeye",
                71 => "Specter",
                // Elementalist
                48 => "Tempest",
                56 => "Weaver",
                73 => "Catalyst",
                // Mesmer
                40 => "Chronomancer",
                59 => "Mirage",
                66 => "Virtuoso",
                // Necromancer
                34 => "Reaper",
                60 => "Scourge",
                64 => "Harbinger",
                // Revenant
                52 => "Herald",
                63 => "Renegade",
                69 => "Vindicator",
                // Fallback to base profession
                _ => GetBaseProfessionName(professionId)
            };
        }

        private static string GetBaseProfessionName(int professionId)
        {
            return professionId switch
            {
                1 => "Guardian",
                2 => "Warrior",
                3 => "Engineer",
                4 => "Ranger",
                5 => "Thief",
                6 => "Elementalist",
                7 => "Mesmer",
                8 => "Necromancer",
                9 => "Revenant",
                _ => "Unknown Class"
            };
        }

#if DEBUG
        private string GetLocalDataFilePath(string filename)
        {
            string localFolder = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location) ?? AppDomain.CurrentDomain.BaseDirectory;
            string dataPath = Path.GetFullPath(Path.Combine(localFolder, @"..\..\..\Data", filename));
            if (!File.Exists(dataPath))
            {
                dataPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", filename);
            }
            return dataPath;
        }

        private void SaveJsonWithBackup(string filepath, string content)
        {
            try
            {
                string? dir = Path.GetDirectoryName(filepath);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) Directory.CreateDirectory(dir);

                string backupPath = filepath + ".bak";
                if (File.Exists(filepath))
                {
                    File.Copy(filepath, backupPath, true);
                }
                File.WriteAllText(filepath, content, Encoding.UTF8);
            }
            catch (Exception ex)
            {
                LogError(ex);
            }
        }

        private void DevDeleteMarker(string filename, double posX, double posY)
        {
            string filepath = GetLocalDataFilePath(filename);
            if (!File.Exists(filepath)) return;

            string jsonContent = File.ReadAllText(filepath);
            var array = JArray.Parse(jsonContent);
            JObject? toRemove = null;

            foreach (var item in array.Children<JObject>())
            {
                var pos = item["pos"] as JArray;
                if (pos != null && pos.Count >= 2)
                {
                    double x = (double)pos[0];
                    double y = (double)pos[1];
                    if (Math.Abs(x - posX) < 0.15 && Math.Abs(y - posY) < 0.15)
                    {
                        toRemove = item;
                        break;
                    }
                }
            }

            if (toRemove != null)
            {
                array.Remove(toRemove);
                string updatedJson = JsonConvert.SerializeObject(array, Formatting.Indented);
                SaveJsonWithBackup(filepath, updatedJson);
            }
        }

        private void DevDeleteCategory(string filename, string category)
        {
            string filepath = GetLocalDataFilePath(filename);
            if (!File.Exists(filepath)) return;

            string jsonContent = File.ReadAllText(filepath);
            var array = JArray.Parse(jsonContent);
            var toRemoveList = new System.Collections.Generic.List<JObject>();

            foreach (var item in array.Children<JObject>())
            {
                string? layer = item["layer"]?.ToString() ?? item["type"]?.ToString();
                if (layer != null && string.Equals(layer, category, StringComparison.OrdinalIgnoreCase))
                {
                    toRemoveList.Add(item);
                }
            }

            if (toRemoveList.Count > 0)
            {
                foreach (var item in toRemoveList)
                {
                    array.Remove(item);
                }
                string updatedJson = JsonConvert.SerializeObject(array, Formatting.Indented);
                SaveJsonWithBackup(filepath, updatedJson);
            }
        }

        private void DevShiftCategory128(string filename, string category)
        {
            string filepath = GetLocalDataFilePath(filename);
            if (!File.Exists(filepath)) return;

            string jsonContent = File.ReadAllText(filepath);
            var array = JArray.Parse(jsonContent);
            int shiftCount = 0;

            foreach (var item in array.Children<JObject>())
            {
                string? layer = item["layer"]?.ToString() ?? item["type"]?.ToString();
                if (layer != null && string.Equals(layer, category, StringComparison.OrdinalIgnoreCase))
                {
                    var pos = item["pos"] as JArray;
                    if (pos != null && pos.Count >= 2)
                    {
                        double y = (double)pos[1];
                        pos[1] = Math.Round((y + 128.0) * 10.0) / 10.0;
                        shiftCount++;
                    }
                }
            }

            if (shiftCount > 0)
            {
                string updatedJson = JsonConvert.SerializeObject(array, Formatting.Indented);
                SaveJsonWithBackup(filepath, updatedJson);
            }
        }

        private void DevMoveMarker(string filename, double origX, double origY, double newX, double newY, double newZ)
        {
            string filepath = GetLocalDataFilePath(filename);
            if (!File.Exists(filepath)) return;

            string jsonContent = File.ReadAllText(filepath);
            var array = JArray.Parse(jsonContent);
            bool modified = false;

            foreach (var item in array.Children<JObject>())
            {
                var pos = item["pos"] as JArray;
                if (pos != null && pos.Count >= 2)
                {
                    double x = (double)pos[0];
                    double y = (double)pos[1];
                    if (Math.Abs(x - origX) < 0.15 && Math.Abs(y - origY) < 0.15)
                    {
                        pos[0] = Math.Round(newX * 10.0) / 10.0;
                        pos[1] = Math.Round(newY * 10.0) / 10.0;
                        item["alt"] = Math.Round(newZ * 100.0) / 100.0;
                        modified = true;
                        break;
                    }
                }
            }

            if (modified)
            {
                string updatedJson = JsonConvert.SerializeObject(array, Formatting.Indented);
                SaveJsonWithBackup(filepath, updatedJson);
            }
        }
#endif
    }
}