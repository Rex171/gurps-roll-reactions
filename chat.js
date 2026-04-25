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
    // Read result directly from CSS classes set by the GURPS system — works in any language.
    const isCritSuccess = $html.find('.crit.success').length > 0;
    const isCritFail = $html.find('.crit.failure').length > 0;
    const isFail = !isCritFail && $html.find('.failure').length > 0;

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
      if ((isFail || isCritFail) && activeBlock.failGif) finalMediaUrl = activeBlock.failGif;

      if (activeBlock.useCrit) {
        if (isCritSuccess && activeBlock.critSuccessGif) finalMediaUrl = activeBlock.critSuccessGif;
        if (isCritFail && activeBlock.critFailGif) finalMediaUrl = activeBlock.critFailGif;
      }
    } else {
      const gifData = matchedTrigger.data;
      finalMediaUrl = gifData.defaultGif;
      if ((isFail || isCritFail) && gifData.failGif) finalMediaUrl = gifData.failGif;
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