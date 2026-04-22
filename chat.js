(() => {
  Hooks.on("renderChatMessage", async (message, html) => {
    if (game.system.id !== "gurps") return;
    const $html = html instanceof jQuery ? html : $(html);
    if ($html.find('.gga-chat-message').length === 0) return;

    let actor = game.actors.get(message.speaker?.actor);
    if (!actor && message.speaker?.token) {
      const token = canvas.tokens?.get(message.speaker.token);
      if (token) actor = game.actors.get(token.document.actorId);
    }
    if (!actor) return;

    const allText = $html.text().replace(/\s+/g, ' ').trim();
    const cleanText = $html.text().replace(/[\s\n\r\-!.,_]+/g, '').toLowerCase();

    // --- ROLL DETECTORS ---
    // margin = effectiveSkill - roll (negative on failure), so effectiveSkill = roll + margin.
    // This correctly accounts for all modifiers without any text parsing.
    const roll = message.rolls?.[0]?._total;
    const margin = message.rolls?.[0]?.data?.margin;

    let isCritSuccess, isCritFail, isFail;

    if (roll != null && margin != null) {
      const effectiveSkill = roll + margin;
      ({ isCritSuccess, isCritFail, isFail } = GRR_Shared.evaluateRoll(roll, effectiveSkill));
    } else {
      // Fallback to text detection if roll data is unavailable
      isCritSuccess = cleanText.includes("criticalsuccess") || (cleanText.includes("крит") && cleanText.includes("успех"));
      isCritFail = cleanText.includes("criticalfailure") || (cleanText.includes("крит") && (cleanText.includes("провал") || cleanText.includes("неудач")));
      isFail = cleanText.includes("failure") || cleanText.includes("miss") || cleanText.includes("неудач") || cleanText.includes("провал") || cleanText.includes("промах")
        || $html.find('.failure, [class*="fail"], .bad, [class*="bad"]').length > 0;
    }

    // --- TRIGGER POOL ---
    const { weapons: wpnGifs, skills: skillGifs, universal: univGifs } = GRR_Shared.getActorReactions(actor);

    let allTriggers = [];

    const decodeKey = GRR_Shared.decodeKey;
    for (const [k, v] of Object.entries(wpnGifs)) if (k.trim()) allTriggers.push({ name: decodeKey(k), data: v, type: 'weapon' });
    for (const [k, v] of Object.entries(skillGifs)) if (k.trim()) allTriggers.push({ name: decodeKey(k), data: v, type: 'simple' });
    for (const [k, v] of Object.entries(univGifs)) if (k.trim()) allTriggers.push({ name: decodeKey(k), data: v, type: 'simple' });

    allTriggers.sort((a, b) => b.name.length - a.name.length);

    let matchedTrigger = null;
    for (const trigger of allTriggers) {
      if (allText.includes(trigger.name)) {
        matchedTrigger = trigger;
        break;
      }
    }

    if (!matchedTrigger) return;

    let finalMediaUrl = "";

    // --- MEDIA SELECTION ---
    if (matchedTrigger.type === 'weapon') {
      const wData = matchedTrigger.data;
      const isParry = cleanText.includes("parry:") || cleanText.includes("парир") || cleanText.includes("p:") || cleanText.includes("р:");
      const isBlock = cleanText.includes("block:") || cleanText.includes("блок");

      let activeBlock = wData.atk;
      if (isParry && wData.parry.enabled) activeBlock = wData.parry;
      else if (isBlock && wData.block.enabled) activeBlock = wData.block;
      else if ((isParry && !wData.parry.enabled) || (isBlock && !wData.block.enabled)) return;

      finalMediaUrl = activeBlock.defaultGif;
      if (isFail && activeBlock.failGif) finalMediaUrl = activeBlock.failGif;

      if (activeBlock.useCrit) {
        if (isCritSuccess && activeBlock.critSuccessGif) finalMediaUrl = activeBlock.critSuccessGif;
        if (isCritFail && activeBlock.critFailGif) finalMediaUrl = activeBlock.critFailGif;
      }
    } else {
      const gifData = matchedTrigger.data;
      finalMediaUrl = gifData.defaultGif;
      if (isFail && gifData.failGif) finalMediaUrl = gifData.failGif;
      if (isCritSuccess && gifData.critSuccessGif) finalMediaUrl = gifData.critSuccessGif;
      if (isCritFail && gifData.critFailGif) finalMediaUrl = gifData.critFailGif;
    }

    if (!finalMediaUrl) return;

    // --- RENDER ---
    const enableGlow = game.settings.get(GRR_Shared.MODULE_ID, "enableGlow");
    const borderStyle = GRR_Shared.calculateBorderStyle(enableGlow, isCritSuccess, isCritFail);
    $html.find('.message-content').first().append(GRR_Shared.buildMediaHTML(finalMediaUrl, borderStyle));
  });
})();