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

namespace GW2PS
{
    public partial class Form1 : Form
    {
        private Microsoft.Web.WebView2.WinForms.WebView2 mapView = new Microsoft.Web.WebView2.WinForms.WebView2();
        private IGw2Client gw2Client = new Gw2Client();
        private System.Windows.Forms.Timer gpsTimer = new System.Windows.Forms.Timer();
        private bool isWikiIntegrated = true;

        private int lastMapId = -1;
        private double mapRectX, mapRectY, mapRectW, mapRectH;
        private double contRectX, contRectY, contRectW, contRectH;

        public const int WM_NCLBUTTONDOWN = 0xA1;
        public const int HT_CAPTION = 0x2;
        public const int WM_NCHITTEST = 0x84;
        public const int HTBOTTOMRIGHT = 17;

        [DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
        [DllImport("user32.dll")]
        public static extern bool ReleaseCapture();

        public Form1()
        {
            InitializeComponent();
            this.Text = "Tyrian Lens";
            this.Size = new Size(1400, 900);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.DoubleBuffered = true;
            this.SetStyle(ControlStyles.ResizeRedraw, true);

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

            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            await mapView.EnsureCoreWebView2Async(env);

            mapView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            mapView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;

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

            string localFolder = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location) ?? AppDomain.CurrentDomain.BaseDirectory;
            mapView.CoreWebView2.SetVirtualHostNameToFolderMapping("gw2ps.local", localFolder, CoreWebView2HostResourceAccessKind.Allow);

            // Handle the "In-Style" Welcome Overlay logic
            mapView.NavigationCompleted += async (s, e) =>
            {
                if (File.Exists(dontShowFilePath)) return;

                string checkKeysScript = @"(function() {
                    try {
                        const keys = JSON.parse(localStorage.getItem('gw2_api_accounts') || '[]');
                        return keys.length > 0;
                    } catch(e) { return false; }
                })()";

                string hasKeysStr = await mapView.CoreWebView2.ExecuteScriptAsync(checkKeysScript);
                if (hasKeysStr == "true") return;

                string injectPopupScript = @"
                    (function() {
                        if (document.getElementById('welcome-overlay')) return;
                        const overlay = document.createElement('div');
                        overlay.id = 'welcome-overlay';
                        overlay.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; font-family: ""Crimson Text"", serif; color: #e2c07d;';
                        
                        overlay.innerHTML = `
                            <div style='background: #1a1510; border: 1px solid #4a3b2a; padding: 30px; width: 420px; text-align: center; box-shadow: 0 0 30px #000;'>
                                <h2 style='text-transform: uppercase; letter-spacing: 2px; margin-top:0; color: #f0dca5;'>Tyrian Lens Setup</h2>
                                <p style='font-size: 14px; line-height: 1.6; color: #e2c07d;'>
                                    Welcome! Thank you for downloading Tyrian Lens! 
                                    <br>
                                    Please note that most features (Inventory, Bank, and Characters) require an API Key to function.
                                    <br><br>
                                    To begin, click on <b>API Management <img src=""https://wiki.guildwars2.com/images/0/0e/Game_menu_edit_account_icon.png"" style=""height: 1em; vertical-align: middle;""></b> and add an api key from <a href=""https://account.arena.net"" target=""_blank"" rel=""noopener noreferrer"" style=""color: #f0dca5; text-decoration: underline;"">account.arena.net</a>.
                                </p>
                                <div style='margin-top: 25px; display: flex; gap: 15px;'>
                                    <button id='btn-ok' style='flex:1; background:#e2c07d; color:#1a1510; border:none; padding:12px; cursor:pointer; font-weight:bold; font-family: inherit; text-transform: uppercase;'>Got it</button>
                                    <button id='btn-never' style='flex:1; background:transparent; border:1px solid #4a3b2a; color:#8a7a5f; padding:12px; cursor:pointer; font-size: 11px; font-family: inherit; text-transform: uppercase;'>Don't show again</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(overlay);

                        document.getElementById('btn-ok').onclick = () => overlay.remove();
                        document.getElementById('btn-never').onclick = () => {
                            window.chrome.webview.postMessage('hide_welcome_forever');
                            overlay.remove();
                        };
                    })()";

                await mapView.CoreWebView2.ExecuteScriptAsync(injectPopupScript);
            };

            mapView.CoreWebView2.WebMessageReceived += (s, e) => {
                string msg = e.TryGetWebMessageAsString();
                if (msg == null) return;

                if (msg.StartsWith("setWikiIntegrated:"))
                {
                    isWikiIntegrated = msg.Split(':')[1].ToLower() == "true";
                }
                else if (msg == "hide_welcome_forever")
                {
                    if (!Directory.Exists(userDataFolder)) Directory.CreateDirectory(userDataFolder);
                    File.WriteAllText(dontShowFilePath, "hidden");
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
            };

            mapView.Source = new Uri("https://gw2ps.local/index.html");
            gpsTimer.Interval = 100;
            gpsTimer.Tick += GpsTimer_Tick;
            gpsTimer.Start();
        }

        private void GpsTimer_Tick(object sender, EventArgs e)
        {
            try
            {
                var mumble = gw2Client.Mumble;
                mumble.Update();
                if (mumble.MapId == 0) return;
                if (mumble.MapId != lastMapId) { _ = UpdateMapMetadata(mumble.MapId); lastMapId = mumble.MapId; }
                if (mapRectW != 0 && mapView.CoreWebView2 != null)
                {
                    double avatarXInches = mumble.AvatarPosition.X * 39.3700787;
                    double avatarZInches = mumble.AvatarPosition.Z * 39.3700787;
                    double fX = contRectX + ((avatarXInches - mapRectX) / mapRectW * contRectW);
                    double fY = contRectY + ((1 - ((avatarZInches - mapRectY) / mapRectH)) * contRectH);
                    string script = $"var frame = document.getElementById('map-frame'); if(frame && frame.contentWindow && frame.contentWindow.updatePlayerLocation) frame.contentWindow.updatePlayerLocation({fX.ToString(CultureInfo.InvariantCulture)}, {fY.ToString(CultureInfo.InvariantCulture)}, {mumble.CameraFront.X.ToString(CultureInfo.InvariantCulture)}, {mumble.CameraFront.Z.ToString(CultureInfo.InvariantCulture)});";
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
                mapRectX = mapData.MapRect.TopLeft.X;
                mapRectY = mapData.MapRect.BottomRight.Y;
                mapRectW = mapData.MapRect.BottomRight.X - mapData.MapRect.TopLeft.X;
                mapRectH = mapData.MapRect.TopLeft.Y - mapData.MapRect.BottomRight.Y;
                contRectX = mapData.ContinentRect.TopLeft.X;
                contRectY = mapData.ContinentRect.TopLeft.Y;
                contRectW = mapData.ContinentRect.BottomRight.X - mapData.ContinentRect.TopLeft.X;
                contRectH = mapData.ContinentRect.BottomRight.Y - mapData.ContinentRect.TopLeft.Y;
            }
            catch { }
        }
    }
}