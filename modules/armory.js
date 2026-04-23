if (typeof armorHierarchy !== 'undefined') {
    armorHierarchy["Legendary Armory"] = {
        "Armor": "Direct",
        "Weapons": "Direct",
        "Equipment": "Direct"
    };
}

async function loadArmoryData(el) {
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid';
    const type = el.dataset.sub;
    const ownedIds = (accountData.armory || []).map(a => String(a.id));

    if (currentTab === 'unlocked') {
        if (ownedIds.length > 0) {
            try {
                const res = await fetch(`https://api.guildwars2.com/v2/items?ids=${ownedIds.join(',')}`).then(r => r.json());
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
            } catch (e) { console.error("Armory Unlocked Error:", e); }
        }
    } else {
        if (indexes.gear && indexes.gear.items) {
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
    }

    const content = el.querySelector('.content');
    content.innerHTML = '';
    if (gridDiv.children.length === 0) {
        const msg = currentTab === 'locked' ? "EVERYTHING UNLOCKED!" : "NONE FOUND";
        content.innerHTML = `<div class="loading-text">${msg}</div>`;
    } else {
        content.appendChild(gridDiv);
    }
}