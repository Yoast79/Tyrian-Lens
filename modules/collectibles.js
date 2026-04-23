if (typeof armorHierarchy !== 'undefined') {
    armorHierarchy["Collectibles"] = {
        "Miniatures": "Direct",
        "Finishers": "Direct",
        "Mount Types": "Direct",
        "Titles": "Direct",
        "Account Upgrades": "Direct"
    };
}

function formatGW2String(str) {
    if (!str) return "";
    const colorMap = { "@prah": "#ffaa00", "@flavor": "#a2db91", "@warning": "#ff5555", "alert": "#ffcc00" };
    let formatted = str;
    formatted = formatted.replace(/<c=@?(.*?)>/gi, (match, p1) => {
        const color = colorMap[p1.toLowerCase()] || p1;
        return `<span style="color: ${color}; font-weight: bold;">`;
    });
    formatted = formatted.replace(/<\/c>/gi, '</span>');
    return formatted;
}

async function loadCollectiblesData(el, index) {
    const content = el.querySelector('.content');
    const { sub } = el.dataset;

    if (sub === "Account Upgrades") {
        await loadAccountUpgrades(el);
        return;
    }

    content.innerHTML = '<div class="loading-text">SYNCING DATA...</div>';

    if (!index || !index.items) {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            const globalIndex = window.collectiblesIndex;
            if (globalIndex && globalIndex.items) {
                clearInterval(checkInterval);
                loadCollectiblesData(el, globalIndex);
            } else if (attempts > 30) {
                clearInterval(checkInterval);
                content.innerHTML = '<div class="loading-text">LOAD FAILED: INDEX MISSING</div>';
            }
        }, 300);
        return;
    }

    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid';

    if (sub === "Titles") {
        try {
            const allTitles = await fetch('https://api.guildwars2.com/v2/titles?ids=all').then(r => r.json());
            const ownedTitleIds = (accountData.titles || []).map(id => String(id));
            let listToRender = [];
            
            allTitles.forEach(title => {
                const isOwned = ownedTitleIds.includes(String(title.id));
                if (isOwned === (currentTab === 'unlocked')) {
                    listToRender.push({ raw: title.name, formatted: formatGW2String(title.name) });
                }
            });

            if (listToRender.length === 0) {
                content.innerHTML = `<div class="loading-text">${currentTab === 'locked' ? "ALL UNLOCKED!" : "NONE FOUND"}</div>`;
                return;
            }

            const frame = document.createElement('div');
            frame.className = "custom-scroll-container";
            Object.assign(frame.style, {
                maxHeight: "450px", overflowY: "auto", padding: "10px",
                background: "rgba(0, 0, 0, 0.4)", borderRadius: "4px", textAlign: "left"
            });
            
            if (!document.getElementById('title-scroll-style')) {
                const style = document.createElement('style');
                style.id = 'title-scroll-style';
                style.innerHTML = `
                    .custom-scroll-container::-webkit-scrollbar { width: 8px; }
                    .custom-scroll-container::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 4px; }
                    .custom-scroll-container::-webkit-scrollbar-thumb { background: #4a3b2a; border-radius: 4px; border: 1px solid #e2c07d; }
                    .custom-scroll-container::-webkit-scrollbar-thumb:hover { background: #5a4b3a; }
                `;
                document.head.appendChild(style);
            }

            listToRender.sort((a, b) => a.raw.localeCompare(b.raw)).forEach(t => {
                const entry = document.createElement('div');
                Object.assign(entry.style, {
                    padding: "3px 8px", borderBottom: "1px solid rgba(226, 192, 125, 0.05)",
                    fontSize: "11px", color: "#e2c07d", fontFamily: "serif"
                });
                entry.innerHTML = t.formatted;
                frame.appendChild(entry);
            });

            content.innerHTML = '';
            content.appendChild(frame);
        } catch (e) {
            content.innerHTML = '<div class="loading-text">API COMMUNICATION ERROR</div>';
        }
        return;
    }

    const catMap = { "Miniatures": { acc: "minis", cats: ["minis", "miniatures"] }, "Finishers": { acc: "finishers", cats: ["finishers", "finisher"] }, "Mount Types": { acc: "mount_types", cats: ["mount_types"] } };
    const target = catMap[sub];
    const ownedData = (accountData[target.acc] || []).map(o => String(o.id || o));

    let foundItems = 0;
    index.items.forEach(item => {
        if (target.cats.includes(item.cat)) {
            if (ownedData.includes(String(item.id)) === (currentTab === 'unlocked')) {
                gridDiv.appendChild(createSlot(item));
                foundItems++;
            }
        }
    });

    content.innerHTML = '';
    if (foundItems === 0) {
        content.innerHTML = `<div class="loading-text">${currentTab === 'locked' ? "ALL UNLOCKED!" : "NONE FOUND"}</div>`;
    } else {
        content.appendChild(gridDiv);
    }
}

async function loadAccountUpgrades(el) {
    const content = el.querySelector('.content');
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid';

    const upgradeMap = [
        { key: "char_slots", n: "character slots", i: "https://wiki.guildwars2.com/images/7/70/Character_Slot_Expansion.png" },
        { key: "shared_slots", n: "shared inventory slots", i: "https://render.guildwars2.com/file/58085D0B0C10C3594E96046B95BE963B7A293BB5/1314214.png" },
        { key: "bank_slots", n: "bank tab expansions", i: "https://render.guildwars2.com/file/5BF86A2433F1BE0575E7B37B22EF6695F83211C5/66589.png" },
        { key: "storage_expanders", n: "material storage expansions", i: "https://render.guildwars2.com/file/C86198A5674D6B03BA74CE7DD3115B79CDF32139/674828.png" },
        { key: "bag_slots", n: "bag slot expansions", i: "https://render.guildwars2.com/file/6AECEE0A0704F069B3776BC66516EB2F0E0DE644/66588.png" },
        { key: "additional_crafting_licenses", n: "additional crafting licenses", i: "https://render.guildwars2.com/file/F23275B76B74B907D8A0BE9F3BA066094CAE90FD/819619.png" },
        { key: "build_storage_expansions", n: "build storage expansions", i: "https://render.guildwars2.com/file/A7C0D0FAA827F5FA014DEE499FA71676093E29C4/2215699.png" },
        { key: "build_template_expansions", n: "build template expansions", i: "https://render.guildwars2.com/file/DA2B54C2B7F9F1804DAEB0F4A8E44A4459A20B04/2215700.png" },
        { key: "equipment_template_expansions", n: "equipment template expansions", i: "https://render.guildwars2.com/file/A615CE6395B4345715EEFA5BD242F54CE3E72EAA/2215701.png" },
        { key: "fashion_template_expansion", n: "fashion template expansion", i: "https://render.guildwars2.com/file/DD040A47084AB85A107B15A8BBB55A5EBF14AD08/3744650.png" }
    ];

    upgradeMap.forEach(up => {
        let val = accountData.upgrades ? (accountData.upgrades[up.key] || 0) : 0;
        if (val > 0) {
            gridDiv.appendChild(createSlot(up, val));
        }
    });

    content.innerHTML = '';
    if (gridDiv.children.length === 0) {
        content.innerHTML = '<div class="loading-text">NONE FOUND</div>';
    } else {
        content.appendChild(gridDiv);
    }
}