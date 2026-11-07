/**
 * Tyrian Lens - Unlock Radar Engine
 * Tracks nearest untracked wardrobe vendors, skins, and achievements on the current map.
 * Features:
 * - Real-time throttled proximity detection (1.5s interval, ~0% CPU)
 * - True cardinal direction (North, North-East, East, etc.) & altitude chevrons
 * - Cross-references account unlocks (/v2/account/skins, /v2/account/minis, /v2/account/achievements)
 * - Proximity alerts with customizable sound (MP3s) or Text-To-Speech (TTS Male/Female)
 * - Dynamic multi-language localization (EN, DE, ES, FR)
 * - Instant account refresh on API key switch
 */
(function (window) {
	'use strict';

	let wardrobeVendors = [];
	let achievementNodes = [];
	let isDataLoaded = false;

	// Telemetry State
	let playerX = 0;
	let playerY = 0;
	let playerZ = 100;
	let currentMapId = 0;
	let lastTelemetryTime = 0;

	// Account unlock caches
	let unlockedSkins = new Set();
	let unlockedMinis = new Set();
	let completedAchievements = new Set();

	// Proximity Alert Enter-State: targetId -> { inRange: boolean, lastAlert: number }
	const targetRangeState = new Map();
	let lastGlobalAlertTime = 0;

	// Default Settings
	let radarSettings = {
		enabled: true,
		sound: "https://gw2ps.local/Assets/Sounds/timers_notification_boopboop.mp3",
		proximityRadius: 1500,
		volume: 80,
		hideUnlocked: true,
		toggles: {}
	};

	window.__lastRadarItems = [];

	function loadSettings() {
		try {
			const saved = localStorage.getItem('gw2_radar_settings');
			if (saved) {
				radarSettings = Object.assign(radarSettings, JSON.parse(saved));
			}
		} catch (e) { }
	}

	function getActiveApiKey() {
		let key = localStorage.getItem('gw2_active_key') || localStorage.getItem('gw2_api_key');
		if (!key) {
			try {
				const raw = localStorage.getItem('gw2_api_accounts');
				if (raw) {
					const arr = JSON.parse(raw);
					if (arr && arr.length > 0 && (arr[0].key || arr[0].apiKey)) {
						key = arr[0].key || arr[0].apiKey;
					}
				}
			} catch (e) { }
		}
		return key;
	}

	// 1. Initialize Engine & Load Databases
	async function initRadarEngine() {
		loadSettings();
		await loadAccountUnlocks();

		try {
			// Load Wardrobe Vendors
			const resVendors = (window.DataLoader ? await window.DataLoader.fetchDataFile("nodes_wardrobe_vendors.json") : null) 
				|| await fetch("https://data.tyrianlens.com/nodes_wardrobe_vendors.json?t=" + Date.now())
				|| await fetch("https://gw2ps.local/Data/nodes_wardrobe_vendors.json?t=" + Date.now());
			if (resVendors && resVendors.ok) {
				const text = await resVendors.text();
				wardrobeVendors = JSON.parse(text.replace(/^\uFEFF/, '').trim());
			}
		} catch (e) {
			console.warn('[Radar Engine] Failed local wardrobe fetch:', e.message);
		}

		try {
			// Load Achievements
			const resAch = (window.DataLoader ? await window.DataLoader.fetchDataFile("nodes_achievements.json") : null)
				|| await fetch("https://data.tyrianlens.com/nodes_achievements.json?t=" + Date.now())
				|| await fetch("https://gw2ps.local/Data/nodes_achievements.json?t=" + Date.now());
			if (resAch && resAch.ok) {
				const text = await resAch.text();
				achievementNodes = JSON.parse(text.replace(/^\uFEFF/, '').trim());
			}
		} catch (e) {
			console.warn('[Radar Engine] Failed local achievements fetch:', e.message);
		}

		isDataLoaded = true;
		console.log(`[Radar Engine] Initialized: ${wardrobeVendors.length} vendors, ${achievementNodes.length} achievement nodes.`);

		// Initial render of HUD state
		updateHudVisibility();

		// Start throttled engine tick (every 1500ms)
		setInterval(radarEngineTick, 1500);

		// Periodically poll achievements (every 60s, initial check after 5s)
		setTimeout(pollAccountAchievements, 5000);
		setInterval(pollAccountAchievements, 60000);
	}

	// Periodic Achievement Completion Poller (every 60s)
	async function pollAccountAchievements() {
		const key = getActiveApiKey();
		if (!key) return;
		try {
			const r = await fetch(`https://api.guildwars2.com/v2/account/achievements?access_token=${key}`);
			if (r.ok) {
				const arr = await r.json();
				const newCompleted = new Set((arr || []).filter(a => a.done).map(a => a.id));
				
				let changed = false;
				if (newCompleted.size !== completedAchievements.size) {
					changed = true;
				} else {
					for (const id of newCompleted) {
						if (!completedAchievements.has(id)) {
							changed = true;
							break;
						}
					}
				}

				if (changed) {
					console.log(`[Radar Engine] Achievement update detected: ${newCompleted.size} completed. Refreshing radar...`);
					completedAchievements = newCompleted;
					localStorage.setItem(`gw2_cache_achievements_${key}`, JSON.stringify(arr));
					// Immediately recalculate candidates and update HUD & feed
					radarEngineTick();
				}
			}
		} catch (e) {
			console.warn('[Radar Engine] Error polling account achievements:', e.message);
		}
	}

	// Load Account Unlocks from LocalStorage Caches or API
	async function loadAccountUnlocks(overrideKey) {
		const key = overrideKey || getActiveApiKey();
		if (!key) return;

		// 1. Skins
		try {
			const cachedSkins = localStorage.getItem(`gw2_cache_skins_${key}`) || localStorage.getItem('gw2_cache_skins');
			if (cachedSkins && !overrideKey) {
				unlockedSkins = new Set(JSON.parse(cachedSkins));
			} else {
				const r = await fetch(`https://api.guildwars2.com/v2/account/skins?access_token=${key}`);
				if (r.ok) {
					const arr = await r.json();
					unlockedSkins = new Set(arr);
					localStorage.setItem(`gw2_cache_skins_${key}`, JSON.stringify(arr));
				}
			}
		} catch (e) { }

		// 2. Minis
		try {
			const cachedMinis = localStorage.getItem(`gw2_cache_minis_${key}`) || localStorage.getItem('gw2_cache_minis');
			if (cachedMinis && !overrideKey) {
				unlockedMinis = new Set(JSON.parse(cachedMinis));
			} else {
				const r = await fetch(`https://api.guildwars2.com/v2/account/minis?access_token=${key}`);
				if (r.ok) {
					const arr = await r.json();
					unlockedMinis = new Set(arr);
					localStorage.setItem(`gw2_cache_minis_${key}`, JSON.stringify(arr));
				}
			}
		} catch (e) { }

		// 3. Achievements
		try {
			const cachedAch = localStorage.getItem(`gw2_cache_achievements_${key}`) || localStorage.getItem('gw2_cache_achievements');
			if (cachedAch && !overrideKey) {
				const arr = JSON.parse(cachedAch);
				completedAchievements = new Set((arr || []).filter(a => a.done).map(a => a.id));
			} else {
				const r = await fetch(`https://api.guildwars2.com/v2/account/achievements?access_token=${key}`);
				if (r.ok) {
					const arr = await r.json();
					completedAchievements = new Set((arr || []).filter(a => a.done).map(a => a.id));
					localStorage.setItem(`gw2_cache_achievements_${key}`, JSON.stringify(arr));
				}
			}
		} catch (e) { }
	}

	// 2. Receive Player Telemetry from map.html
	window.updateRadarTelemetry = function (x, y, alt, cx, cz, mapId) {
		playerX = parseFloat(x) || 0;
		playerY = parseFloat(y) || 0;
		if (alt !== undefined && alt !== null) playerZ = parseFloat(alt);
		if (mapId && parseInt(mapId) > 0) currentMapId = parseInt(mapId);
		lastTelemetryTime = Date.now();
	};

	// 3. Mathematical Helpers
	function getCardinalDirection(px, py, tx, ty) {
		const dx = tx - px;
		const dy = ty - py; // +Y is South, -Y is North
		let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
		if (deg < 0) deg += 360;

		const dirList = [
			{ key: 'radar.dir_n', text: "North" },
			{ key: 'radar.dir_ne', text: "North-East" },
			{ key: 'radar.dir_e', text: "East" },
			{ key: 'radar.dir_se', text: "South-East" },
			{ key: 'radar.dir_s', text: "South" },
			{ key: 'radar.dir_sw', text: "South-West" },
			{ key: 'radar.dir_w', text: "West" },
			{ key: 'radar.dir_nw', text: "North-West" }
		];
		const index = Math.round(deg / 45) % 8;
		return dirList[index];
	}

	function calculateDistanceUnits(px, py, tx, ty) {
		const distUnits = Math.hypot(tx - px, ty - py);
		return Math.round(distUnits);
	}

	// Helper to resolve vendor category toggle key
	function getVendorToggleKey(v) {
		let vType = v.vendor_type || 'merchant';
		if (vType === 'weaponsmith') {
			const name = (v.npc_name || '').toLowerCase();
			const isCultural = name.includes('cultural weapon') || name.includes('tier') ||
				(v.items || []).some(it => (it.item_name || '').toLowerCase().includes('tier') || (it.item_name || '').toLowerCase().includes('cultural'));
			return isCultural ? 'vendor_cultural_weaponsmith' : 'vendor_merchant';
		}
		if (vType === 'cultural_armorsmith') return 'vendor_cultural_armorsmith';
		if (vType === 'heart') return 'vendor_heart';
		if (vType === 'karma_merchant') return 'vendor_karma_merchant';
		if (vType === 'dungeon_merchant') return 'vendor_dungeon_merchant';
		if (vType === 'faction_provisioner') return 'vendor_faction_provisioner';
		if (vType === 'laurel_merchant') return 'vendor_laurel_merchant';
		if (vType === 'guild_commendation') return 'vendor_guild_commendation';
		if (vType === 'map_collector' || vType === 'magic') return 'vendor_map_collector';
		if (vType === 'festival_merchant') return 'vendor_festival_merchant';
		if (vType === 'minis' || vType === 'novelty') return 'vendor_minis_novelties';
		return 'vendor_merchant';
	}

	function getEffectiveMapId() {
		if (currentMapId > 0) return currentMapId;
		try {
			const frame = document.getElementById('map-frame');
			if (frame && frame.contentWindow && frame.contentWindow.currentMapId) {
				const fMap = parseInt(frame.contentWindow.currentMapId);
				if (fMap > 0) {
					currentMapId = fMap;
					return currentMapId;
				}
			}
		} catch (e) { }
		return 0;
	}

	// 4. Radar Engine Tick
	function radarEngineTick() {
		if (!isDataLoaded || !playerX || !playerY) return;
		loadSettings();

		if (radarSettings.enabled === false) {
			updateHudVisibility();
			return;
		}

		const activeMapId = getEffectiveMapId();
		const toggles = radarSettings.toggles || {};
		const hideUnlocked = (radarSettings.hideUnlocked !== false);
		const candidates = [];

		// A. Check Wardrobe Vendors
		for (let i = 0; i < wardrobeVendors.length; i++) {
			const v = wardrobeVendors[i];
			if (!v.pos || v.pos.length < 2) continue;

			// Strict current map confinement
			if (activeMapId > 0) {
				const vMap = parseInt(v.map_id);
				if (!vMap || vMap !== activeMapId) {
					continue;
				}
			}

			// Check Vendor Category Toggle
			const toggleKey = getVendorToggleKey(v);
			if (toggles[toggleKey] === false) {
				continue;
			}

			// Filter items at this vendor
			const items = v.items || [];
			let eligibleItems = [];
			let unlockedCount = 0;

			for (let j = 0; j < items.length; j++) {
				const item = items[j];
				const isSkinUnlocked = item.skin_id && unlockedSkins.has(item.skin_id);
				const isMiniUnlocked = item.unlock_id && (unlockedMinis.has(item.unlock_id) || unlockedSkins.has(item.unlock_id));
				const isUnlocked = isSkinUnlocked || isMiniUnlocked;

				if (isUnlocked) {
					unlockedCount++;
					if (hideUnlocked) continue;
				}

				// Check Achievement Gating
				if (item.achievement_id && !completedAchievements.has(item.achievement_id)) continue;

				eligibleItems.push(item);
			}

			if (eligibleItems.length > 0) {
				const dist = calculateDistanceUnits(playerX, playerY, v.pos[0], v.pos[1]);
				const dirInfo = getCardinalDirection(playerX, playerY, v.pos[0], v.pos[1]);
				const altDiff = (v.alt || 100) - playerZ;

				let countDesc = '';
				if (!hideUnlocked && unlockedCount === items.length) {
					countDesc = `All unlocked (${unlockedCount}/${items.length})`;
				} else {
					countDesc = eligibleItems.length === 1
						? (window.DataLoader ? window.DataLoader.t('radar.unlocks_singular', '1 unlock') : '1 unlock')
						: (window.DataLoader ? window.DataLoader.t('radar.unlocks_plural', '{0} unlocks', [eligibleItems.length]) : `${eligibleItems.length} unlocks`);
					if (eligibleItems[0] && eligibleItems[0].item_name) {
						countDesc += ` — ${eligibleItems[0].item_name}`;
					}
				}

				candidates.push({
					id: `vendor_${v.npc_name}_${v.pos[0]}_${v.pos[1]}`,
					name: v.npc_name,
					sub: countDesc,
					type: 'vendor',
					pos: v.pos,
					dist: dist,
					dir: dirInfo.text,
					dirKey: dirInfo.key,
					altDiff: altDiff,
					icon: v.icon || 'https://wiki.guildwars2.com/images/4/44/Merchant_%28map_icon%29.png',
					items: eligibleItems.map(it => ({
						id: it.item_id,
						name: it.item_name,
						skin_id: it.skin_id,
						type: it.type,
						sub_type: it.sub_type,
						cost: it.cost,
						unlocked: (it.skin_id && unlockedSkins.has(it.skin_id)) || (it.unlock_id && unlockedMinis.has(it.unlock_id))
					}))
				});
			}
		}

		// B. Check Mapped Achievements
		for (let i = 0; i < achievementNodes.length; i++) {
			const a = achievementNodes[i];
			if (!a.pos || a.pos.length < 2) continue;

			// Strict current map confinement
			if (activeMapId > 0) {
				const aMap = parseInt(a.map_id);
				if (!aMap || aMap !== activeMapId) {
					continue;
				}
			}

			// Check Achievement Layer Toggle
			if (toggles[a.layer] === false) continue;

			// Check if already completed
			const isDone = a.achievement_id && completedAchievements.has(parseInt(a.achievement_id));
			if (isDone && hideUnlocked) continue;

			const dist = calculateDistanceUnits(playerX, playerY, a.pos[0], a.pos[1]);
			const dirInfo = getCardinalDirection(playerX, playerY, a.pos[0], a.pos[1]);
			const altDiff = (a.alt || 100) - playerZ;

			candidates.push({
				id: `ach_${a.node}_${a.pos[0]}_${a.pos[1]}`,
				name: a.node,
				sub: isDone ? 'Completed' : (a.yields ? a.yields.join(', ') : (a.desc || 'Achievement')),
				type: 'achievement',
				pos: a.pos,
				dist: dist,
				dir: dirInfo.text,
				dirKey: dirInfo.key,
				altDiff: altDiff,
				icon: a.icon || 'https://wiki.guildwars2.com/images/c/ca/Explorer.png'
			});
		}

		// Sort by Distance ascending
		candidates.sort((a, b) => a.dist - b.dist);

		// Top 3 for On-Screen HUD
		const top3 = candidates.slice(0, 3);
		window.__lastRadarItems = top3;
		renderRadarHud(top3);

		// Top 5 for Left-Panel Live Feed
		broadcastRadarFeed(candidates.slice(0, 5));

		// Check Proximity Sound for the closest target
		if (top3.length > 0) {
			checkProximityAlert(top3[0]);
		}
	}

	function formatAltInfo(altDiff) {
		const diff = Math.round(altDiff || 0);
		if (diff > 8) {
			return { text: `▲ ${diff} units up`, className: 'radar-alt-up' };
		} else if (diff < -8) {
			return { text: `▼ ${Math.abs(diff)} units down`, className: 'radar-alt-down' };
		} else {
			return { text: '• level', className: '' };
		}
	}

	// 5. Render On-Screen HUD (In-Place DOM Synchronization to prevent hover flickering)
	function renderRadarHud(items) {
		const hud = document.getElementById('radar-hud');
		if (!hud) return;

		updateHudVisibility();
		if (radarSettings.enabled === false || window.isWikiOpen) return;

		const list = document.getElementById('radar-hud-list');
		if (!list) return;

		if (!items.length) {
			const emptyMsg = window.DataLoader ? window.DataLoader.t('radar.hud_empty', 'No untracked collectibles nearby on this map.') : 'No untracked collectibles nearby on this map.';
			const existingEmpty = list.querySelector('.radar-hud-empty');
			if (existingEmpty) {
				if (existingEmpty.textContent !== emptyMsg) existingEmpty.textContent = emptyMsg;
			} else {
				list.innerHTML = `<div class="radar-hud-empty">${emptyMsg}</div>`;
			}
			return;
		}

		// Remove any empty message element
		const emptyEl = list.querySelector('.radar-hud-empty');
		if (emptyEl) emptyEl.remove();

		const existingRows = new Map();
		list.querySelectorAll('.radar-hud-row').forEach(r => {
			const rid = r.getAttribute('data-id');
			if (rid) existingRows.set(rid, r);
		});

		window.__lastRadarItems = items;

		items.forEach((it, idx) => {
			const altInfo = formatAltInfo(it.altDiff);
			const dirDisplay = (window.DataLoader && it.dirKey) ? window.DataLoader.t(it.dirKey, it.dir) : it.dir;
			const descText = ' • ' + (it.sub || '');
			const distStr = `${it.dist} units`;
			const rowId = it.id || `hud_${idx}`;

			let row = existingRows.get(rowId);
			if (row) {
				existingRows.delete(rowId);
				const distEl = row.querySelector('.radar-row-dist');
				if (distEl && distEl.textContent !== distStr) distEl.textContent = distStr;

				const dirEl = row.querySelector('.radar-badge-dir');
				if (dirEl && dirEl.textContent !== dirDisplay) dirEl.textContent = dirDisplay;

				const altEl = row.querySelector('.radar-row-alt');
				if (altEl) {
					if (altEl.textContent !== altInfo.text) altEl.textContent = altInfo.text;
					const targetClass = `radar-row-alt ${altInfo.className}`.trim();
					if (altEl.className !== targetClass) altEl.className = targetClass;
				}

				const descEl = row.querySelector('.radar-row-desc');
				if (descEl && descEl.textContent !== descText) descEl.textContent = descText;

				row.onclick = () => window.jumpToRadarTarget(it);
			} else {
				row = document.createElement('div');
				row.className = 'radar-hud-row';
				row.setAttribute('data-id', rowId);
				row.title = 'Click to view on map';
				row.innerHTML = `
					<div class="radar-row-left">
						<img class="radar-row-icon" src="${it.icon}" />
						<span class="radar-row-name">${it.name}</span>
						<span class="radar-row-desc">${descText}</span>
					</div>
					<div class="radar-row-right">
						<span class="radar-row-dist">${distStr}</span>
						<span class="radar-badge-dir">${dirDisplay}</span>
						<span class="radar-row-alt ${altInfo.className}">${altInfo.text}</span>
					</div>
				`;
				row.onclick = () => window.jumpToRadarTarget(it);
			}

			list.appendChild(row);
		});

		existingRows.forEach(r => r.remove());
		notifyHudState();
	}

	function notifyHudState() {
		const hud = document.getElementById('radar-hud');
		if (!hud) return;
		const isVisible = (hud.style.display !== 'none' && !window.isWikiOpen && radarSettings.enabled !== false);
		let bottom = 20;
		if (isVisible) {
			const rect = hud.getBoundingClientRect();
			const menuEl = document.getElementById('menu-container');
			const menuHeight = menuEl ? menuEl.offsetHeight : 45;
			const calcBottom = (rect.bottom > 0) ? (rect.bottom - menuHeight + 12) : 185;
			bottom = Math.max(140, Math.round(calcBottom));
		}
		if (typeof window.postToFrames === 'function') {
			window.postToFrames({
				action: 'radarHudState',
				visible: isVisible,
				bottom: bottom
			});
		}
	}
	window.notifyRadarHudState = notifyHudState;

	function updateHudVisibility() {
		const hud = document.getElementById('radar-hud');
		if (!hud) return;
		const targetDisplay = window.isWikiOpen ? 'none' : ((radarSettings.enabled !== false) ? 'block' : 'none');
		if (hud.style.display !== targetDisplay) {
			hud.style.display = targetDisplay;
		}
		notifyHudState();
	}
	window.updateRadarHudVisibility = updateHudVisibility;

	window.toggleRadarHud = function (show) {
		radarSettings.enabled = (show !== undefined) ? show : !radarSettings.enabled;
		localStorage.setItem('gw2_radar_settings', JSON.stringify(radarSettings));
		updateHudVisibility();
		// Notify panel if open
		window.postToFrames({ action: 'radarSettingsChanged', settings: radarSettings });
	};

	window.jumpToRadarTarget = function (item) {
		if (!item) return;
		const pos = item.pos || item;
		const mapFrame = document.getElementById('map-frame');
		if (mapFrame && mapFrame.contentWindow) {
			mapFrame.contentWindow.postMessage({
				action: 'jumpToLocation',
				x: pos[0],
				y: pos[1],
				pos: pos,
				markerIcon: item.icon,
				markerName: item.name,
				zoom: 6
			}, '*');
		}
	};

	// 6. Proximity Audio & TTS Alert (Single Enter-Trigger, No Repetitions)
	function checkProximityAlert(target) {
		const radius = radarSettings.proximityRadius || 1500;
		const now = Date.now();
		const state = targetRangeState.get(target.id) || { inRange: false, lastAlert: 0 };

		if (target.dist <= radius) {
			// Trigger only once when entering proximity radius
			if (!state.inRange) {
				state.inRange = true;
				// Check global throttle (at least 15 seconds between alerts)
				if (now - lastGlobalAlertTime >= 15000) {
					state.lastAlert = now;
					lastGlobalAlertTime = now;
					playRadarSound(radarSettings.sound, target.name);
				}
			}
		} else if (target.dist > radius + 200) {
			// Player moved away from target; reset so it can trigger if they return later
			state.inRange = false;
		}

		targetRangeState.set(target.id, state);
	}

	function playRadarSound(soundType, targetName) {
		if (!soundType || soundType === 'none') return;
		const vol = (radarSettings.volume !== undefined ? radarSettings.volume : 80) / 100;

		if (soundType === 'tts_male' || soundType === 'tts_female') {
			if ('speechSynthesis' in window) {
				const text = `Nearby: ${targetName}`;
				const msg = new SpeechSynthesisUtterance(text);
				const voices = window.speechSynthesis.getVoices();
				let voice = null;
				if (soundType === 'tts_male') {
					voice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('David') || v.name.includes('Mark'));
				} else {
					voice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Zira') || v.name.includes('Hazel'));
				}
				if (voice) msg.voice = voice;
				msg.volume = vol;
				window.speechSynthesis.speak(msg);
			}
		} else {
			const cleanUrl = soundType.replace(/\\/g, '/');
			const audio = new Audio(cleanUrl);
			audio.volume = vol;
			audio.play().catch(e => console.error('[Radar Sound Error]:', e));
		}
	}

	// 7. Communication with unlock_radar.html and index.html
	function broadcastRadarFeed(feedItems) {
		window.postToFrames({ action: 'radarFeedUpdate', items: feedItems });
	}

	window.addEventListener('message', async e => {
		const data = e.data;
		if (!data) return;

		if (data.action === 'radarSettingsChanged') {
			radarSettings = Object.assign(radarSettings, data.settings || {});
			updateHudVisibility();
			radarEngineTick();
		} else if (data.action === 'requestRadarFeed') {
			radarEngineTick();
		} else if (data.action === 'requestRadarHudState') {
			notifyHudState();
		} else if (data.action === 'switchAccount') {
			const newKey = data.apiKey || getActiveApiKey();
			unlockedSkins.clear();
			unlockedMinis.clear();
			completedAchievements.clear();
			targetRangeState.clear();
			lastGlobalAlertTime = 0;
			if (newKey) {
				try {
					localStorage.removeItem(`gw2_cache_skins_${newKey}`);
					localStorage.removeItem(`gw2_cache_minis_${newKey}`);
					localStorage.removeItem(`gw2_cache_achievements_${newKey}`);
				} catch (err) { }
			}
			await loadAccountUnlocks(newKey);
			radarEngineTick();
		} else if (data.action === 'languageChanged' || data.action === 'setWikiLang') {
			if (window.DataLoader) {
				await window.DataLoader.loadTranslations(true);
			}
			radarEngineTick();
		}
	});

	// Auto-start on load
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initRadarEngine);
	} else {
		initRadarEngine();
	}

})(window);
