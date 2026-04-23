const UI = {
    container: document.getElementById('wardrobe-container'),
    unlockedBtn: document.getElementById('btn-unlocked'),
    lockedBtn: document.getElementById('btn-locked')
};

let currentTab = 'unlocked';
var accountData = {};
let harmonicaState = JSON.parse(localStorage.getItem('gw2_harmonica_wardrobe') || '{}');

async function initCore() {
    const activeKey = localStorage.getItem('gw2_active_key');
    if (!activeKey) {
        UI.container.innerHTML = '<div class="loading-text">API KEY MISSING</div>';
        return;
    }

    checkModulesLoaded();

    try {
        const endpoints = { 
            skins: 'skins', 
            armory: 'legendaryarmory', 
            dyes: 'dyes', 
            outfits: 'outfits',
            gliders: 'gliders', 
            mailcarriers: 'mailcarriers', 
            jadebots: 'jadebots',
            home_doorways: 'home/doorway/skins',
            minis: 'minis', 
            nodes: 'home/nodes', 
            home_cats: 'home/cats', 
            finishers: 'finishers',
            novelties: 'novelties', 
            skiffs: 'skiffs', 
            emotes: 'emotes', 
            mounts: 'mounts/skins', 
            mount_types: 'mounts/types', 
            titles: 'titles'
        };
        
        for (let k in endpoints) {
            const r = await fetch(`https://api.guildwars2.com/v2/account/${endpoints[k]}?access_token=${activeKey}`);
            const data = r.ok ? await r.json() : [];
            
            accountData[k] = Array.isArray(data) ? data.map(i => {
                if (typeof i === 'object' && i !== null) {
                    return { ...i, id: String(i.id) };
                }
                return String(i);
            }) : [];
        }

        try {
            const [baseRes, invRes, bankRes, matRes, buildStorRes, charsRes] = await Promise.all([
                fetch(`https://api.guildwars2.com/v2/account?access_token=${activeKey}`),
                fetch(`https://api.guildwars2.com/v2/account/inventory?access_token=${activeKey}`),
                fetch(`https://api.guildwars2.com/v2/account/bank?access_token=${activeKey}`),
                fetch(`https://api.guildwars2.com/v2/account/materials?access_token=${activeKey}`),
                fetch(`https://api.guildwars2.com/v2/account/buildstorage?access_token=${activeKey}`),
                fetch(`https://api.guildwars2.com/v2/characters?ids=all&access_token=${activeKey}`)
            ]);

            const baseData = baseRes.ok ? await baseRes.json() : {};
            const invData = invRes.ok ? await invRes.json() : [];
            const bankData = bankRes.ok ? await bankRes.json() : [];
            const buildStorData = buildStorRes.ok ? await buildStorRes.json() : [];
            const charsData = charsRes.ok ? await charsRes.json() : [];

            let totalBags = 0, totalEquip = 0, totalBuild = 0, totalCrafting = 0;
            if (Array.isArray(charsData)) {
                charsData.forEach(c => {
                    if (c.bags) totalBags += Math.max(0, c.bags.length - 5);
                    if (c.equipment_tabs) totalEquip += Math.max(0, c.equipment_tabs.length - 2);
                    if (c.build_tabs) totalBuild += Math.max(0, c.build_tabs.length - 3);
                    if (c.crafting) totalCrafting += Math.max(0, c.crafting.length - 2);
                });
            }

            const bankTabs = Array.isArray(bankData) ? Math.floor(bankData.length / 30) : 1;

            accountData.upgrades = {
                char_slots: Array.isArray(charsData) ? charsData.length : 0, 
                shared_slots: Array.isArray(invData) ? invData.length : 0,
                bank_slots: Math.max(0, bankTabs - 1), 
                storage_expanders: Math.max(0, ((baseData.material_storage_limit || 250) - 250) / 250),
                bag_slots: totalBags,
                additional_crafting_licenses: totalCrafting,
                build_storage_expansions: Math.max(0, (buildStorData.length || 3) - 3),
                build_template_expansions: totalBuild,
                equipment_template_expansions: totalEquip,
                fashion_template_expansion: 0
            };
        } catch (e) {
            console.error("Account Upgrades API Failed:", e);
            accountData.upgrades = {};
        }
        
        indexes.home = await fetch('./home_index.json').then(r => r.json());
        indexes.appearance = await fetch('./appearance_index.json').then(r => r.json());
        indexes.gear = await fetch('./gear_index.json').then(r => r.json());
        indexes.dyes = await fetch('./dyes_index.json').then(r => r.json());
        
        buildMenu();
        
    } catch (e) { 
        console.error("Core Init Failed:", e); 
        UI.container.innerHTML = '<div class="loading-text">INITIALIZATION FAILED</div>';
    }
}

