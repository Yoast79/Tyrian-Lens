if (typeof armorHierarchy !== 'undefined') {
    armorHierarchy["Weapons"] = {
        "One-Handed": ["Axe", "Dagger", "Mace", "Pistol", "Scepter", "Sword"],
        "Two-Handed": ["Greatsword", "Hammer", "Longbow", "Shortbow", "Rifle", "Staff", "Spear"],
        "Off-Hand": ["Focus", "Shield", "Torch", "Warhorn"],
        "Aquatic": ["Spear", "Speargun", "Trident"]
    };
}

async function loadWeaponData(el, index) {
    const content = el.querySelector('.content');
    const { type } = el.dataset;

    content.innerHTML = '<div class="loading-text">SYNCING DATA...</div>';

    // PATIENT RETRY LOOP: Specifically looks for masterIndex
    if (!index || !index.items) {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            const targetIndex = window.masterIndex;
            if (targetIndex && targetIndex.items) {
                clearInterval(checkInterval);
                loadWeaponData(el, targetIndex);
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
        // master_index check for weapons
        if (item.cat === "skin" && item.t === "Weapon" && item.st === type) {
            const isOwned = ownedSkins.includes(String(item.id));
            if (isOwned === (currentTab === 'unlocked')) {
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