/* dyes.js */

if (typeof armorHierarchy !== 'undefined') {
    armorHierarchy["Appearance"]["Dyes"] = ["Common", "Uncommon", "Rare", "Exclusive"];
}

// Safety anchor for background processes[cite: 18]
let dyeSyncInterval = null;

async function loadDyeData(el) {
    const content = el.querySelector('.content');
    const { type } = el.dataset;
    
    // Safety: Clear any existing sync loops before starting[cite: 18]
    if (dyeSyncInterval) clearInterval(dyeSyncInterval);

    const dyeIndex = indexes.dyes;
    const ownedDyes = accountData.dyes || [];

    // PATIENT RETRY LOOP: Specifically looks for dyes index[cite: 18]
    if (!dyeIndex || !dyeIndex.dyes) {
        let attempts = 0;
        content.innerHTML = '<div class="loading-text">SYNCING DYE DATA...</div>';
        
        dyeSyncInterval = setInterval(() => {
            attempts++;
            if (indexes.dyes && indexes.dyes.dyes) {
                clearInterval(dyeSyncInterval);
                loadDyeData(el);
            } else if (attempts > 30) {
                clearInterval(dyeSyncInterval);
                content.innerHTML = '<div class="loading-text">LOAD FAILED: DYE INDEX MISSING</div>';
            }
        }, 300);
        return;
    }

    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid';

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