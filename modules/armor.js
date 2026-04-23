if (typeof armorHierarchy !== 'undefined') {
    armorHierarchy["Armor"] = {
        "Back": "Direct",
        "Helm": ["Light", "Medium", "Heavy"],
        "Shoulders": ["Light", "Medium", "Heavy"],
        "Coat": ["Light", "Medium", "Heavy"],
        "Gloves": ["Light", "Medium", "Heavy"],
        "Leggings": ["Light", "Medium", "Heavy"],
        "Boots": ["Light", "Medium", "Heavy"],
        "Aquabreathers": ["Light", "Medium", "Heavy"]
    };
}

async function loadArmorData(el, index) {
    const content = el.querySelector('.content');
    const { sub, type } = el.dataset;

    content.innerHTML = '<div class="loading-text">SYNCING DATA...</div>';

    // PATIENT RETRY LOOP: Specifically looks for masterIndex
    if (!index || !index.items) {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            const targetIndex = window.masterIndex; 
            if (targetIndex && targetIndex.items) {
                clearInterval(checkInterval);
                loadArmorData(el, targetIndex);
            } else if (attempts > 30) {
                clearInterval(checkInterval);
                content.innerHTML = '<div class="loading-text">LOAD FAILED: MASTER INDEX MISSING</div>';
            }
        }, 300);
        return;
    }

    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid';
    const ownedSkins = (accountData.skins || []).map(id => String(id));
    let foundItems = 0;

    index.items.forEach(item => {
        // master_index uses cat: "skin" for gear
        if (item.cat === "skin" && (item.t === "Armor" || item.t === "Back")) {
            const isOwned = ownedSkins.includes(String(item.id));
            if (isOwned !== (currentTab === 'unlocked')) return;

            let match = false;
            if (sub === "Back" && item.t === "Back") match = true;
            else if (item.st === sub && item.w === type) match = true;
            else if (sub === "Aquabreathers" && item.st === "HelmAquatic" && item.w === type) match = true;

            if (match) {
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