if (typeof armorHierarchy !== 'undefined') {
    armorHierarchy["Appearance"] = {
        "Dyes": "Direct",
        "Outfits": "Direct",
        "Gliders": "Direct",
        "Mail Carriers": "Direct",
        "Jade Bot Skins": "Direct",
        "Conjured Doorway Skins": "Direct",
        "Skiff Skins": "Direct",
        "Gathering Tools": {
            "Mining tool skins": "Gathering",
            "Logging tool skins": "Gathering",
            "Harvesting tool skins": "Gathering",
            "Fishing Rod Skins": "Gathering"
        },
        "Novelties": "Direct",
        "Mount Skins": "Direct",
        "Emotes": "Direct"
    };
}

// 1. Master List: EMOTES
const emoteMasterList = [
    { id: "barbecue", n: "\"/Barbecue\" Emote Tome", i: "https://render.guildwars2.com/file/D6D1321C520A5DAFEFCE474CEB271E56A267F1AB/3690620.png" },
    { id: "bless", n: "\"/Bless\" Emote Tome", i: "https://render.guildwars2.com/file/46FD052004900FEB73E602C67179BD98F462D031/3122099.png" },
    { id: "bloodstoneboogie", n: "\"/BloodstoneBoogie\" Emote Tome", i: "https://render.guildwars2.com/file/DF06749BB071E23300E44BD407CB08C218026EBE/3567645.png" },
    { id: "blowkiss", n: "\"/BlowKiss\" Emote Tome", i: "https://render.guildwars2.com/file/056236A113C8E230EB5DA70F6B239CA833915D27/3584755.png" },
    { id: "breakdance", n: "\"/Breakdance\" Emote Tome", i: "https://render.guildwars2.com/file/EECD3D13040474E574440C5C269ACBC2BA423ED3/3429171.png" },
    { id: "channel", n: "\"/Channel\" Emote Tome", i: "https://render.guildwars2.com/file/9BF80ACEB7D017EE4833FC2065F90225C2C6E4F3/3653506.png" },
    { id: "crabdance", n: "\"/CrabDance\" Emote Tome", i: "https://render.guildwars2.com/file/D6D1321C520A5DAFEFCE474CEB271E56A267F1AB/3690620.png" },
    { id: "drink", n: "\"/Drink\" Emote Tome", i: "https://render.guildwars2.com/file/331318446059A60F59B76255736702F3599ED153/3708793.png" },
    { id: "hiss", n: "\"/Hiss\" Emote Tome", i: "https://render.guildwars2.com/file/E1FAAD240C62524D4B05BCCCBF1A58395375444D/2789346.png" },
    { id: "heroic", n: "\"/Heroic\" Emote Tome", i: "https://render.guildwars2.com/file/461E2D53EF9AFDDB1F7BBA4F4AAC99A375A807F1/3122100.png" },
    { id: "magicjuggle", n: "\"/MagicJuggle\" Emote Tome", i: "https://render.guildwars2.com/file/5D21CB03080FB2D4ED094455AA5EC1557EFAAEF4/3098395.png" },
    { id: "magictrick", n: "\"/MagicTrick\" Emote Tome", i: "https://render.guildwars2.com/file/004106AE1092E395E67126CC4B7153FD76471B34/3612577.png" },
    { id: "paper", n: "\"/Paper\" Emote Tome", i: "https://render.guildwars2.com/file/49ED4A7E6500D015E61877E303AC48B2941EAAB7/2594279.png" },
    { id: "petalthrow", n: "\"/PetalThrow\" Emote Tome", i: "https://render.guildwars2.com/file/1DA7F3F2CDB006A0997EDB4A1D4E976D30B3D3C5/3356834.png" },
    { id: "playdead", n: "\"/Playdead\" Emote Tome", i: "https://render.guildwars2.com/file/E70B61F69CB41359960E4F6266774F702F57A569/2292707.png" },
    { id: "posecover", n: "\"/PoseCover\" Emote Tome", i: "https://render.guildwars2.com/file/D2D010F49AAA66CE52532C4FCF330C1163AE5CF3/3592698.png" },
    { id: "poseheart", n: "\"/PoseHeart\" Emote Tome", i: "https://render.guildwars2.com/file/0E2C22CE8000680609667F18CC691CB07556202A/3744649.png" },
    { id: "posehigh", n: "\"/PoseHigh\" Emote Tome", i: "https://render.guildwars2.com/file/DB0DDED9C1249797FE744F1DF34CF772A37B74E0/3592699.png" },
    { id: "poselow", n: "\"/PoseLow\" Emote Tome", i: "https://render.guildwars2.com/file/597509D41BD3C630BF3103554FDBCBD7E7DBA1AF/3592700.png" },
    { id: "posepeace", n: "\"/PosePeace\" Emote Tome", i: "https://render.guildwars2.com/file/0E2C22CE8000680609667F18CC691CB07556202A/3744649.png" },
    { id: "posesassy", n: "\"/PoseSassy\" Emote Tome", i: "https://render.guildwars2.com/file/0E2C22CE8000680609667F18CC691CB07556202A/3744649.png" },
    { id: "poseshy", n: "\"/PoseShy\" Emote Tome", i: "https://render.guildwars2.com/file/0E2C22CE8000680609667F18CC691CB07556202A/3744649.png" },
    { id: "posetwist", n: "\"/PoseTwist\" Emote Tome", i: "https://render.guildwars2.com/file/F6F792560A11DF045DB0A53E66970C00CF066B6B/3592701.png" },
    { id: "possessed", n: "\"/Possessed\" Emote Tome", i: "https://render.guildwars2.com/file/0569E363473F05F9A3EE03EAA7F69C05ADAB31B3/3122101.png" },
    { id: "readbook", n: "\"/Readbook\" Emote Tome", i: "https://render.guildwars2.com/file/F9545392B46B9C0873FDE404CD0C104B6FFA66B0/3105934.png" },
    { id: "rock", n: "\"/Rock\" Emote Tome", i: "https://render.guildwars2.com/file/2367E5C67CB4DCAF3E25033F35A56B0E2C0BA316/2594280.png" },
    { id: "rockout", n: "\"/Rockout\" Emote Tome", i: "https://render.guildwars2.com/file/C3030D5F366E5CCF730D06A3A495F9EC9A6596D8/2199283.png" },
    { id: "scissors", n: "\"/Scissors\" Emote Tome", i: "https://render.guildwars2.com/file/91D057FB169149C03594E24945D09EFBDDC4BBD1/2594281.png" },
    { id: "serve", n: "\"/Serve\" Emote Tome", i: "https://render.guildwars2.com/file/9DECA9200EF8C90A960D560575E55930F656DDE6/2741367.png" },
    { id: "shiver", n: "\"/Shiver\" Emote Tome", i: "https://render.guildwars2.com/file/2D09124CD1C29AAA25332BADC9C114EE14D25F6C/2247449.png" },
    { id: "shiverplus", n: "\"/Shiverplus\" Emote Tome", i: "https://render.guildwars2.com/file/1BACBDEFE1C06D0B611B98DD7663024D5A271E62/2314066.png" },
    { id: "shocked", n: "\"/Shocked\" Emote Tome", i: "https://render.guildwars2.com/file/B7EB742935F570D6BDEFDA26F708584698E03E56/3708794.png" },
    { id: "thumbsdown", n: "\"/ThumbsDown\" Emote Tome", i: "https://render.guildwars2.com/file/CCA341E23CF22FF1B3D07AF3D06120F2737B6821/3708795.png" },
    { id: "sipcoffee", n: "\"/Sipcoffee\" Emote Tome", i: "https://render.guildwars2.com/file/FA4F403AB4DEAE7930B426EDF3BDAE7C0A7F38F2/3105935.png" },
    { id: "stretch", n: "\"/Stretch\" Emote Tome", i: "https://render.guildwars2.com/file/D91DCD2ECBA777DF9E27044F6FF176989A00C2CD/2388154.png" },
    { id: "thumbsup", n: "\"/ThumbsUp\" Emote Tome", i: "https://render.guildwars2.com/file/DADB6CA14F04EB0EDD76F5750DC573EC9C0849DE/3708796.png" },
    { id: "unleash", n: "\"/Unleash\" Emote Tome", i: "https://render.guildwars2.com/file/AA7A491EAD08E5030DC2422D3116D3AD034CB0C6/3278172.png" },
    { id: "step", n: "How to Dance, Volume 1 (Step)", i: "https://render.guildwars2.com/file/0378716BA836504AF1C5AF550019689F4F99ED18/575158.png" },
    { id: "shuffle", n: "How to Dance, Volume 1 (Shuffle)", i: "https://render.guildwars2.com/file/0378716BA836504AF1C5AF550019689F4F99ED18/575158.png" },
    { id: "geargrind", n: "How to Dance, Volume 1 (Geargrind)", i: "https://render.guildwars2.com/file/0378716BA836504AF1C5AF550019689F4F99ED18/575158.png" }
];

