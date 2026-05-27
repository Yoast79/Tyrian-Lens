/* armory.js */

if (typeof armorHierarchy !== 'undefined') {
    armorHierarchy["Legendary Armory"] = {
        "Armor": "Direct",
        "Weapons": "Direct",
        "Equipment": "Direct"
    };
}

// Safety anchor for background processes[cite: 18]
let armorySyncInterval = null;

async function loadArmoryData(el) {
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid';
    const type = el.dataset.sub;
    const ownedIds = (accountData.armory || []).map(a => String(a.id));
    const content = el.querySelector('.content');

    // Safety: Clear existing loops[cite: 18]
    if (armorySyncInterval) clearInterval(armorySyncInterval);

    content.innerHTML = '<div class="loading-text">SYNCING DATA...</div>';

    if (currentTab === 'unlocked') {
        if (ownedIds.length > 0) {
            try {
                // Implement batching to prevent URL length issues[cite: 18]
                const chunks = [];
                for (let i = 0; i < ownedIds.length; i += 200) {
                    chunks.push(ownedIds.slice(i, i + 200));
                }

                for (const chunk of chunks) {
                    const res = await fetch(`https://api.guildwars2.com/v2/items?ids=${chunk.join(',')}`).then(r => r.json());
                    res.forEach(item => {
                        const entry = accountData.armory.find(a => String(a.id) === String(item.id));
                        let match = false;
                        if (type === "Armor" && (item.type === "Armor" || item.type === "Back")) match = true;
                        else if (type === "Weapons" && item.type === "Weapon") match = true;
                        else if (type === "Equipment" && ["Trinket", "UpgradeComponent", "Relic", "Accessory", "Ring", "Amulet"].includes(item.type)) match = true;
                        
                        if (match) {
                            gridDiv.appendChild(createSlot({ id: item.id, n: item.name, i: item.icon }, entry.count > 1 ? entry.count : null));
                        }
                    });
                }
            } catch (e) { console.error("Armory Unlocked Error:", e); }
        }
    } else {
        // Implement Retry Loop for Index Safety[cite: 18]
        if (!indexes.gear || !indexes.gear.items) {
            let attempts = 0;
            armorySyncInterval = setInterval(() => {
                attempts++;
                if (indexes.gear && indexes.gear.items) {
                    clearInterval(armorySyncInterval);
                    loadArmoryData(el);
                } else if (attempts > 30) {
                    clearInterval(armorySyncInterval);
                    content.innerHTML = '<div class="loading-text">LOAD FAILED: GEAR INDEX MISSING</div>';
                }
            }, 300);
            return;
        }

        indexes.gear.items.forEach(item => {
            const isLegendary = item.r && item.r.toLowerCase() === "legendary";
            if (!isLegendary || item.cat !== 'item' || ownedIds.includes(String(item.id))) return;

            let match = false;
            const itemType = item.t || "";
            if (type === "Armor" && (itemType === "Armor" || itemType === "Back")) match = true;
            else if (type === "Weapons" && itemType === "Weapon") match = true;
            else if (type === "Equipment" && ["Trinket", "UpgradeComponent", "Relic", "Accessory", "Ring", "Amulet"].includes(itemType)) match = true;

            if (match) gridDiv.appendChild(createSlot(item));
        });
    }

    content.innerHTML = '';
    if (gridDiv.children.length === 0) {
        const msg = currentTab === 'locked' ? "EVERYTHING UNLOCKED!" : "NONE FOUND";
        content.innerHTML = `<div class="loading-text">${msg}</div>`;
    } else {
        content.appendChild(gridDiv);
    }
}
