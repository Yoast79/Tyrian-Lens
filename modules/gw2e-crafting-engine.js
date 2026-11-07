var GW2CraftingEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../../GW2_Crafting_Calculator_Test/src/index.ts
  var index_exports = {};
  __export(index_exports, {
    cheapestTree: () => cheapestTree,
    craftingSteps: () => craftingSteps,
    dailyCooldowns: () => dailyCooldowns,
    nestRecipes: () => nestRecipes,
    recipeItems: () => recipeItems,
    staticItems: () => staticItems,
    updateTree: () => updateTree,
    useVendorPrices: () => useVendorPrices,
    usedItems: () => usedItems
  });

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-nesting/src/flocky.ts
  function omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }
  function compact(array) {
    return array.filter(Boolean);
  }
  function toMap(array, keyProp, valProp) {
    const map = {};
    for (const item of array) {
      const k = item[keyProp];
      if (k !== void 0 && k !== null) {
        map[k] = valProp ? item[valProp] : item;
      }
    }
    return map;
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-nesting/src/index.ts
  function nestRecipes(apiRecipes, decorationMap = {}) {
    const recipes = apiRecipes.map(transformRecipe);
    const recipesMap = toMap(recipes, "id");
    const recipeUpgradesMap = toMap(recipes, "upgrade_id", "id");
    for (const key in recipesMap) {
      const recipe = recipesMap[key];
      if (!recipe) continue;
      recipesMap[key] = nestRecipe(recipe, recipesMap, recipeUpgradesMap, decorationMap);
    }
    return compact(Object.values(recipesMap)).map((recipe) => omit(recipe, ["nested"])).filter((recipe) => recipe.components);
  }
  function transformRecipe(recipe) {
    const components = (recipe.ingredients || []).map((ingredient) => ({
      id: ingredient.id || ingredient.item_id,
      type: ingredient.type || "Item",
      quantity: ingredient.count,
      achievement_id: ingredient.achievement_id,
      achievement_bit: ingredient.achievement_bit
    }));
    return {
      id: recipe.output_item_id,
      type: "Recipe",
      nested: false,
      quantity: 1,
      output: recipe.output_item_count,
      components,
      prerequisites: recipe.id ? [{ type: "Recipe", id: recipe.id }] : [],
      min_rating: recipe.min_rating !== void 0 ? recipe.min_rating : null,
      disciplines: recipe.disciplines || [],
      upgrade_id: recipe.output_upgrade_id,
      output_range: recipe.output_item_count_range,
      achievement_id: recipe.achievement_id,
      merchant: recipe.merchant,
      multipleRecipeCount: recipe.multipleRecipeCount,
      daily_purchase_cap: recipe.daily_purchase_cap ? recipe.daily_purchase_cap : 0,
      weekly_purchase_cap: recipe.weekly_purchase_cap ? recipe.weekly_purchase_cap : 0
    };
  }
  function nestRecipe(recipe, recipesMap, recipeUpgradesMap, decorationsMap) {
    if (recipe.nested) {
      return recipe;
    }
    recipe.nested = true;
    recipe.quantity = recipe.quantity || 1;
    const components = (recipe.components || []).map((component) => {
      const isGuildUpgrade = component.type === "GuildUpgrade";
      const id = isGuildUpgrade ? recipeUpgradesMap[component.id] || component.id : component.id;
      const componentRecipe = recipesMap[id];
      const condensedLeyLineEssenceIds = [91224, 91137, 91222, 91171];
      if (component.type === "Currency") {
        return component;
      }
      if (!componentRecipe) {
        if (!isGuildUpgrade) {
          return component;
        }
        const decorationsItem = decorationsMap[component.id];
        return decorationsItem ? { id: decorationsItem, type: "Item", quantity: component.quantity } : false;
      }
      if (recipe.id === id) {
        return isGuildUpgrade ? { id, type: "Item", quantity: component.quantity } : component;
      }
      if (condensedLeyLineEssenceIds.includes(recipe.id) && condensedLeyLineEssenceIds.includes(id)) {
        return component;
      }
      if (!componentRecipe.nested) {
        recipesMap[id] = nestRecipe(componentRecipe, recipesMap, recipeUpgradesMap, decorationsMap);
      }
      return {
        ...omit(componentRecipe, ["nested"]),
        quantity: component.quantity,
        ...typeof component.achievement_id === "number" && {
          achievement_id: component.achievement_id
        },
        ...typeof component.achievement_bit === "number" && {
          achievement_bit: component.achievement_bit
        }
      };
    });
    recipe.components = compact(components);
    if (recipe.components && recipe.components.length === 0) {
      recipe.components = void 0;
    }
    return recipe;
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/calculateTreeQuantity.ts
  function calculateTreeQuantity(amount, tree, availableItems = {}, ignoredBitItemIds = []) {
    return calculateTreeQuantityInner(amount, tree, { ...availableItems }, false, 0, [
      ...ignoredBitItemIds
    ]);
  }
  function calculateTreeQuantityInner(amount, tree, availableItems, ignoreAvailable = false, nesting = 0, ignoredBitItemIds) {
    const output = tree.output || 1;
    let treeQuantity = amount * tree.quantity;
    if (typeof tree.achievement_bit === "number") {
      ignoredBitItemIds.includes(tree.id) ? treeQuantity = 0 : ignoredBitItemIds.push(tree.id);
    }
    treeQuantity = Math.ceil(treeQuantity / output) * output;
    const totalQuantity = Math.round(treeQuantity);
    let availableQuantity = 0;
    if (nesting > 0 && tree.type !== "Currency" && !ignoreAvailable && availableItems[tree.id]) {
      availableQuantity = Math.min(availableItems[tree.id], totalQuantity);
      availableItems[tree.id] -= availableQuantity;
    }
    const usedQuantity = totalQuantity - availableQuantity;
    if (!tree.components) {
      return { ...tree, components: void 0, output, totalQuantity, usedQuantity };
    }
    const componentAmount = Math.ceil(usedQuantity / output);
    ignoreAvailable = "craft" in tree && tree.craft === false || usedQuantity === 0 || ignoreAvailable;
    const components = tree.components.map((component) => {
      return calculateTreeQuantityInner(
        componentAmount,
        component,
        availableItems,
        ignoreAvailable,
        ++nesting,
        ignoredBitItemIds
      );
    });
    return { ...tree, components, output, totalQuantity, usedQuantity };
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/static/currencyDecisionPrices.ts
  var CURRENCY_DECISION_PRICES = {
    1: 1,
    // Gold
    2: 1,
    // Karma
    3: 3500,
    // Laurel
    4: 3e3,
    // Gem
    5: 32,
    // Ascalonian Tear
    6: 32,
    // Shard of Zhaitan
    7: 80,
    // Fractal Relic
    9: 32,
    // Seal of Beetletun
    10: 32,
    // Manifesto of the Moletariate
    11: 32,
    // Deadly Bloom
    12: 32,
    // Symbol of Koda
    13: 32,
    // Flame Legion Charr Carving
    14: 32,
    // Knowledge Crystal
    15: 23,
    // Badge of Honor
    16: 3600,
    // Guild Commendation
    18: void 0,
    // Transmutation Charge
    19: 70,
    // Airship Part
    20: 70,
    // Ley Line Crystal
    22: 70,
    // Lump of Aurillium
    23: 3600,
    // Spirit Shard
    24: 15 * 80,
    // Pristine Fractal Relic
    25: 100,
    // Geode
    26: 800,
    // WvW Skirmish Claim Ticket
    27: 45,
    // Bandit Crest
    28: 3600,
    // Magnetite Shard
    29: 3600,
    // Provisioner Token
    30: void 0,
    // PvP League Ticket
    31: 50,
    // Proof of Heroics
    32: 25,
    // Unbound Magic
    33: 1600,
    // Ascended Shards of Glory
    34: 9,
    // Trade Contract
    35: 720,
    // Elegy Mosaic
    36: 135,
    // Testimony of Desert Heroics
    37: void 0,
    // Exalted Key
    38: void 0,
    // Machete
    39: 3600,
    // Gaeting Crystal
    40: void 0,
    // Bandit Skeleton Key
    41: void 0,
    // Pact Crowbar
    42: void 0,
    // Vial of Chak Acid
    43: void 0,
    // Zephyrite Lockpick
    44: void 0,
    // Trader's Key
    45: 50,
    // Volatile Magic
    46: void 0,
    // PvP Tournament Voucher
    47: void 0,
    // Racing Medallion
    49: void 0,
    // Mistborn Key
    50: 25,
    // Festival Token
    51: void 0,
    // Cache Key
    52: void 0,
    // Red Prophet Shard
    53: 3500,
    // Green Prophet Shard
    54: void 0,
    // Blue Prophet Crystal
    55: void 0,
    // Green Prophet Crystal
    56: void 0,
    // Red Prophet Crystal
    57: 300,
    // Blue Prophet Shard
    58: void 0,
    // War Supplies
    59: void 0,
    // Unstable Fractal Essence
    60: 310,
    // Tyrian Defense Seal
    61: 200,
    // Research Note
    62: 100,
    // Unusual Coin
    64: 35,
    // Jade Sliver
    65: 135,
    // Testimony of Jade Heroics
    67: 35,
    // Canach Coins
    68: 320,
    // Imperial Favor
    69: 32,
    // Tales of Dungeon Delving
    70: void 0
    // Legendary Insight
  };

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/calculateTreePrices.ts
  function calculateTreePrices(tree, itemPrices, customCurrencyPrices = {}) {
    let buyPriceEach = itemPrices[tree.id] || false;
    if (tree.type === "Currency") {
      buyPriceEach = tree.id === 1 ? 1 : false;
    }
    const buyPrice = buyPriceEach ? tree.usedQuantity * buyPriceEach : false;
    let craftResultPrice = buyPrice;
    let decisionPriceEach = buyPriceEach || void 0;
    if (tree.type === "Currency") {
      if (customCurrencyPrices && typeof customCurrencyPrices[tree.id] === "number") {
        decisionPriceEach = customCurrencyPrices[tree.id];
      } else {
        decisionPriceEach = CURRENCY_DECISION_PRICES[tree.id];
      }
    }
    let decisionPrice = decisionPriceEach ? tree.usedQuantity * decisionPriceEach : false;
    if (!tree.components) {
      return {
        ...tree,
        components: void 0,
        buyPriceEach,
        buyPrice,
        decisionPrice,
        craftResultPrice,
        craftDecisionPrice: decisionPrice
      };
    }
    const components = tree.components.map(
      (component) => calculateTreePrices(component, itemPrices, customCurrencyPrices)
    );
    const craftDecisionPrice = components.map((c) => c.decisionPrice || 0).reduce((a, b) => a + b, 0);
    const craftPrice = components.map((c) => c.craftResultPrice || 0).reduce((a, b) => a + b, 0);
    if (!("craft" in tree && tree.craft === false) && ("craft" in tree && tree.craft === true || !decisionPrice || craftDecisionPrice < decisionPrice)) {
      decisionPrice = craftDecisionPrice;
      craftResultPrice = craftPrice;
    }
    craftResultPrice = craftResultPrice || craftPrice;
    decisionPrice = decisionPrice || craftDecisionPrice;
    return {
      ...tree,
      components,
      buyPriceEach,
      buyPrice,
      craftPrice,
      decisionPrice,
      craftResultPrice,
      craftDecisionPrice
    };
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/calculateTreeCraftFlags.ts
  function calculateTreeCraftFlags(tree, forceBuyItems) {
    const hasComponents = !!tree.components;
    const isUsed = tree.usedQuantity !== 0;
    const isCheaperToCraft = typeof tree.craftPrice !== "undefined" && (!tree.buyPrice || tree.decisionPrice < tree.buyPrice);
    const isForceBuy = forceBuyItems.indexOf(tree.id) !== -1;
    const craft = hasComponents && isUsed && isCheaperToCraft && !isForceBuy;
    if (!tree.components) {
      return { ...tree, components: void 0, craft };
    }
    const components = tree.components.map(
      (component) => calculateTreeCraftFlags(component, forceBuyItems)
    );
    return { ...tree, components, craft };
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/cheapestTree.ts
  function cheapestTree(amount, tree, itemPrices, availableItems = {}, forceBuyItems = [], valueOwnItems = false, userEfficiencyTiers = {
    "102306": "0",
    "102205": "0",
    "103049": "0"
  }, customCurrencyPrices = {}) {
    const ignoredBitItemIds = [];
    tree = initialTreeChecks(tree, userEfficiencyTiers, ignoredBitItemIds);
    if (valueOwnItems) {
      const treeWithQuantityWithoutAvailableItems = calculateTreeQuantity(
        amount,
        tree,
        {},
        ignoredBitItemIds
      );
      const treeWithPriceWithoutAvailableItems = calculateTreePrices(
        treeWithQuantityWithoutAvailableItems,
        itemPrices,
        customCurrencyPrices
      );
      const cheaperToBuyItemIds = getCheaperToBuyItemIds(treeWithPriceWithoutAvailableItems);
      tree = disableCraftForItemIds(tree, cheaperToBuyItemIds);
    }
    const treeWithQuantity = calculateTreeQuantity(
      amount,
      tree,
      availableItems,
      ignoredBitItemIds
    );
    const treeWithPrices = calculateTreePrices(treeWithQuantity, itemPrices, customCurrencyPrices);
    let treeWithCraftFlags = calculateTreeCraftFlags(treeWithPrices, forceBuyItems);
    treeWithCraftFlags = { ...treeWithCraftFlags, craft: true };
    const treeWithQuantityPostFlags = calculateTreeQuantity(
      amount,
      treeWithCraftFlags,
      availableItems,
      ignoredBitItemIds
    );
    return calculateTreePrices(treeWithQuantityPostFlags, itemPrices, customCurrencyPrices);
  }
  function getCheaperToBuyItemIds(tree, ids = []) {
    if (typeof tree.craftDecisionPrice === "number" && typeof tree.buyPrice === "number" && tree.buyPrice < tree.craftDecisionPrice * 0.85) {
      if (!ids.includes(tree.id)) {
        ids.push(tree.id);
      }
    }
    if (tree.components && Array.isArray(tree.components)) {
      tree.components.forEach((component) => getCheaperToBuyItemIds(component, ids));
    }
    return ids;
  }
  function disableCraftForItemIds(tree, ids) {
    if (ids.includes(tree.id)) {
      tree = { ...tree, craft: false };
    }
    if ("components" in tree && Array.isArray(tree.components)) {
      tree.components = tree.components.map(
        (component) => disableCraftForItemIds(component, ids)
      );
    }
    return tree;
  }
  function initialTreeChecks(tree, userEfficiencyTiers, ignoredBitItemIds, bitItemIds = /* @__PURE__ */ new Set(), normalItemIds = /* @__PURE__ */ new Set(), isRootNode = true) {
    collectItemDataForIgnoringBits(tree, bitItemIds, normalItemIds);
    tree = applyEfficiencyTiersToTree(tree, userEfficiencyTiers);
    if ("components" in tree && Array.isArray(tree.components)) {
      tree = {
        ...tree,
        components: tree.components.map(
          (component) => initialTreeChecks(
            component,
            userEfficiencyTiers,
            ignoredBitItemIds,
            bitItemIds,
            normalItemIds,
            false
          )
        )
      };
    }
    if (isRootNode) {
      bitItemIds.forEach((id) => {
        if (normalItemIds.has(id)) {
          ignoredBitItemIds.push(id);
        }
      });
    }
    return tree;
  }
  function collectItemDataForIgnoringBits(tree, bitItemIds, normalItemIds) {
    if (!tree.id) return;
    if (tree.type === "Currency") return;
    if (typeof tree.achievement_bit === "number") {
      bitItemIds.add(tree.id);
    } else {
      normalItemIds.add(tree.id);
    }
  }
  function applyEfficiencyTiersToTree(tree, userEfficiencyTiers) {
    if (!tree.id) return tree;
    const id = tree.id ? tree.id.toString() : "";
    if (!["102306", "102205", "103049"].includes(id) || !tree.merchant || !tree.merchant.name.includes("Homestead Refinement")) {
      return tree;
    }
    const efficiencyTier = Number(userEfficiencyTiers[id]);
    if (!(efficiencyTier > 0)) return tree;
    const component = { ...tree.components[0] };
    component.quantity = component.quantity / (efficiencyTier * 2);
    if (component.id === 12142) {
      component.quantity = efficiencyTier === 1 ? 1 : 0.5;
    }
    if (component.id === 12135) {
      component.quantity = efficiencyTier === 1 ? 8 : 4;
    }
    let updatedTree = {
      ...tree,
      output: component.quantity < 1 ? tree.output * 2 : tree.output
    };
    if (component.id === 19699 && efficiencyTier === 2) {
      updatedTree.output = updatedTree.output / 2;
    }
    component.quantity = component.quantity < 1 ? 1 : component.quantity;
    updatedTree = { ...updatedTree, components: [component, ...tree.components.slice(1)] };
    tree = updatedTree;
    return tree;
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/craftingSteps.ts
  var MYSTIC_CLOVER_ID = 19675;
  function craftingSteps(tree) {
    let steps = craftingStepsInner(tree).reverse();
    steps = steps.filter((step) => step.quantity > 0);
    const mysticCloverSteps = steps.filter((step) => step.id === MYSTIC_CLOVER_ID);
    steps = steps.filter((step) => step.id !== MYSTIC_CLOVER_ID);
    steps = [...mysticCloverSteps, ...steps];
    const merchantSteps = steps.filter(isMerchantWithNoDependencies).sort((a, b) => a.merchant?.name.localeCompare(b.merchant?.name || "") || 0);
    steps = steps.filter((step) => !isMerchantWithNoDependencies(step));
    steps = [...merchantSteps, ...steps];
    return steps.map((step) => ({
      ...step,
      // Calculate how many times you actually have to click on "craft"
      // for items with output > 1 (calculate here when all steps are aggregated)
      crafts: Math.ceil(step.quantity / step.output),
      output: void 0
    }));
  }
  function craftingStepsInner(tree, steps = [], index = 0) {
    const treeComponents = tree.components;
    if (!treeComponents || tree.craft === false || tree.type === "Currency") {
      return steps;
    }
    const hasCraftedComponents = treeComponents.some((component) => component.craft);
    const stepIndex = steps.findIndex((step) => step.id === tree.id);
    if (stepIndex !== -1) {
      steps[stepIndex].quantity += tree.usedQuantity;
      steps[stepIndex].components = steps[stepIndex].components.map((component) => {
        const treeComponent = treeComponents.find((x) => x.id === component.id);
        component.quantity += treeComponent.totalQuantity;
        return component;
      });
      if (hasCraftedComponents) {
        steps[stepIndex].hasCraftedComponents = hasCraftedComponents;
      }
      index = stepIndex;
    }
    if (stepIndex === -1) {
      steps.splice(index, 0, {
        id: tree.id,
        type: tree.type,
        output: tree.output,
        quantity: tree.usedQuantity,
        minRating: tree.min_rating,
        disciplines: tree.disciplines,
        merchant: tree.merchant,
        prerequisites: tree.prerequisites,
        components: treeComponents.map((component) => ({
          id: component.id,
          type: component.type,
          quantity: component.totalQuantity
        })),
        hasCraftedComponents
      });
    }
    treeComponents.map((component) => craftingStepsInner(component, steps, index + 1));
    return steps;
  }
  function isMerchantWithNoDependencies(step) {
    return step.disciplines.length === 1 && step.disciplines[0] === "Merchant" && !step.hasCraftedComponents;
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/static/dailyCooldowns.ts
  var DAILY_COOLDOWNS = [
    { id: 46745, tradable: false, craftInterval: "daily" },
    // Spool of Thick Elonian Cord
    { id: 46740, tradable: false, craftInterval: "daily" },
    // Spool of Silk Weaving Thread
    { id: 46742, tradable: false, craftInterval: "daily" },
    // Lump of Mithrillium
    { id: 46744, tradable: false, craftInterval: "daily" },
    // Glob of Elder Spirit Residue
    { id: 43772, tradable: false, craftInterval: "daily" },
    // Charged Quartz Crystal
    { id: 46738, tradable: true },
    // Deldrimor Steel Ingot
    { id: 80714, tradable: true },
    // Carbonized Mithrillium Ingot
    { id: 46736, tradable: true },
    // Spiritwood Plank
    { id: 80791, tradable: true },
    // Composite Wood Board
    { id: 46739, tradable: true },
    // Elonian Leather Square
    { id: 80723, tradable: true },
    // Blended Leather Sheet
    { id: 46741, tradable: true },
    // Bolt of Damask
    { id: 80775, tradable: true },
    // Square of Vabbian Silk
    { id: 79763, tradable: true },
    // Gossamer Stuffing
    { id: 66913, tradable: true, craftInterval: "daily" },
    // Clay Pot
    { id: 66993, tradable: true, craftInterval: "daily" },
    // Grow Lamp
    { id: 66917, tradable: true, craftInterval: "daily" },
    // Plate of Meaty Plant Food
    { id: 66923, tradable: true, craftInterval: "daily" },
    // Plate of Piquant Plant Food
    { id: 67377, tradable: true, craftInterval: "daily" },
    // Vial of Maize Balm
    { id: 67015, tradable: true, craftInterval: "daily" },
    // Heat Stone
    { id: 91701, tradable: true, craftInterval: "daily" },
    // Cultivated Sesame Seed
    { id: 91715, tradable: true, craftInterval: "daily" },
    // Cultivated Cilantro Leaf
    { id: 91793, tradable: true, craftInterval: "daily" },
    // Cultivated Mint Leaf
    { id: 91796, tradable: true, craftInterval: "daily" },
    // Cultivated Clove
    { id: 91869, tradable: true, craftInterval: "daily" }
    // Cultivated Peppercorn
  ];

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/helpers/dailyCooldowns.ts
  var dailyCooldownIds = DAILY_COOLDOWNS.filter((x) => x.craftInterval === "daily").map((x) => x.id);
  function dailyCooldowns(tree, breakdown = {}) {
    if (!tree.components || tree.craft === false || tree.type === "Currency") {
      return breakdown;
    }
    if (dailyCooldownIds.indexOf(tree.id) !== -1) {
      breakdown[tree.id] = (breakdown[tree.id] || 0) + tree.usedQuantity;
    }
    const dailyCap = tree.daily_purchase_cap ? tree.daily_purchase_cap : 0;
    const weeklyCap = tree.weekly_purchase_cap ? tree.weekly_purchase_cap : 0;
    if (dailyCap + weeklyCap > 0) {
      breakdown[tree.id] = (breakdown[tree.id] || 0) + tree.usedQuantity;
    }
    tree.components.map((component) => dailyCooldowns(component, breakdown));
    return breakdown;
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/helpers/recipeItems.ts
  function recipeItems(tree) {
    if (tree.type === "Currency") {
      return [];
    }
    let ids = [tree.id];
    if (!tree.components) {
      return ids;
    }
    tree.components.map((component) => {
      ids = ids.concat(recipeItems(component));
    });
    ids = ids.filter((value, index, self) => self.indexOf(value) === index);
    return ids;
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/helpers/useVendorPrices.ts
  function useVendorPrices(priceMap) {
    return priceMap;
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/updateTree.ts
  function updateTree(amount, tree, itemPrices, availableItems = {}, customCurrencyPrices = {}) {
    const treeWithQuantity = calculateTreeQuantity(amount, tree, availableItems);
    return calculateTreePrices(treeWithQuantity, itemPrices, customCurrencyPrices);
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/usedItems.ts
  function usedItems(tree, breakdown = {
    buy: {},
    available: {},
    currency: {}
  }) {
    const available = tree.totalQuantity - tree.usedQuantity;
    if (available > 0) {
      breakdown.available[tree.id] = (breakdown.available[tree.id] || 0) + available;
    }
    if (!tree.components || tree.craft === false) {
      if (tree.usedQuantity > 0) {
        if (tree.type === "Currency") {
          breakdown.currency[tree.id] = (breakdown.currency[tree.id] || 0) + tree.usedQuantity;
        } else {
          breakdown.buy[tree.id] = (breakdown.buy[tree.id] || 0) + tree.usedQuantity;
        }
      }
      return breakdown;
    }
    tree.components.map((component) => usedItems(component, breakdown));
    return breakdown;
  }

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/static/vendorItems.ts
  var VENDOR_ITEMS = {};

  // ../../GW2_Crafting_Calculator_Test/vendor/recipe-calculation/src/index.ts
  var staticItems = {
    dailyCooldowns: DAILY_COOLDOWNS.map((x) => x.id),
    buyableDailyCooldowns: DAILY_COOLDOWNS.filter((x) => x.tradable).map((x) => x.id),
    vendorItems: VENDOR_ITEMS
  };
  return __toCommonJS(index_exports);
})();