// 2. Master List: DOORWAYS
const doorwayMasterList = [
    { id: "magic_doorway_kodan", n: "Kodan Doorway", i: "https://wiki.guildwars2.com/images/b/b8/Kodan_Conjured_Doorway.png" },
    { id: "magic_doorway_asuran", n: "Asuran Doorway", i: "https://render.guildwars2.com/file/A9B51830D0AFAC4EDAB73649012AA34A597951F4/3729220.png" },
    { id: "magic_doorway_crystal_rune", n: "Crystal Rune Doorway", i: "https://render.guildwars2.com/file/0EFFEDAC63AA279EA41A737C0B7BA211C43E3C3E/3753690.png" },
    { id: "magic_doorway_charr", n: "Charr Doorway", i: "https://render.guildwars2.com/file/05A0E50E99E0D19BC3B021B7B473E1936AFC78DF/3673993.png" }
];

// 3. Master List: JADE BOTS
const jadeBotMasterList = [
    { id: 1, n: "Jade Bot", i: "https://wiki.guildwars2.com/images/b/bf/Jade_Bot_%28skin%29.png" },
    { id: 2, n: "Cuddly Cat", i: "https://wiki.guildwars2.com/images/a/ac/Cuddly_Cat_Jade_Bot_Skin.png" },
    { id: 3, n: "Roundtail Dragon", i: "https://wiki.guildwars2.com/images/8/8d/Roundtail_Dragon_Jade_Bot_Skin.png" },
    { id: 4, n: "Playful Ghost", i: "https://wiki.guildwars2.com/images/d/d5/Playful_Ghost_Jade_Bot_Skin.png" },
    { id: 5, n: "Fluttering Fairy", i: "https://wiki.guildwars2.com/images/0/0d/Fluttering_Fairy_Jade_Bot_Skin.png" },
    { id: 6, n: "Candlewick Sprite", i: "https://wiki.guildwars2.com/images/2/2f/Candlewick_Sprite_Jade_Bot_Skin.png" }
];

