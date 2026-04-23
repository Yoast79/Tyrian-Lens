if (typeof armorHierarchy !== 'undefined') {
    armorHierarchy["Home Instance"] = {
        "Cats": "Direct",
        "Nodes": "Direct"
    };
}

async function loadHomeData(el, index) {
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid';
    const { sub } = el.dataset;
    const fallbackIcon = "https://wiki.guildwars2.com/images/7/75/Mini_Orange_Tabby_Cat.png";
    const scavengerWiki = "https://wiki.guildwars2.com/wiki/Hungry_cat_scavenger_hunt";

    const activeTab = typeof currentTab !== 'undefined' ? currentTab : 'unlocked';

    if (sub === "Cats") {
        const catMap = {
            1: { n: "Grilled Poultry Cat", i: "https://wiki.guildwars2.com/images/9/95/Grilled_Poultry.png" },
            2: { n: "Simple Poultry Soup Cat", i: "https://wiki.guildwars2.com/images/5/5a/Bowl_of_Simple_Poultry_Soup.png" },
            3: { n: "Ginger-Lime Ice Cream Cat", i: "https://wiki.guildwars2.com/images/9/97/Bowl_of_Ginger-Lime_Ice_Cream.png" },
            4: { n: "Fire Flank Steak Cat", i: "https://wiki.guildwars2.com/images/2/27/Plate_of_Fire_Flank_Steak.png" },
            5: { n: "Strawberry Ghost Cat", i: "https://wiki.guildwars2.com/images/2/25/Strawberry_Ghost.png" },
            6: { n: "Pumpkin Oil Cat", i: "https://wiki.guildwars2.com/images/7/71/Flask_of_Pumpkin_Oil.png" },
            7: { n: "Snow Leopard Cub", i: fallbackIcon },
            8: { n: "Lady Wisteria Whiskington", i: fallbackIcon },
            9: { n: "Frog in a Jar Cat", i: "https://wiki.guildwars2.com/images/1/13/Frog_in_a_Jar.png" },
            10: { n: "Spicy Flank Steak Cat", i: "https://wiki.guildwars2.com/images/3/35/Spicy_Flank_Steak.png" },
            11: { n: "Curry Mussel Soup Cat", i: "https://wiki.guildwars2.com/images/c/ca/Bowl_of_Curry_Mussel_Soup.png" },
            12: { n: "Vanilla Bean Cat", i: "https://wiki.guildwars2.com/images/1/1f/Vanilla_Bean.png" },
            13: { n: "Poultry and Leek Soup Cat", i: "https://wiki.guildwars2.com/images/b/ba/Bowl_of_Poultry_and_Leek_Soup.png" },
            14: { n: "Spicy Meat Chili Cat", i: "https://wiki.guildwars2.com/images/8/80/Can_of_Spicy_Meat_Chili.png" },
            15: { n: "Spicier Flank Steak Cat", i: "https://wiki.guildwars2.com/images/0/01/Spicier_Flank_Steak.png" },
            16: { n: "Harpy Feathers Cat", i: "https://wiki.guildwars2.com/images/4/4c/Harpy_Feathers.png" },
            17: { n: "Carrot Cat", i: "https://wiki.guildwars2.com/images/c/c3/Carrot.png" },
            18: { n: "Cheeseburger Cat", i: "https://wiki.guildwars2.com/images/1/11/Cheeseburger.png" },
            19: { n: "Tonic Cat", i: "https://wiki.guildwars2.com/images/e/e7/Tonic.png" },
            20: { n: "Mercenary Coin Cat", i: "https://wiki.guildwars2.com/images/0/02/Bag_of_Coins.png" },
            21: { n: "Ghost Pepper Cat", i: "https://wiki.guildwars2.com/images/f/f0/Ghost_Pepper.png" },
            22: { n: "Prickly Pear Sorbet Cat", i: "https://wiki.guildwars2.com/images/f/f0/Bowl_of_Prickly_Pear_Sorbet.png" },
            23: { n: "Slab of Poultry Meat Cat", i: "https://wiki.guildwars2.com/images/e/ee/Slab_of_Poultry_Meat.png" },
            24: { n: "Lemongrass Poultry Soup Cat", i: "https://wiki.guildwars2.com/images/f/f9/Bowl_of_Lemongrass_Poultry_Soup.png" },
            25: { n: "Winter Vegetable Soup Cat", i: "https://wiki.guildwars2.com/images/0/05/Bowl_of_Poultry_and_Winter_Vegetable_Soup.png" },
            26: { n: "Ascalonian Flank Steak Cat", i: "https://wiki.guildwars2.com/images/2/27/Plate_of_Fire_Flank_Steak.png" },
            27: { n: "Peach Raspberry Swirl Ice Cream Cat", i: "https://wiki.guildwars2.com/images/9/92/Bowl_of_Peach_Raspberry_Swirl_Ice_Cream.png" },
            28: { n: "Bloodstone Bisque Cat (Orr)", i: "https://wiki.guildwars2.com/images/1/14/Bowl_of_Bloodstone_Bisque.png" },
            29: { n: "White Feline (Raid)", i: "https://wiki.guildwars2.com/images/8/8c/Bowl_of_Saffron-Mango_Ice_Cream.png" },
            30: { n: "Grumble Cake Cat (SAB)", i: "https://wiki.guildwars2.com/images/b/b8/Grumble_Cake.png" },
            31: { n: "Strike Mission Cat", i: fallbackIcon },
            32: { n: "Blue Catmander", i: "https://wiki.guildwars2.com/images/2/25/Gift_of_Battle.png" },
            33: { n: "Yellow Catmander", i: "https://wiki.guildwars2.com/images/2/25/Gift_of_Battle.png" },
            34: { n: "Holographic Cat", i: "https://wiki.guildwars2.com/images/a/a1/Slice_of_Rainbow_Cake.png" },
            35: { n: "Simon the Celestial Cat", i: "https://wiki.guildwars2.com/images/f/f6/Integrated_Fractal_Matrix.png" },
            36: { n: "Bloodstone Bisque Cat (Grawnk)", i: "https://wiki.guildwars2.com/images/1/14/Bowl_of_Bloodstone_Bisque.png" },
            37: { n: "Bloodstone-Crazed Cat", i: "https://wiki.guildwars2.com/images/1/14/Bowl_of_Bloodstone_Bisque.png" }
        };

        const ownedRaw = accountData.home_cats || [];
        
        const ownedIds = new Set(ownedRaw.map(cat => {
            return typeof cat === 'object' ? parseInt(cat.id) : parseInt(cat);
        }));

        // Manual override for missing API IDs
        ownedIds.add(31); // Force Strike Mission Cat
        ownedIds.add(33); // Force Yellow Catmander

        if (activeTab === 'unlocked') {
            ownedIds.forEach(id => {
                const data = catMap[id];
                if (data) {
                    const slot = createSlot({ id: id, n: data.n, i: data.i, w: scavengerWiki });
                    slot.onclick = () => window.open(scavengerWiki, 'gw2wiki');
                    gridDiv.appendChild(slot);
                }
            });
        } else if (activeTab === 'locked') {
            Object.keys(catMap).forEach(id => {
                const numId = parseInt(id);
                if (!ownedIds.has(numId)) {
                    const data = catMap[id];
                    const slot = createSlot({ id: numId, n: data.n, i: data.i, w: scavengerWiki });
                    slot.onclick = () => window.open(scavengerWiki, 'gw2wiki');
                    gridDiv.appendChild(slot);
                }
            });
        }
    } else if (sub === "Nodes") {
        const nodeImages = {
            "airship_cargo": { n: "Airship Cargo", i: "https://wiki.guildwars2.com/images/c/cc/Personal_Airship_Cargo_Voucher.png" },
            "aurilium_node": { n: "Aurillium Node", i: "https://wiki.guildwars2.com/images/7/74/Aurillium_Node.png" },
            "bandit_chest": { n: "Found Bandit Chest", i: "https://wiki.guildwars2.com/images/b/b6/Personal_Bandit_Chest.png" },
            "bauble_gathering_system": { n: "Bauble Gathering System", i: "https://wiki.guildwars2.com/images/b/ba/Disasembler_3BEK_Kit.png" },
            "bound_hatched_chili_pepper_node": { n: "Bound Hatched Chili Pepper Node", i: "https://wiki.guildwars2.com/images/f/f4/Hatched_Chili_Pepper_Home_Instance_Node.png" },
            "candy_corn_node": { n: "Raw Candy Corn", i: "https://wiki.guildwars2.com/images/4/44/Gift_of_Candy_Corn.png" },
            "king_sized_candy_corn": { n: "King-Sized Candy Corn", i: "https://wiki.guildwars2.com/images/4/44/Gift_of_Candy_Corn.png" },
            "crystallized_supply_cache": { n: "Crystallized Supply Cache", i: "https://wiki.guildwars2.com/images/9/93/Personal_Crystallized_Supply_Cache_Voucher.png" },
            "dragon_crystal": { n: "Dragon Crystal Node", i: "https://wiki.guildwars2.com/images/2/2f/Dragon_Crystal_Home_Instance_Node.png" },
            "eternal_ice_shard_node": { n: "Eternal Ice Shard Node", i: "https://wiki.guildwars2.com/images/f/f1/Eternal_Ice_Shard_Home_Instance_Node.png" },
            "exalted_chest": { n: "Exalted Chest", i: "https://wiki.guildwars2.com/images/6/62/Personal_Exalted_Chest_Voucher.png" },
            "iron_ore_node": { n: "Iron Ore Mining Node", i: "https://wiki.guildwars2.com/images/4/4a/Iron_Ore_Mining_Node.png" },
            "kournan_supply_cache": { n: "Kournan Supply Cache", i: "https://wiki.guildwars2.com/images/1/1f/Supply_Cache_%28item%29.png" },
            "krait_obelisk": { n: "Krait Obelisk Shard", i: "https://wiki.guildwars2.com/images/0/07/Krait_Obelisk_Shard_%28item%29.png" },
            "mistborn_mote": { n: "Mistborn Mote Node", i: "https://wiki.guildwars2.com/images/5/59/Mistborn_Mote_Home_Instance_Node.png" },
            "mithril_ore_node": { n: "Mithril Mining Node", i: "https://wiki.guildwars2.com/images/4/44/Basic_Ore_Node_Pack.png" },
            "platinum_ore_node": { n: "Platinum Mining Node", i: "https://wiki.guildwars2.com/images/4/44/Basic_Ore_Node_Pack.png" },
            "prismaticite_node": { n: "Prismaticite Home Instance Node", i: "https://wiki.guildwars2.com/images/f/f5/Prismaticite_Home_Instance_Node.png" },
            "quartz_node": { n: "Quartz Node", i: "https://wiki.guildwars2.com/images/7/7c/Gift_of_Quartz.png" },
            "salvage_pile": { n: "Salvage Pile", i: "https://wiki.guildwars2.com/images/a/a8/Salvage_Pile_Home_Instance_Node.png" },
            "sprocket_generator": { n: "Sprocket Generator", i: "https://wiki.guildwars2.com/images/7/7e/Gift_of_Sprockets.png" },
            "winterberry_bush": { n: "Winterberry Bush Node", i: "https://wiki.guildwars2.com/images/9/9c/Winterberry_Bush_Node.png" },
            "wintersday_tree": { n: "Wintersday Tree of Generosity", i: "https://wiki.guildwars2.com/images/4/4a/Gift_of_Magnanimity.png" },
            "basic_ore_nodes": { n: "Basic Ore Node Pack", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Basic_Ore_Node_Pack.png" },
            "basic_lumber_nodes": { n: "Basic Lumber Node Pack", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Basic_Lumber_Node_Pack.png" },
            "basic_harvesting_nodes": { n: "Basic Harvesting Node Pack", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Basic_Harvesting_Node_Pack.png" },
            "orichalcum_ore_node": { n: "Orichalcum Mining Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Orichalcum_Mining_Node.png" },
            "hard_wood_node": { n: "Hard Wood Logging Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Hard_Wood_Logging_Node.png" },
            "elder_wood_node": { n: "Elder Wood Logging Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Elder_Wood_Logging_Node.png" },
            "ancient_wood_node": { n: "Ancient Wood Logging Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Ancient_Wood_Logging_Node.png" },
            "lotus_node": { n: "Lotus Harvesting Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Lotus_Harvesting_Node.png" },
            "omnomberry_node": { n: "Omnomberry Harvesting Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Omnomberry_Harvesting_Node.png" },
            "ghost_pepper_node": { n: "Ghost Pepper Harvesting Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Ghost_Pepper_Harvesting_Node.png" },
            "snow_truffle_node": { n: "Snow Truffle Harvesting Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Snow_Truffle_Harvesting_Node.png" },
            "orrian_truffle_node": { n: "Orrian Truffle Harvesting Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Orrian_Truffle_Harvesting_Node.png" },
            "flaxseed_node": { n: "Flaxseed Harvesting Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Flaxseed_Harvesting_Node.png" },
            "commemorative_dragon_pinata": { n: "Commemorative Dragon Piñata", i: "https://render.guildwars2.com/file/C247F12B1F9454A5CF0D075E6057286DA5C8F8E8/2306760.png" },
            "bloodstone_crystals": { n: "Bloodstone Crystal Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Bloodstone_Crystal_Node.png" },
            "petrified_stump": { n: "Petrified Wood Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Petrified_Wood_Node.png" },
            "jade_fragment": { n: "Jade Fragment Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Jade_Fragment_Node.png" },
            "primordial_orchid": { n: "Fire Orchid Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Fire_Orchid_Node.png" },
            "orrian_oyster_node": { n: "Orrian Oyster Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Orrian_Oyster_Node.png" },
            "brandstone_node": { n: "Brandstone Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Brandstone_Node.png" },
            "difluorite_crystal_cluster_node": { n: "Difluorite Crystal Cluster Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Difluorite_Crystal_Cluster_Node.png" },
            "mistonium_node": { n: "Mistonium Node", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Mistonium_Node.png" },
            "basic_cloth_rack": { n: "Basic Cloth Rack", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Basic_Cloth_Rack.png" },
            "advanced_cloth_rack": { n: "Advanced Cloth Rack", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Advanced_Cloth_Rack.png" },
            "basic_leather_rack": { n: "Basic Leather Rack", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Basic_Leather_Rack.png" },
            "advanced_leather_rack": { n: "Advanced Leather Rack", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Advanced_Leather_Rack.png" },
            "black_lion_expedition_board": { n: "Black Lion Expedition Board", i: "https://wiki.guildwars2.com/images/0/0a/Black_Lion_Hunters_Contract.png" },
            "black_lion_expedition_board_s4": { n: "Season 4 Expedition Board", i: "https://wiki.guildwars2.com/images/0/0a/Black_Lion_Hunters_Contract.png" },
            "black_lion_hunters_board": { n: "Black Lion Hunter's Board", i: "https://wiki.guildwars2.com/images/0/0a/Black_Lion_Hunters_Contract.png" },
            "black_lion_industry_board": { n: "Black Lion Industry Board", i: "https://wiki.guildwars2.com/images/0/0a/Black_Lion_Hunters_Contract.png" }
        };

        const ownedNodes = accountData.nodes || [];

        if (activeTab === 'unlocked') {
            const processedNodes = new Set();
            const gardenPlots = ownedNodes.filter(id => id.startsWith('garden_plot'));
            const hasRawCorn = ownedNodes.includes('candy_corn_node');
            const hasKingCorn = ownedNodes.includes('king_sized_candy_corn');

            ownedNodes.forEach(nodeId => {
                if (processedNodes.has(nodeId)) return;

                if (nodeId.startsWith('garden_plot')) {
                    if (processedNodes.has('garden_plots')) return;
                    gridDiv.appendChild(createSlot({ id: 'garden_plots', n: "Black Lion Garden Plot Deed", i: "https://wiki.guildwars2.com/wiki/Special:FilePath/Black_Lion_Garden_Plot_Deed.png" }, gardenPlots.length));
                    processedNodes.add('garden_plots');
                    gardenPlots.forEach(p => processedNodes.add(p));
                } else if (nodeId === 'candy_corn_node' || nodeId === 'king_sized_candy_corn') {
                    if (processedNodes.has('candy_corn_stack')) return;
                    if (hasRawCorn && hasKingCorn) {
                        gridDiv.appendChild(createSlot({ id: 'candy_corn_stack', n: "King-Sized Candy Corn Upgrade", i: nodeImages['king_sized_candy_corn'].i }, 2));
                        processedNodes.add('candy_corn_stack');
                        processedNodes.add('candy_corn_node');
                        processedNodes.add('king_sized_candy_corn');
                    } else {
                        gridDiv.appendChild(createSlot({ id: nodeId, n: nodeImages[nodeId].n, i: nodeImages[nodeId].i }));
                        processedNodes.add(nodeId);
                    }
                } else if (nodeImages[nodeId]) {
                    gridDiv.appendChild(createSlot({ id: nodeId, n: nodeImages[nodeId].n, i: nodeImages[nodeId].i }));
                    processedNodes.add(nodeId);
                }
            });
        } else if (activeTab === 'locked') {
            Object.keys(nodeImages).forEach(nodeId => {
                if (!ownedNodes.includes(nodeId)) {
                    gridDiv.appendChild(createSlot({
                        id: nodeId,
                        n: nodeImages[nodeId].n,
                        i: nodeImages[nodeId].i
                    }));
                }
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