function checkModulesLoaded() {
    if (Object.keys(armorHierarchy).length === 0) {
        UI.container.innerHTML = '<div class="loading-text">LOADING API...</div>';
        setTimeout(checkModulesLoaded, 50);
    } else { buildMenu(); }
}

function buildMenu() {
    UI.container.innerHTML = '';
    const sortedKeys = Object.keys(armorHierarchy).sort((a, b) => {
        const order = { "ARMOR": 1, "WEAPONS": 2, "LEGENDARY ARMORY": 3, "APPEARANCE": 4, "COLLECTIBLES": 5, "HOME INSTANCE": 6 };
        return (order[a.toUpperCase()] || 99) - (order[b.toUpperCase()] || 99);
    });

    for (const main of sortedKeys) {
        const mainId = 'main_' + main.replace(/\s+/g, '_');
        const isMainOpen = harmonicaState[mainId] === true;
        const mainEl = createCategoryEl(main, 'main-cat', 'title');
        const content = mainEl.querySelector('.content');
        
        if (isMainOpen) mainEl.classList.remove('collapsed');

        mainEl.querySelector('.header').onclick = () => {
            const wasCollapsed = mainEl.classList.contains('collapsed');
            mainEl.classList.toggle('collapsed');
            harmonicaState[mainId] = wasCollapsed;
            localStorage.setItem('gw2_harmonica_wardrobe', JSON.stringify(harmonicaState));
        };

        const hierarchy = armorHierarchy[main];
        for (const subKey in hierarchy) {
            if (currentTab === 'locked' && subKey === "Account Upgrades") continue;

            const mode = hierarchy[subKey];
            const subId = mainId + '_' + subKey.replace(/\s+/g, '_');
            const isSubOpen = harmonicaState[subId] === true;
            const subEl = createCategoryEl(subKey, 'sub-cat', 'sub-title');
            subEl.dataset.sub = subKey;

            content.appendChild(subEl);

            if (isSubOpen) { 
                subEl.classList.remove('collapsed'); 
                if (mode === "Direct") loadCategoryData(subEl); 
            }

            if (mode === "Direct") {
                subEl.querySelector('.header').onclick = (e) => { 
                    e.stopPropagation(); 
                    const wasCollapsed = subEl.classList.contains('collapsed');
                    subEl.classList.toggle('collapsed');
                    harmonicaState[subId] = wasCollapsed;
                    localStorage.setItem('gw2_harmonica_wardrobe', JSON.stringify(harmonicaState));
                    if (wasCollapsed) loadCategoryData(subEl);
                };
            } else {
                subEl.querySelector('.header').onclick = (e) => {
                    e.stopPropagation();
                    const wasCollapsed = subEl.classList.contains('collapsed');
                    subEl.classList.toggle('collapsed');
                    harmonicaState[subId] = wasCollapsed;
                    localStorage.setItem('gw2_harmonica_wardrobe', JSON.stringify(harmonicaState));
                };
                const types = Array.isArray(mode) ? mode : Object.keys(mode);
                types.forEach(typeKey => {
                    const typeId = subId + '_' + typeKey.replace(/\s+/g, '_');
                    const isTypeOpen = harmonicaState[typeId] === true;
                    const leaf = createCategoryEl(typeKey, 'weight-cat', 'weight-title');
                    leaf.dataset.sub = subKey; leaf.dataset.type = typeKey;
                    
                    subEl.querySelector('.content').appendChild(leaf);

                    if (isTypeOpen) { leaf.classList.remove('collapsed'); loadCategoryData(leaf); }

                    leaf.querySelector('.header').onclick = (e) => { 
                        e.stopPropagation(); 
                        const wasCollapsed = leaf.classList.contains('collapsed');
                        leaf.classList.toggle('collapsed');
                        harmonicaState[typeId] = wasCollapsed;
                        localStorage.setItem('gw2_harmonica_wardrobe', JSON.stringify(harmonicaState));
                        if (wasCollapsed) loadCategoryData(leaf);
                    };
                });
            }
        }
        UI.container.appendChild(mainEl);
    }
}