async function loadAppearanceData(el, index) {
    const content = el.querySelector('.content');
    const { sub, type } = el.dataset;

    content.innerHTML = '<div class="loading-text">SYNCING DATA...</div>';

    // PATIENT RETRY LOOP
    if (!index || !index.items) {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            const globalIndex = window.appearanceIndex;
            if (globalIndex && globalIndex.items) {
                clearInterval(checkInterval);
                loadAppearanceData(el, globalIndex);
            } else if (attempts > 30) {
                clearInterval(checkInterval);
                content.innerHTML = '<div class="loading-text">LOAD FAILED: INDEX MISSING</div>';
            }
        }, 300);
        return;
    }

    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid';

    // --- EMOTES ---
    if (sub === "Emotes") {
        const ownedEmotes = (accountData.emotes || []).map(e => String(e).toLowerCase());
        let processedEmotes = new Set();
        emoteMasterList.forEach(emote => {
            const isOwned = ownedEmotes.includes(emote.id.toLowerCase());
            if (isOwned === (currentTab === 'unlocked')) gridDiv.appendChild(createSlot(emote));
            processedEmotes.add(emote.id.toLowerCase());
        });
        if (currentTab === 'unlocked') {
            ownedEmotes.forEach(owned => {
                if (!processedEmotes.has(owned)) {
                    gridDiv.appendChild(createSlot({
                        id: owned, n: `"/${owned.charAt(0).toUpperCase() + owned.slice(1)}" Emote`,
                        i: "https://render.guildwars2.com/file/D6D1321C520A5DAFEFCE474CEB271E56A267F1AB/3690620.png"
                    }));
                }
            });
        }
        renderFinal(content, gridDiv);
        return;
    }

    // --- DOORWAYS ---
    if (sub === "Conjured Doorway Skins") {
        const ownedDoorways = (accountData.home_doorways || []).map(d => String(d).toLowerCase());
        doorwayMasterList.forEach(door => {
            const isOwned = (door.id === "magic_doorway_kodan") ? true : ownedDoorways.includes(door.id.toLowerCase());
            if (isOwned === (currentTab === 'unlocked')) gridDiv.appendChild(createSlot(door));
        });
        renderFinal(content, gridDiv);
        return;
    }

    // --- JADE BOTS ---
    if (sub === "Jade Bot Skins") {
        const ownedJadeBots = (accountData.jadebots || []).map(id => Number(id));
        jadeBotMasterList.forEach(bot => {
            const isOwned = (bot.id === 1) ? true : ownedJadeBots.includes(bot.id);
            if (isOwned === (currentTab === 'unlocked')) gridDiv.appendChild(createSlot(bot));
        });
        renderFinal(content, gridDiv);
        return;
    }

    // --- STANDARD CATEGORIES ---
    const subMap = {
        "Outfits": { cat: "outfits", acc: "outfits" },
        "Gliders": { cat: "gliders", acc: "gliders" },
        "Mail Carriers": { cat: "mailcarriers", acc: "mailcarriers" },
        "Skiff Skins": { cat: "skiffs", acc: "skiffs" },
        "Novelties": { cat: "novelties", acc: "novelties" },
        "Mount Skins": { cat: "mounts", acc: "mounts" },
        "Gathering Tools": { cat: "gathering", acc: "skins" }
    };

    const target = subMap[sub] || { acc: "skins" };
    const ownedIds = (accountData[target.acc] || []).map(id => String(id));

    let itemsToProcess = index.items.filter(item => {
        if (sub === "Gathering Tools") {
            const toolMap = {
                "Mining tool skins": "Mining",
                "Logging tool skins": "Logging",
                "Harvesting tool skins": "Foraging",
                "Fishing Rod Skins": "Fishing"
            };
            return item.cat === "gathering" && item.st === toolMap[type];
        }
        return item.cat === target.cat;
    });

    itemsToProcess.forEach(item => {
        if (!item.n || item.n === "undefined") return;
        const itemId = String(item.id);
        const isOwned = ownedIds.includes(itemId);
        if (isOwned === (currentTab === 'unlocked')) {
            gridDiv.appendChild(createSlot(item));
        }
    });

    renderFinal(content, gridDiv);
}

function renderFinal(content, grid) {
    content.innerHTML = '';
    if (grid.children.length === 0) {
        content.innerHTML = `<div class="loading-text">${currentTab === 'locked' ? "ALL UNLOCKED!" : "NONE FOUND"}</div>`;
    } else {
        content.appendChild(grid);
    }
}