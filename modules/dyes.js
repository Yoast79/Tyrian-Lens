if (typeof armorHierarchy !== 'undefined') {
    armorHierarchy["Appearance"]["Dyes"] = ["Common", "Uncommon", "Rare", "Exclusive"];
}

async function loadDyeData(el) {
    const content = el.querySelector('.content');
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid';
    const { type } = el.dataset;
    
    const dyeIndex = indexes.dyes;
    const ownedDyes = accountData.dyes || [];

    if (!dyeIndex || !dyeIndex.dyes) {
        content.innerHTML = '<div class="loading-text">FETCHING API FAILED</div>';
        return;
    }

    let totalInCategory = 0;
    let ownedInCategory = 0;

    dyeIndex.dyes.forEach(item => {
        if (item.r === type) {
            totalInCategory++;
            const isOwned = ownedDyes.includes(String(item.id));
            if (isOwned) ownedInCategory++;

            if (isOwned === (currentTab === 'unlocked')) {
                gridDiv.appendChild(createSlot(item));
            }
        }
    });

    content.innerHTML = '';
    if (gridDiv.children.length === 0) {
        const msg = (currentTab === 'locked' && totalInCategory > 0 && ownedInCategory === totalInCategory) ? "EVERYTHING UNLOCKED!" : "NONE FOUND";
        content.innerHTML = `<div class="loading-text">${msg}</div>`;
    } else {
        content.appendChild(gridDiv);
    }
}