async function loadCategoryData(el) {
    const content = el.querySelector('.content');
    content.innerHTML = '<div class="loading-text">LOADING API...</div>';
    const { sub } = el.dataset;
    const mainTitle = el.closest('.main-cat')?.querySelector('.title').innerText.toUpperCase() || "";
    try {
        if (mainTitle.includes("LEGENDARY ARMORY")) await loadArmoryData(el);
        else if (sub === "Dyes") await loadDyeData(el);
        else if (mainTitle.includes("ARMOR")) await loadArmorData(el, indexes.gear); 
        else if (mainTitle.includes("WEAPONS")) await loadWeaponData(el, indexes.gear);
        else if (mainTitle.includes("APPEARANCE")) await loadAppearanceData(el, indexes.appearance);
        else if (mainTitle.includes("COLLECTIBLES")) await loadCollectiblesData(el, indexes.appearance);
        else if (mainTitle.includes("HOME INSTANCE")) await loadHomeData(el, indexes.home);
    } catch (err) { 
        console.error("Load Error:", err);
        content.innerHTML = '<div class="loading-text">FETCHING API FAILED</div>'; 
    }
}

function createSlot(item, count = null) {
    const slot = document.createElement('div');
    slot.className = 'item-slot';
    const name = item.n || item.name;

    if (item.rgb && Array.isArray(item.rgb)) {
        const [r, g, b] = item.rgb;
        slot.innerHTML = `<div class="dye-square" style="background-color: rgb(${r},${g},${b}); width: 44px; height: 44px; border-radius: 2px;"></div>`;
    } else {
        const icon = item.i || item.icon || "https://wiki.guildwars2.com/images/7/7d/GW2_icon_small.png";
        slot.innerHTML = `<img class="item-icon" src="${icon}">`;
    }
    if (count) {
        const badge = document.createElement('div');
        badge.className = 'count-badge'; badge.innerText = count;
        slot.appendChild(badge);
    }
    slot.onclick = () => window.open(`https://wiki.guildwars2.com/index.php?search=${encodeURIComponent(name)}`, 'gw2wiki');
    slot.onmouseover = (e) => window.parent.postMessage({action:'showTooltip', text: name, x: e.clientX, y: e.clientY, offsetTop: 45}, '*');
    slot.onmouseout = () => window.parent.postMessage({action:'hideTooltip'}, '*');
    return slot;
}

function createCategoryEl(title, className, titleClass) {
    const div = document.createElement('div');
    div.className = className + ' collapsed';
    div.innerHTML = `<div class="header"><span class="${titleClass}">${title}</span><span class="arrow">▼</span></div><div class="content"></div>`;
    return div;
}

UI.unlockedBtn.onclick = () => { if (currentTab === 'unlocked') return; currentTab = 'unlocked'; UI.unlockedBtn.classList.add('active'); UI.lockedBtn.classList.remove('active'); buildMenu(); };
UI.lockedBtn.onclick = () => { if (currentTab === 'locked') return; currentTab = 'locked'; UI.lockedBtn.classList.add('active'); UI.unlockedBtn.classList.remove('active'); buildMenu(); };
initCore();